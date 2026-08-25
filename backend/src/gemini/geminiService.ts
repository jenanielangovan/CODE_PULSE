import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';
import { CodeReviewResponse, HistoricalInsight } from './types.js';

const DEFAULT_CODE_REVIEW_PROMPT = `# CodePulse Code Review System Prompt
You are a world-class senior software engineer performing a thorough, actionable code review.
The developer is submitting code written in **{{language}}**.

## Your Mission
Analyze the submitted code across **five quality dimensions** and return **only valid JSON** — no markdown, no prose outside the JSON structure.

## Dimensions to Evaluate
1. **Correctness** — Logical errors, edge cases, incorrect assumptions, type safety, API misuse
2. **Security** — OWASP Top 10 risks, injection vulnerabilities, secrets in code, weak auth patterns, unsafe input handling
3. **Performance** — Inefficient algorithms, N+1 queries, memory leaks, unnecessary computation, blocking operations
4. **Maintainability** — Code duplication, tight coupling, poor modularity, missing abstractions, architectural concerns
5. **Readability** — Naming quality, code clarity, comment quality, cognitive complexity, structure

## Output Requirements
Return a single JSON object matching this schema exactly:
\`\`\`json
{
  "overallScore": 75,
  "language": "{{language}}",
  "summary": "Review summary",
  "categories": {
    "correctness": 75,
    "security": 75,
    "performance": 75,
    "maintainability": 75,
    "readability": 75
  },
  "findings": [
    {
      "severity": "medium",
      "category": "correctness",
      "line": 1,
      "title": "Finding Title",
      "explanation": "Explanation",
      "suggestion": "Suggestion"
    }
  ],
  "strengths": ["Clear structure"],
  "priorityActions": ["Review findings"]
}
\`\`\`

=== CODE TO REVIEW ({{language}}) ===
{{code}}
=== END OF CODE ===`;

const DEFAULT_HISTORICAL_PROMPT = `# CodePulse Historical Intelligence System Prompt
You are CodePulse's senior developer growth analyst.
Analyze the developer's review history and current review to identify growth patterns and return ONLY valid JSON.

Previous Reviews:
{{history}}

Current Review:
{{current}}

Return schema:
\`\`\`json
{
  "improvements": ["improvement note"],
  "regressions": [],
  "recurringWeaknesses": [],
  "resolvedWeaknesses": [],
  "recommendation": "Targeted recommendation",
  "overallTrend": "stable"
}
\`\`\``;

/**
 * Attempts to load a file from multiple candidate paths with embedded fallback.
 */
function loadPromptFile(relativePath: string): string {
  const pathsToTry = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), '..', relativePath),
    path.join(process.cwd(), 'prompts', path.basename(relativePath)),
    path.join(process.cwd(), '../prompts', path.basename(relativePath)),
  ];
  for (const p of pathsToTry) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    } catch {
      // Continue to next path
    }
  }

  // Fallback to embedded prompt if file not found in deployment filesystem
  if (relativePath.includes('historical')) {
    return DEFAULT_HISTORICAL_PROMPT;
  }
  return DEFAULT_CODE_REVIEW_PROMPT;
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
  private fallbackModels: string[] = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

  /**
   * Interactive multi-turn chat with CodePulse AI Assistant
   */
  public async chat(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    context?: {
      code?: string;
      language?: string;
      filename?: string;
      reviewSummary?: string;
      finding?: {
        title: string;
        severity: string;
        category: string;
        line?: number;
        explanation: string;
        suggestion: string;
      };
    }
  ): Promise<{ reply: string; model: string }> {
    const systemInstruction = `You are CodePulse AI, an elite senior software architect and AI code review assistant.
Your goal is to help developers write clean, robust, secure, and high-performance code.
- Answer developer questions directly, accurately, and with helpful explanations.
- When suggesting code modifications or fixes, provide clean, idiomatic code blocks with appropriate syntax highlighting (e.g. \`\`\`typescript ... \`\`\`).
- If context regarding a code review or finding is provided, tailor your answer specifically to address that code/issue.
- Be concise, constructive, friendly, and prioritize security and best practices.`;

    let contextPrefix = '';
    if (context) {
      contextPrefix += '\n[CURRENT CODEPULSE CONTEXT]\n';
      if (context.filename) contextPrefix += `Filename: ${context.filename}\n`;
      if (context.language) contextPrefix += `Language: ${context.language}\n`;
      if (context.reviewSummary) contextPrefix += `Review Summary: ${context.reviewSummary}\n`;
      if (context.finding) {
        contextPrefix += `Selected Finding: "${context.finding.title}" (${context.finding.severity.toUpperCase()} severity, category: ${context.finding.category})`;
        if (context.finding.line) contextPrefix += ` at Line ${context.finding.line}`;
        contextPrefix += `\nExplanation: ${context.finding.explanation}\nOriginal Suggestion: ${context.finding.suggestion}\n`;
      }
      if (context.code) {
        contextPrefix += `Code Snippet:\n\`\`\`${context.language || ''}\n${context.code.slice(0, 8000)}\n\`\`\`\n`;
      }
      contextPrefix += '[END CONTEXT]\n\n';
    }

    if (this.genAI) {
      const candidateModels = [this.modelName, ...this.fallbackModels.filter(m => m !== this.modelName)];
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
          });

          // Format contents for Generative AI API
          const contents = messages.map((m, idx) => {
            let text = m.content;
            if (idx === 0 && contextPrefix) {
              text = `${contextPrefix}${text}`;
            }
            return {
              role: m.role === 'model' ? 'model' : 'user',
              parts: [{ text }],
            };
          });

          const result = await model.generateContent({ contents });
          const reply = result.response.text();
          if (reply && reply.trim().length > 0) {
            return { reply, model: modelName };
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[GeminiService.chat]: Model ${modelName} failed:`, err.message);
        }
      }
      throw lastError || new Error('Failed to generate chat response from Gemini.');
    }

    if (this.vertexAI) {
      const model = this.vertexAI.getGenerativeModel({ model: this.modelName });
      const contents = messages.map((m, idx) => {
        let text = m.content;
        if (idx === 0 && contextPrefix) {
          text = `${contextPrefix}${text}`;
        }
        return {
          role: m.role === 'model' ? ('model' as const) : ('user' as const),
          parts: [{ text }],
        };
      });

      const result = await model.generateContent({ contents });
      const reply = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!reply) {
        throw new Error('Vertex AI returned an empty response.');
      }
      return { reply, model: this.modelName };
    }

    throw new Error('Neither GEMINI_API_KEY nor VertexAI is configured.');
  }

  /** Legacy: backward compatibility */
  public async analyzeDiff(diff: string): Promise<CodeReviewResponse> {
    return this.analyzeCode(diff, 'Unknown');
  }
}
