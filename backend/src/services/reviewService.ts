import { db } from '../firestore/firestoreClient.js';
import { GeminiService } from '../gemini/geminiService.js';
import { CodeReviewResponse, CodeReviewFinding, CodeReviewCategoryScores } from '../gemini/types.js';
import { detectLanguage } from '../utils/languageDetector.js';
import { computeWeightedScore, getQualityLabel } from './scoringService.js';
import { HistoricalAnalysisService } from './historicalAnalysisService.js';
import { Timestamp } from '@google-cloud/firestore';

export interface FullReviewDocument {
  id?: string;
  userId: string;
  projectId: string;
  filename: string;
  language: string;
  overallScore: number;
  qualityLabel: string;
  summary: string;
  categories: CodeReviewCategoryScores;
  findings: CodeReviewFinding[];
  strengths: string[];
  priorityActions: string[];
  createdAt: Date;
}

export interface DeveloperInsightsDocument {
  userId: string;
  averageScore: number;
  totalReviews: number;
  totalFindings: number;
  severityBreakdown: Record<string, number>;
  categoryAverages: CodeReviewCategoryScores;
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
  private historicalAnalysisService: HistoricalAnalysisService;
  private readonly reviewsCol = 'reviews';
  private readonly insightsCol = 'developerInsights';
  private readonly snapshotsCol = 'qualitySnapshots';

  constructor() {
    this.geminiService = new GeminiService();
    this.historicalAnalysisService = new HistoricalAnalysisService();
  }

  /**
   * Creates a new code review:
   * 1. Detects language
   * 2. Calls Gemini for structured analysis
   * 3. Applies deterministic weighted scoring
   * 4. Persists to Firestore
   * 5. Triggers historical intelligence (async, non-blocking for response)
   */
  public async createReview(
    code: string,
    language?: string,
    filename = 'code_submission.txt',
    userId = 'default_user',
    projectId = 'default_project'
  ): Promise<FullReviewDocument> {
    // 1. Detect language
    const detectedLanguage = language && language !== 'auto'
      ? language
      : detectLanguage(filename, code);

    console.log(`[ReviewService]: Starting review for user=${userId}, project=${projectId}, language=${detectedLanguage}`);

    // 2. Call Gemini
    const aiReview: CodeReviewResponse = await this.geminiService.analyzeCode(code, detectedLanguage);

    // 3. Apply deterministic weighted scoring
    const { overallScore } = computeWeightedScore(aiReview.categories);
    const qualityLabel = getQualityLabel(overallScore);

    // 4. Construct document
    const reviewDoc: Omit<FullReviewDocument, 'id'> = {
      userId,
      projectId,
      filename,
      language: aiReview.language || detectedLanguage,
      overallScore,
      qualityLabel,
      summary: aiReview.summary,
      categories: aiReview.categories,
      findings: aiReview.findings,
      strengths: aiReview.strengths,
      priorityActions: aiReview.priorityActions,
      createdAt: new Date(),
    };

    let reviewId = `local_${Date.now()}`;

    // 5. Persist to Firestore
    try {
      const docRef = await db.collection(this.reviewsCol).add({
        ...reviewDoc,
        createdAt: Timestamp.fromDate(reviewDoc.createdAt),
      });
      reviewId = docRef.id;
      console.log(`[ReviewService]: Saved review ${reviewId}`);

      // 6. Update aggregate insights and snapshots (non-blocking)
      this.syncInsightsAndSnapshots(userId, reviewId, overallScore, reviewDoc.createdAt, reviewDoc.categories)
        .catch(e => console.error('[ReviewService]: Error syncing insights:', e));

      // 7. Trigger historical analysis (non-blocking)
      this.historicalAnalysisService.analyzeUserHistory(userId, reviewId)
        .catch(e => console.error('[ReviewService]: Error in historical analysis:', e));

    } catch (dbError) {
      console.error('[ReviewService]: Firestore write error — review result returned without persistence:', dbError);
    }

    return { id: reviewId, ...reviewDoc };
  }

  /**
   * Retrieves a specific review by Firestore document ID.
   */
  public async getReviewById(id: string): Promise<FullReviewDocument | null> {
    const doc = await db.collection(this.reviewsCol).doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return this.deserializeReview(doc.id, data);
  }

  /**
   * Lists recent reviews, optionally filtered by userId.
   */
  public async listReviews(userId?: string, limit = 20): Promise<FullReviewDocument[]> {
    let query = db.collection(this.reviewsCol).orderBy('createdAt', 'desc').limit(limit);
    if (userId) {
      query = db.collection(this.reviewsCol)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit) as any;
    }

    const snapshot = await query.get();
    const list: FullReviewDocument[] = [];
    snapshot.forEach(doc => list.push(this.deserializeReview(doc.id, doc.data())));
    return list;
  }

  /**
   * Returns developer-level aggregate insights.
   */
  public async getDeveloperInsights(userId: string): Promise<DeveloperInsightsDocument | null> {
    const doc = await db.collection(this.insightsCol).doc(userId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
      ...data,
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || data.updatedAt,
    } as DeveloperInsightsDocument;
  }

  /**
   * Returns quality snapshot history for trajectory charts.
   */
  public async getQualitySnapshots(userId: string): Promise<QualitySnapshotsDocument | null> {
    const doc = await db.collection(this.snapshotsCol).doc(userId).get();
    if (!doc.exists) return null;

    const data = doc.data()!;
    const history = (data.history || []).map((h: any) => ({
      reviewId: h.reviewId,
      score: h.score,
      createdAt: (h.createdAt as Timestamp)?.toDate() || h.createdAt,
    }));

    return { userId: doc.id, history };
  }

  /**
   * Dashboard summary for a user — combines insights + trajectory.
   */
  public async getDashboard(userId: string): Promise<any> {
    const [insights, snapshots, recentReviews] = await Promise.all([
      this.getDeveloperInsights(userId),
      this.getQualitySnapshots(userId),
      this.listReviews(userId, 5),
    ]);

    const history = snapshots?.history || [];
    const latestScore = history.length > 0 ? history[history.length - 1].score : 0;
    const previousScore = history.length > 1 ? history[history.length - 2].score : null;
    const scoreDelta = previousScore !== null ? latestScore - previousScore : null;

    return {
      userId,
      totalReviews: insights?.totalReviews || 0,
      averageScore: insights?.averageScore || 0,
      latestScore,
      scoreDelta,
      categoryAverages: insights?.categoryAverages || {},
      scoreTrajectory: history,
      recentReviews,
      updatedAt: insights?.updatedAt || new Date(),
    };
  }

  /**
   * Syncs aggregate developerInsights and qualitySnapshots documents after a new review.
   */
  private async syncInsightsAndSnapshots(
    userId: string,
    reviewId: string,
    score: number,
    createdAt: Date,
    categories: CodeReviewCategoryScores
  ): Promise<void> {
    const snapshot = await db.collection(this.reviewsCol).where('userId', '==', userId).get();

    const reviews: FullReviewDocument[] = [];
    snapshot.forEach(doc => reviews.push(this.deserializeReview(doc.id, doc.data())));

    const count = reviews.length;
    if (count === 0) return;

    let sumScore = 0;
    const catSums = { correctness: 0, security: 0, performance: 0, maintainability: 0, readability: 0 };
    const severityCount: Record<string, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
    let totalFindings = 0;

    for (const r of reviews) {
      sumScore += r.overallScore;
      catSums.correctness += r.categories?.correctness || 0;
      catSums.security += r.categories?.security || 0;
      catSums.performance += r.categories?.performance || 0;
      catSums.maintainability += r.categories?.maintainability || 0;
      catSums.readability += r.categories?.readability || 0;

      for (const f of r.findings || []) {
        totalFindings++;
        const sev = f.severity?.toLowerCase() || 'low';
        if (sev in severityCount) severityCount[sev]++;
      }
    }

    const insightsDoc: DeveloperInsightsDocument = {
      userId,
      averageScore: Math.round(sumScore / count),
      totalReviews: count,
      totalFindings,
      severityBreakdown: severityCount,
      categoryAverages: {
        correctness: Math.round(catSums.correctness / count),
        security: Math.round(catSums.security / count),
        performance: Math.round(catSums.performance / count),
        maintainability: Math.round(catSums.maintainability / count),
        readability: Math.round(catSums.readability / count),
      },
      updatedAt: new Date(),
    };

    await db.collection(this.insightsCol).doc(userId).set({
      ...insightsDoc,
      updatedAt: Timestamp.fromDate(insightsDoc.updatedAt),
    });

    // Update quality snapshots
    const snapshotDocRef = db.collection(this.snapshotsCol).doc(userId);
    const snapshotDoc = await snapshotDocRef.get();

    let history: QualitySnapshot[] = [];
    if (snapshotDoc.exists) {
      history = (snapshotDoc.data()?.history || []).map((h: any) => ({
        reviewId: h.reviewId,
        score: h.score,
        createdAt: (h.createdAt as Timestamp)?.toDate() || h.createdAt,
      }));
    }

    history.push({ reviewId, score, createdAt });
    history = history.slice(-100);

    await snapshotDocRef.set({
      userId,
      history: history.map(h => ({
        reviewId: h.reviewId,
        score: h.score,
        createdAt: Timestamp.fromDate(h.createdAt),
      })),
    });
  }

  private deserializeReview(id: string, data: FirebaseFirestore.DocumentData): FullReviewDocument {
    return {
      id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || data.createdAt,
    } as FullReviewDocument;
  }
}
