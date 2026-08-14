import { db } from '../firestore/firestoreClient.js';
import { GeminiService } from '../gemini/geminiService.js';
import { CodeReviewResponse, CodeReviewFinding } from '../gemini/types.js';
import { detectLanguage } from '../utils/languageDetector.js';
import { Timestamp } from '@google-cloud/firestore';

export interface FullReviewDocument extends CodeReviewResponse {
  id?: string;
  userId: string;
  projectId: string;
  filename: string;
  language: string;
  createdAt: Date;
  commitHash: string;
  branch: string;
}

export interface DeveloperInsightsDocument {
  userId: string;
  averageScore: number;
  totalReviews: number;
  totalFindings: number;
  severityBreakdown: {
    info: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  categoryBreakdown: {
    correctness: number;
    security: number;
    performance: number;
    maintainability: number;
    readability: number;
  };
  categoryAverages: {
    correctness: number;
    security: number;
    performance: number;
    maintainability: number;
    readability: number;
  };
  updatedAt: Date;
}

export interface QualitySnapshot {
  reviewId: string;
  score: number;
  createdAt: Date;
}

export interface QualitySnapshotsDocument {
  userId: string;
  history: QualitySnapshot[];
}

export class ReviewService {
  private geminiService: GeminiService;
  private reviewsCollection = 'reviews';
  private insightsCollection = 'developerInsights';
  private snapshotsCollection = 'qualitySnapshots';

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Run a code review, detect the language, normalize the score, and save it in Firestore.
   * Then reactively updates developer insights and quality snapshots.
   */
  public async createReview(
    code: string,
    filename = 'code_submission.txt',
    userId = 'default_user',
    projectId = 'default_project',
    commitHash = 'local',
    branch = 'main'
  ): Promise<FullReviewDocument> {
    // 1. Detect language
    const language = detectLanguage(filename, code);
    console.log(`[ReviewService]: Running review for user: ${userId}, project: ${projectId}. Language: ${language}`);

    // 2. Invoke Gemini Service
    const aiReview = await this.geminiService.analyzeDiff(code);

    // 3. Validate & Normalize scores (Ensure in range 0 - 100)
    const score = Math.max(0, Math.min(100, aiReview.score || 70));
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

    // 4. Construct Firestore document mapping fields
    const reviewDoc: Omit<FullReviewDocument, 'id'> = {
      userId,
      projectId,
      filename,
      language,
      score,
      summary: aiReview.summary || 'Code review completed.',
      categories,
      findings,
      commitHash,
      branch,
      createdAt: new Date(),
    };

    let reviewId = 'local_fallback_id';

    // 5. Save to Firestore
    try {
      const docRef = await db.collection(this.reviewsCollection).add({
        ...reviewDoc,
        createdAt: Timestamp.fromDate(reviewDoc.createdAt),
      });
      reviewId = docRef.id;
      console.log(`[ReviewService]: Saved review with ID: ${reviewId}`);

      // Reactively sync developer insights and quality snapshots
      await this.syncUserInsightsAndSnapshots(userId, reviewId, score, reviewDoc.createdAt);

    } catch (dbError) {
      console.error('[ReviewService]: Firestore transaction write error, continuing offline:', dbError);
    }

    return {
      id: reviewId,
      ...reviewDoc,
    };
  }

  /**
   * Syncs the aggregate developerInsights and qualitySnapshots documents.
   */
  private async syncUserInsightsAndSnapshots(
    userId: string,
    newReviewId: string,
    newScore: number,
    createdAt: Date
  ): Promise<void> {
    try {
      // 1. Query all reviews for this user to compute aggregates
      const snapshot = await db.collection(this.reviewsCollection)
        .where('userId', '==', userId)
        .get();

      const reviews: FullReviewDocument[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || data.createdAt,
        } as FullReviewDocument);
      });

      const count = reviews.length;
      if (count === 0) return;

      // 2. Compute averages and breakdowns
      let sumScore = 0;
      const sums = { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
      const severityCount = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
      const categoryCount = { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
      let totalFindings = 0;

      for (const r of reviews) {
        sumScore += r.score;
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

            if (sev in severityCount) severityCount[sev as keyof typeof severityCount]++;
            if (cat in categoryCount) categoryCount[cat as keyof typeof categoryCount]++;
          }
        }
      }

      const insightsDoc: DeveloperInsightsDocument = {
        userId,
        averageScore: Math.round(sumScore / count),
        totalReviews: count,
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
        updatedAt: new Date(),
      };

      // Write developerInsights/{userId}
      await db.collection(this.insightsCollection).doc(userId).set({
        ...insightsDoc,
        updatedAt: Timestamp.fromDate(insightsDoc.updatedAt),
      });
      console.log(`[ReviewService]: Updated developerInsights for user: ${userId}`);

      // 3. Update qualitySnapshots/{userId}
      const snapshotDocRef = db.collection(this.snapshotsCollection).doc(userId);
      const snapshotDoc = await snapshotDocRef.get();

      let history: QualitySnapshot[] = [];
      if (snapshotDoc.exists) {
        const data = snapshotDoc.data();
        history = (data?.history || []).map((h: any) => ({
          reviewId: h.reviewId,
          score: h.score,
          createdAt: (h.createdAt as Timestamp)?.toDate() || h.createdAt,
        }));
      }

      // Append new snapshot and sort chronologically
      history.push({
        reviewId: newReviewId,
        score: newScore,
        createdAt: createdAt,
      });

      // Keep only last 100 reviews history to prevent document bloat
      history = history.slice(-100);

      await snapshotDocRef.set({
        userId,
        history: history.map((h) => ({
          reviewId: h.reviewId,
          score: h.score,
          createdAt: Timestamp.fromDate(h.createdAt),
        })),
      });
      console.log(`[ReviewService]: Updated qualitySnapshots history for user: ${userId}`);

    } catch (err) {
      console.error('[ReviewService]: Error syncing insights and snapshots:', err);
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
   * Get developer insights by userId.
   */
  public async getDeveloperInsights(userId: string): Promise<DeveloperInsightsDocument | null> {
    const doc = await db.collection(this.insightsCollection).doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data();
    return {
      userId: doc.id,
      ...data,
      updatedAt: (data?.updatedAt as Timestamp)?.toDate() || data?.updatedAt,
    } as DeveloperInsightsDocument;
  }

  /**
   * Get quality snapshots history by userId.
   */
  public async getQualitySnapshots(userId: string): Promise<QualitySnapshotsDocument | null> {
    const doc = await db.collection(this.snapshotsCollection).doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data();
    const history = (data?.history || []).map((h: any) => ({
      reviewId: h.reviewId,
      score: h.score,
      createdAt: (h.createdAt as Timestamp)?.toDate() || h.createdAt,
    }));
    return {
      userId: doc.id,
      history,
    } as QualitySnapshotsDocument;
  }

  /**
   * Aggregates insights across all historical code reviews (system-wide).
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

    let sumScore = 0;
    const sums = { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
    const severityCount: Record<string, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
    const categoryCount: Record<string, number> = { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
    let totalFindings = 0;

    for (const r of reviews) {
      sumScore += r.score;
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
      averageScore: Math.round(sumScore / count),
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
   * Aggregates summary statistics for a high-level dashboard (system-wide).
   */
  public async getDashboard(): Promise<any> {
    const reviews = await this.listReviews(10); // Look at last 10 reviews for trend

    const scoreTrend = reviews
      .map((r) => ({
        id: r.id,
        filename: r.filename,
        score: r.score,
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
