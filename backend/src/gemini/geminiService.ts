import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';
import { CodeReviewResponse, HistoricalInsight } from './types.js';

/**
 * Attempts to load a file from multiple candidate paths.
 */
function loadPromptFile(relativePath: string): string {
  const pathsToTry = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), '..', relativePath),
    path.join(process.cwd(), 'prompts', path.basename(relativePath)),
    path.join(process.cwd(), '../prompts', path.basename(relativePath)),
  ];
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  throw new Error(`Could not locate prompt file: ${relativePath}`);
}

/**
 * Strips markdown code fences (e.g. ```json ... ```) from LLM output.
 */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private vertexAI: VertexAI | null = null;
  private modelName: string;
  private fallbackModels: string[] = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log(`[GeminiService]: Initialized with Gemini API Key (Default model: ${this.modelName})`);
    } else {
      const projectId = process.env.GCP_PROJECT_ID || 'codepulse-development';
      const location = process.env.GCP_LOCATION || 'us-central1';
      this.vertexAI = new VertexAI({ project: projectId, location });
      console.warn(`[GeminiService]: Initialized with VertexAI fallback (project: ${projectId}, location: ${location})`);
    }
  }

  /**
   * Helper to invoke Gemini with automatic model fallback
   */
  private async executeGenerate(prompt: string): Promise<string> {
    if (this.genAI) {
      const candidateModels = [this.modelName, ...this.fallbackModels.filter(m => m !== this.modelName)];
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          });
          const text = result.response.text();
          if (text && text.trim().length > 0) {
            return text;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[GeminiService]: Model ${modelName} call failed:`, err.message);
          // Try next fallback model
        }
      }
      throw lastError || new Error('All Gemini models failed to generate a response.');
    }

    if (this.vertexAI) {
      const model = this.vertexAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user' as const, parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Vertex AI returned an empty response.');
      }
      return text;
    }

    throw new Error('Neither GEMINI_API_KEY nor VertexAI is configured.');
  }

  /**
   * Analyzes source code and returns a structured review across 5 quality dimensions.
   */
  public async analyzeCode(
    code: string,
    language: string = 'Unknown'
  ): Promise<CodeReviewResponse> {
    const template = loadPromptFile('prompts/code-review.md');
    const prompt = template
      .replace('{{code}}', code)
      .replace('{{language}}', language);

    try {
      const rawText = await this.executeGenerate(prompt);
      const cleaned = stripMarkdownFences(rawText);
      const parsed = JSON.parse(cleaned) as CodeReviewResponse;
      return this.validateCodeReviewResponse(parsed, language);
    } catch (error) {
      console.error('[GeminiService]: Error generating code review:', error);
      throw error;
    }
  }

  /**
   * Generates historical intelligence by comparing current review with past reviews.
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

    try {
      const rawText = await this.executeGenerate(prompt);
      const cleaned = stripMarkdownFences(rawText);
      return JSON.parse(cleaned) as HistoricalInsight;
    } catch (error) {
      console.error('[GeminiService]: Error generating historical insight:', error);
      // Safe fallback rather than throwing
      return {
        improvements: ['Progress monitored against previous reviews.'],
        regressions: [],
        recurringWeaknesses: [],
        resolvedWeaknesses: [],
        recommendation: 'Continue building with modern best practices, focusing on test coverage and code security.',
        overallTrend: 'stable',
      };
    }
  }

  /**
   * Validates and normalizes Gemini review output.
   */
  private validateCodeReviewResponse(raw: any, detectedLanguage: string): CodeReviewResponse {
    const clamp = (v: unknown, fallback = 70) =>
      Math.max(0, Math.min(100, typeof v === 'number' ? Math.round(v) : fallback));

    const normalizeSeverity = (s: any): 'info' | 'low' | 'medium' | 'high' | 'critical' => {
      const lower = String(s || '').toLowerCase();
      if (['critical', 'high', 'medium', 'low', 'info'].includes(lower)) {
        return lower as any;
      }
      return 'medium';
    };

    const normalizeCategory = (c: any): 'correctness' | 'security' | 'performance' | 'maintainability' | 'readability' => {
      const lower = String(c || '').toLowerCase();
      if (['correctness', 'security', 'performance', 'maintainability', 'readability'].includes(lower)) {
        return lower as any;
      }
      return 'correctness';
    };

    return {
      overallScore: clamp(raw.overallScore, 75),
      language: typeof raw.language === 'string' && raw.language.length > 0
        ? raw.language
        : detectedLanguage,
      summary: typeof raw.summary === 'string' && raw.summary.length > 0
        ? raw.summary
        : 'Code review completed with multi-dimensional analysis.',
      categories: {
        correctness: clamp(raw.categories?.correctness, 75),
        security: clamp(raw.categories?.security, 75),
        performance: clamp(raw.categories?.performance, 75),
        maintainability: clamp(raw.categories?.maintainability, 75),
        readability: clamp(raw.categories?.readability, 75),
      },
      findings: Array.isArray(raw.findings)
        ? raw.findings.map((f: any) => ({
            severity: normalizeSeverity(f.severity),
            category: normalizeCategory(f.category),
            line: typeof f.line === 'number' ? Math.max(0, f.line) : 0,
            title: typeof f.title === 'string' ? f.title : 'Quality Improvement',
            explanation: typeof f.explanation === 'string' ? f.explanation : '',
            suggestion: typeof f.suggestion === 'string' ? f.suggestion : '',
          }))
        : [],
      strengths: Array.isArray(raw.strengths)
        ? raw.strengths.filter((s: any) => typeof s === 'string')
        : ['Code is structured clearly.'],
      priorityActions: Array.isArray(raw.priorityActions)
        ? raw.priorityActions.filter((a: any) => typeof a === 'string')
        : ['Review identified findings.'],
    };
  }

  /** Legacy: backward compatibility */
  public async analyzeDiff(diff: string): Promise<CodeReviewResponse> {
    return this.analyzeCode(diff, 'Unknown');
  }
}
