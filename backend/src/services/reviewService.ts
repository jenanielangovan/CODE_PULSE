import { db } from '../firestore/firestoreClient.js';
import { GeminiService } from '../gemini/geminiService.js';
import { CodeReviewResponse, CodeReviewFinding } from '../gemini/types.js';
import { detectLanguage } from '../utils/languageDetector.js';
import { Timestamp } from '@google-cloud/firestore';

export interface FullReviewDocument extends CodeReviewResponse {
  id?: string;
  language: string;
  filename: string;
  repositoryId: string;
  commitHash: string;
  branch: string;
  createdAt: Date;
}

export class ReviewService {
  private geminiService: GeminiService;
  private reviewsCollection = 'reviews';

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Run a code review, detect the language, normalize the score, and save it in Firestore.
   */
  public async createReview(
    code: string,
    filename = 'code_submission.txt',
    repositoryId = 'local',
    commitHash = 'local',
    branch = 'main'
  ): Promise<FullReviewDocument> {
    // 1. Detect language
    const language = detectLanguage(filename, code);
    console.log(`[ReviewService]: Running review. Detected language: ${language} for file: ${filename}`);

    // 2. Invoke Gemini Service
    const aiReview = await this.geminiService.analyzeDiff(code);

    // 3. Validate & Normalize scores (Ensure in range 0 - 100)
    const overallScore = Math.max(0, Math.min(100, aiReview.overallScore || 70));
    const categories = {
      correctness: Math.max(0, Math.min(100, aiReview.categories?.correctness || 70)),
      security: Math.max(0, Math.min(100, aiReview.categories?.security || 70)),
      performance: Math.max(0, Math.min(100, aiReview.categories?.performance || 70)),
      maintainability: Math.max(0, Math.min(100, aiReview.categories?.maintainability || 70)),
      readability: Math.max(0, Math.min(100, aiReview.categories?.readability || 70)),
    };

    // Normalize findings line numbers and parameters
    const findings: CodeReviewFinding[] = (aiReview.findings || []).map((f) => ({
      severity: f.severity || 'low',
      category: f.category || 'correctness',
      line: typeof f.line === 'number' ? Math.max(0, f.line) : 0,
      title: f.title || 'Review Finding',
      explanation: f.explanation || '',
      suggestion: f.suggestion || '',
    }));

    // 4. Construct Firestore document
    const reviewDoc: Omit<FullReviewDocument, 'id'> = {
      overallScore,
      summary: aiReview.summary || 'Code review completed.',
      categories,
      findings,
      language,
      filename,
      repositoryId,
      commitHash,
      branch,
      createdAt: new Date(),
    };

    // 5. Save to Firestore
    try {
      const docRef = await db.collection(this.reviewsCollection).add({
        ...reviewDoc,
        createdAt: Timestamp.fromDate(reviewDoc.createdAt),
      });
      console.log(`[ReviewService]: Saved review to Firestore with ID: ${docRef.id}`);

      return {
        id: docRef.id,
        ...reviewDoc,
      };
    } catch (dbError) {
      console.error('[ReviewService]: Firestore write error, returning un-saved review data:', dbError);
      return {
        ...reviewDoc,
      };
    }
  }

  /**
   * Retrieve a specific review by ID from Firestore.
   */
  public async getReviewById(id: string): Promise<FullReviewDocument | null> {
    const doc = await db.collection(this.reviewsCollection).doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data?.createdAt as Timestamp)?.toDate() || data?.createdAt,
    } as FullReviewDocument;
  }

  /**
   * Fetch a list of recent code reviews.
   */
  public async listReviews(limitNum = 20): Promise<FullReviewDocument[]> {
    const snapshot = await db
      .collection(this.reviewsCollection)
      .orderBy('createdAt', 'desc')
      .limit(limitNum)
      .get();

    const list: FullReviewDocument[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || data.createdAt,
      } as FullReviewDocument);
    });

    return list;
  }

  /**
   * Aggregates insights across all historical code reviews.
   */
  public async getInsights(): Promise<any> {
    const reviews = await this.listReviews(50); // Get up to last 50 reviews

    if (reviews.length === 0) {
      return {
        averageScore: 100,
        totalFindings: 0,
        severityBreakdown: { info: 0, low: 0, medium: 0, high: 0, critical: 0 },
        categoryBreakdown: { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 },
        categoryAverages: { correctness: 100, security: 100, performance: 100, maintainability: 100, readability: 100 },
        message: 'No code reviews available to generate insights.',
      };
    }

    let sumOverall = 0;
    const sums = { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
    const severityCount: Record<string, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
    const categoryCount: Record<string, number> = { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
    let totalFindings = 0;

    for (const r of reviews) {
      sumOverall += r.overallScore;
      sums.correctness += r.categories?.correctness || 0;
      sums.security += r.categories?.security || 0;
      sums.performance += r.categories?.performance || 0;
      sums.maintainability += r.categories?.maintainability || 0;
      sums.readability += r.categories?.readability || 0;

      if (r.findings) {
        totalFindings += r.findings.length;
        for (const f of r.findings) {
          const sev = f.severity?.toLowerCase() || 'low';
          const cat = f.category?.toLowerCase() || 'correctness';

          if (sev in severityCount) severityCount[sev]++;
          if (cat in categoryCount) categoryCount[cat]++;
        }
      }
    }

    const count = reviews.length;
    return {
      averageScore: Math.round(sumOverall / count),
      totalFindings,
      severityBreakdown: severityCount,
      categoryBreakdown: categoryCount,
      categoryAverages: {
        correctness: Math.round(sums.correctness / count),
        security: Math.round(sums.security / count),
        performance: Math.round(sums.performance / count),
        maintainability: Math.round(sums.maintainability / count),
        readability: Math.round(sums.readability / count),
      },
    };
  }

  /**
   * Aggregates summary statistics for a high-level dashboard.
   */
  public async getDashboard(): Promise<any> {
    const reviews = await this.listReviews(10); // Look at last 10 reviews for trend

    const scoreTrend = reviews
      .map((r) => ({
        id: r.id,
        filename: r.filename,
        overallScore: r.overallScore,
        createdAt: r.createdAt,
      }))
      .reverse(); // chronological order

    const snapshot = await db.collection(this.reviewsCollection).count().get();
    const totalReviews = snapshot.data().count;

    // Get insights for dashboard
    const insights = await this.getInsights();

    return {
      totalReviews,
      averageScore: insights.averageScore,
      scoreTrend,
      latestFindingsCount: reviews[0]?.findings?.length || 0,
      severityBreakdown: insights.severityBreakdown,
      latestReview: reviews[0] || null,
    };
  }
}
