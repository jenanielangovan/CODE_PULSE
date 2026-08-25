import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';
import { CodeReviewResponse, HistoricalInsight, RecurringWeakness } from './types.js';

/**
 * Attempts to load a file from multiple candidate paths.
 */
function loadPromptFile(relativePath: string): string {
  const pathsToTry = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), '..', relativePath),
    path.join(__dirname || '', '../../../', relativePath),
  ];
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  throw new Error(`Could not locate prompt file: ${relativePath}`);
}

export class GeminiService {
  private vertexAI: VertexAI;
  private modelName: string;

  constructor() {
    const projectId = process.env.GCP_PROJECT_ID || 'codepulse-development';
    const location = process.env.GCP_LOCATION || 'us-central1';
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';

    if (!process.env.GCP_PROJECT_ID) {
      console.warn('[GeminiService]: GCP_PROJECT_ID is not set. Vertex AI will use fallback configuration.');
    }

    this.vertexAI = new VertexAI({ project: projectId, location });
  }

  /**
   * Analyzes source code and returns a structured review.
   * This is the primary code review method — takes raw code (not just diffs).
   */
  public async analyzeCode(
    code: string,
    language: string = 'Unknown'
  ): Promise<CodeReviewResponse> {
    const template = loadPromptFile('prompts/code-review.md');
    const prompt = template
      .replace('{{code}}', code)
      .replace('{{language}}', language);

    const model = this.vertexAI.getGenerativeModel({ model: this.modelName });

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        overallScore: { type: 'INTEGER' },
        language: { type: 'STRING' },
        summary: { type: 'STRING' },
        categories: {
          type: 'OBJECT',
          properties: {
            correctness: { type: 'INTEGER' },
            security: { type: 'INTEGER' },
            performance: { type: 'INTEGER' },
            maintainability: { type: 'INTEGER' },
            readability: { type: 'INTEGER' },
          },
          required: ['correctness', 'security', 'performance', 'maintainability', 'readability'],
        },
        findings: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              severity: { type: 'STRING', enum: ['info', 'low', 'medium', 'high', 'critical'] },
              category: { type: 'STRING', enum: ['correctness', 'security', 'performance', 'maintainability', 'readability'] },
              line: { type: 'INTEGER' },
              title: { type: 'STRING' },
              explanation: { type: 'STRING' },
              suggestion: { type: 'STRING' },
            },
            required: ['severity', 'category', 'line', 'title', 'explanation', 'suggestion'],
          },
        },
        strengths: { type: 'ARRAY', items: { type: 'STRING' } },
        priorityActions: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['overallScore', 'language', 'summary', 'categories', 'findings', 'strengths', 'priorityActions'],
    };

    const request = {
      contents: [{ role: 'user' as const, parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as any,
      },
    };

    try {
      const result = await model.generateContent(request);
      const response = result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      const parsed = JSON.parse(text) as CodeReviewResponse;
      return this.validateCodeReviewResponse(parsed, language);
    } catch (error) {
      console.error('[GeminiService]: Error generating code review:', error);
      throw error;
    }
  }

  /**
   * Generates historical intelligence by comparing current review with past reviews.
   * This is the core differentiator of CodePulse.
   */
  public async generateHistoricalInsight(
    currentReview: CodeReviewResponse,
    historicalScores: Array<{ score: number; categories: Record<string, number>; findings: Array<{ title: string; severity: string }> }>
  ): Promise<HistoricalInsight> {
    const template = loadPromptFile('prompts/historical-analysis.md');

    const historyText = historicalScores.map((h, i) =>
      `Review ${i + 1}: Overall=${h.score}, Categories=${JSON.stringify(h.categories)}, ` +
      `Findings: ${h.findings.map(f => f.title).join(', ')}`
    ).join('\n');

    const currentText = `Current Review: Overall=${currentReview.overallScore}, ` +
      `Categories=${JSON.stringify(currentReview.categories)}, ` +
      `Findings: ${currentReview.findings.map(f => `${f.title} (${f.severity})`).join(', ')}`;

    const prompt = template
      .replace('{{history}}', historyText)
      .replace('{{current}}', currentText);

    const model = this.vertexAI.getGenerativeModel({ model: this.modelName });

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        improvements: { type: 'ARRAY', items: { type: 'STRING' } },
        regressions: { type: 'ARRAY', items: { type: 'STRING' } },
        recurringWeaknesses: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              topic: { type: 'STRING' },
              count: { type: 'INTEGER' },
              severity: { type: 'STRING' },
            },
            required: ['topic', 'count', 'severity'],
          },
        },
        resolvedWeaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
        recommendation: { type: 'STRING' },
        overallTrend: { type: 'STRING', enum: ['improving', 'declining', 'stable'] },
      },
      required: ['improvements', 'regressions', 'recurringWeaknesses', 'resolvedWeaknesses', 'recommendation', 'overallTrend'],
    };

    const request = {
      contents: [{ role: 'user' as const, parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as any,
      },
    };

    try {
      const result = await model.generateContent(request);
      const response = result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini returned empty historical insight response.');
      }

      return JSON.parse(text) as HistoricalInsight;
    } catch (error) {
      console.error('[GeminiService]: Error generating historical insight:', error);
      // Return a safe fallback rather than throwing
      return {
        improvements: [],
        regressions: [],
        recurringWeaknesses: [],
        resolvedWeaknesses: [],
        recommendation: 'Continue improving code quality across all dimensions.',
        overallTrend: 'stable',
      };
    }
  }

  /**
   * Validates and normalizes Gemini review output — prevents bad data from reaching Firestore.
   */
  private validateCodeReviewResponse(raw: any, detectedLanguage: string): CodeReviewResponse {
    const clamp = (v: unknown, fallback = 70) =>
      Math.max(0, Math.min(100, typeof v === 'number' ? v : fallback));

    return {
      overallScore: clamp(raw.overallScore),
      language: typeof raw.language === 'string' && raw.language.length > 0
        ? raw.language
        : detectedLanguage,
      summary: typeof raw.summary === 'string' ? raw.summary : 'Code review completed.',
      categories: {
        correctness: clamp(raw.categories?.correctness),
        security: clamp(raw.categories?.security),
        performance: clamp(raw.categories?.performance),
        maintainability: clamp(raw.categories?.maintainability),
        readability: clamp(raw.categories?.readability),
      },
      findings: Array.isArray(raw.findings)
        ? raw.findings.map((f: any) => ({
            severity: ['info', 'low', 'medium', 'high', 'critical'].includes(f.severity)
              ? f.severity
              : 'low',
            category: ['correctness', 'security', 'performance', 'maintainability', 'readability'].includes(f.category)
              ? f.category
              : 'correctness',
            line: typeof f.line === 'number' ? Math.max(0, f.line) : 0,
            title: typeof f.title === 'string' ? f.title : 'Finding',
            explanation: typeof f.explanation === 'string' ? f.explanation : '',
            suggestion: typeof f.suggestion === 'string' ? f.suggestion : '',
          }))
        : [],
      strengths: Array.isArray(raw.strengths) ? raw.strengths.filter((s: any) => typeof s === 'string') : [],
      priorityActions: Array.isArray(raw.priorityActions) ? raw.priorityActions.filter((a: any) => typeof a === 'string') : [],
    };
  }

  /** Legacy: kept for backward compatibility with reviewRoutes.ts /analyze endpoint */
  public async analyzeDiff(diff: string): Promise<CodeReviewResponse> {
    return this.analyzeCode(diff, 'Unknown');
  }
}
