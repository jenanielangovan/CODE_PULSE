import { VertexAI } from '@google-cloud/vertexai';
import fs from 'fs';
import path from 'path';
import { CodeReviewResponse } from './types.js';

export class GeminiService {
  private vertexAI: VertexAI;
  private modelName: string;

  constructor() {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || 'us-central1';
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-001';

    if (!projectId) {
      console.warn('[GeminiService]: GCP_PROJECT_ID environment variable is not defined. VertexAI may fail if not running on GCP resource.');
    }

    this.vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
  }

  /**
   * Loads the code review prompt template from prompts/code-review.md
   */
  private getPromptTemplate(): string {
    // Try process.cwd() path first (running from backend root)
    const pathsToTry = [
      path.join(process.cwd(), '../prompts/code-review.md'),
      path.join(__dirname, '../../../prompts/code-review.md'),
      path.join(__dirname, '../../prompts/code-review.md'),
    ];

    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    }

    throw new Error('Could not locate prompts/code-review.md template file.');
  }

  /**
   * Generates a structured code review using Gemini
   * @param diff The code diff string to analyze
   */
  public async analyzeDiff(diff: string): Promise<CodeReviewResponse> {
    const template = this.getPromptTemplate();
    const prompt = template.replace('{{diff}}', diff);

    const model = this.vertexAI.getGenerativeModel({
      model: this.modelName,
    });

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        score: { type: 'INTEGER' },
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
      },
      required: ['score', 'summary', 'categories', 'findings'],
    };

    const request = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as any,
      },
    };

    try {
      const result = await model.generateContent(request);
      const response = await result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      return JSON.parse(text) as CodeReviewResponse;
    } catch (error) {
      console.error('[GeminiService]: Error generating structured code review:', error);
      throw error;
    }
  }
}
