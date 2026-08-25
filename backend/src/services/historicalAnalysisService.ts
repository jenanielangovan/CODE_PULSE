import { db } from '../firestore/firestoreClient.js';
import { GeminiService } from '../gemini/geminiService.js';
import { HistoricalInsight, RecurringWeakness } from '../gemini/types.js';
import { Timestamp } from '@google-cloud/firestore';
import { FullReviewDocument } from './reviewService.js';

/**
 * HistoricalAnalysisService
 *
 * This is CodePulse's key differentiator.
 * It retrieves a developer's full review history, identifies patterns,
 * compares trends, and generates personalized AI-driven insights via Gemini.
 *
 * Workflow:
 *   New Review
 *     → Retrieve previous reviews for user
 *     → Extract historical scores and findings
 *     → Detect recurring weaknesses (topics appearing in multiple reviews)
 *     → Detect resolved issues
 *     → Send context to Gemini for personalized recommendation
 *     → Store structured insight in Firestore
 */
export class HistoricalAnalysisService {
  private geminiService: GeminiService;
  private reviewsCollection = 'reviews';
  private historicalInsightsCollection = 'historicalInsights';

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Runs full historical analysis for a user after a new review is created.
   * Returns null if there is no prior history (first-time reviewer).
   */
  public async analyzeUserHistory(
    userId: string,
    currentReviewId: string
  ): Promise<StoredHistoricalInsight | null> {
    try {
      // 1. Retrieve all reviews for this user, ordered chronologically
      const snapshot = await db
        .collection(this.reviewsCollection)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'asc')
        .get();

      const reviews: FullReviewDocument[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || data.createdAt,
        } as FullReviewDocument);
      });

      // Need at least 2 reviews to generate meaningful history
      if (reviews.length < 2) {
        console.log(`[HistoricalAnalysisService]: Not enough reviews for ${userId} to generate insights (need ≥ 2).`);
        return null;
      }

      const currentReview = reviews.find(r => r.id === currentReviewId);
      const priorReviews = reviews.filter(r => r.id !== currentReviewId);

      if (!currentReview) {
        console.warn(`[HistoricalAnalysisService]: Current review ${currentReviewId} not found in user's history.`);
        return null;
      }

      // 2. Build historical context for Gemini
      const historicalContext = priorReviews.map(r => ({
        score: r.overallScore,
        categories: r.categories as unknown as Record<string, number>,
        findings: (r.findings || []).map(f => ({ title: f.title, severity: f.severity })),
      }));

      // 3. Detect recurring weaknesses locally (deterministic)
      const recurringWeaknesses = this.detectRecurringWeaknesses(reviews);

      // 4. Detect improvements and regressions (deterministic)
      const { improvements, regressions } = this.detectTrends(priorReviews, currentReview);

      // 5. Detect resolved issues
      const resolvedWeaknesses = this.detectResolvedIssues(priorReviews, currentReview);

      // 6. Call Gemini for personalized recommendation and overall synthesis
      const geminiInsight = await this.geminiService.generateHistoricalInsight(
        {
          overallScore: currentReview.overallScore,
          language: currentReview.language,
          summary: currentReview.summary,
          categories: currentReview.categories,
          findings: currentReview.findings || [],
          strengths: currentReview.strengths || [],
          priorityActions: currentReview.priorityActions || [],
        },
        historicalContext
      );

      // 7. Merge deterministic findings with Gemini's narrative
      const mergedInsight: HistoricalInsight = {
        improvements: improvements.length > 0 ? improvements : geminiInsight.improvements,
        regressions: regressions.length > 0 ? regressions : geminiInsight.regressions,
        recurringWeaknesses: recurringWeaknesses.length > 0
          ? recurringWeaknesses
          : geminiInsight.recurringWeaknesses,
        resolvedWeaknesses: resolvedWeaknesses.length > 0
          ? resolvedWeaknesses
          : geminiInsight.resolvedWeaknesses,
        recommendation: geminiInsight.recommendation,
        overallTrend: this.computeOverallTrend(reviews),
      };

      // 8. Build score trajectory
      const scoreTrajectory = reviews.map(r => ({
        reviewId: r.id || '',
        score: r.overallScore,
        createdAt: r.createdAt,
      }));

      const totalGain = currentReview.overallScore - (reviews[0]?.overallScore || currentReview.overallScore);

      // 9. Persist to Firestore
      const storedInsight: StoredHistoricalInsight = {
        userId,
        currentReviewId,
        totalReviews: reviews.length,
        scoreTrajectory,
        totalGain,
        insight: mergedInsight,
        updatedAt: new Date(),
      };

      await db.collection(this.historicalInsightsCollection).doc(userId).set({
        ...storedInsight,
        updatedAt: Timestamp.fromDate(storedInsight.updatedAt),
        scoreTrajectory: scoreTrajectory.map(s => ({
          reviewId: s.reviewId,
          score: s.score,
          createdAt: Timestamp.fromDate(s.createdAt),
        })),
      });

      console.log(`[HistoricalAnalysisService]: Historical insight saved for user: ${userId}`);
      return storedInsight;

    } catch (error) {
      console.error('[HistoricalAnalysisService]: Error analyzing user history:', error);
      return null;
    }
  }

  /**
   * Retrieves stored historical insight for a user.
   */
  public async getHistoricalInsight(userId: string): Promise<StoredHistoricalInsight | null> {
    try {
      const doc = await db.collection(this.historicalInsightsCollection).doc(userId).get();
      if (!doc.exists) return null;

      const data = doc.data()!;
      return {
        userId: data.userId,
        currentReviewId: data.currentReviewId,
        totalReviews: data.totalReviews,
        totalGain: data.totalGain,
        scoreTrajectory: (data.scoreTrajectory || []).map((s: any) => ({
          reviewId: s.reviewId,
          score: s.score,
          createdAt: (s.createdAt as Timestamp)?.toDate() || s.createdAt,
        })),
        insight: data.insight as HistoricalInsight,
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || data.updatedAt,
      };
    } catch (error) {
      console.error('[HistoricalAnalysisService]: Error fetching historical insight:', error);
      return null;
    }
  }

  /**
   * Detects recurring weaknesses — issues whose titles or categories
   * appear across multiple reviews.
   */
  private detectRecurringWeaknesses(reviews: FullReviewDocument[]): RecurringWeakness[] {
    const titleCount: Record<string, { count: number; severity: string }> = {};

    for (const review of reviews) {
      for (const finding of review.findings || []) {
        const key = finding.title.toLowerCase().trim();
        if (!titleCount[key]) {
          titleCount[key] = { count: 0, severity: finding.severity };
        }
        titleCount[key].count++;
        // Escalate severity if we see a higher severity later
        const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
        if (
          severityOrder.indexOf(finding.severity) >
          severityOrder.indexOf(titleCount[key].severity)
        ) {
          titleCount[key].severity = finding.severity;
        }
      }
    }

    return Object.entries(titleCount)
      .filter(([, v]) => v.count >= 2)
      .map(([topic, v]) => ({
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        count: v.count,
        severity: v.severity,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Compares category scores between prior reviews and the current review.
   * Returns human-readable improvement and regression strings.
   */
  private detectTrends(
    priorReviews: FullReviewDocument[],
    currentReview: FullReviewDocument
  ): { improvements: string[]; regressions: string[] } {
    if (priorReviews.length === 0) return { improvements: [], regressions: [] };

    const lastPrior = priorReviews[priorReviews.length - 1];
    const categories = ['correctness', 'security', 'performance', 'maintainability', 'readability'] as const;

    const improvements: string[] = [];
    const regressions: string[] = [];

    for (const cat of categories) {
      const prev = lastPrior.categories?.[cat] ?? 0;
      const curr = currentReview.categories?.[cat] ?? 0;
      const delta = curr - prev;

      if (delta >= 5) {
        improvements.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)} improved from ${prev} → ${curr} (+${delta})`);
      } else if (delta <= -5) {
        regressions.push(`${cat.charAt(0).toUpperCase() + cat.slice(1)} decreased from ${prev} → ${curr} (${delta})`);
      }
    }

    return { improvements, regressions };
  }

  /**
   * Detects issues that appeared in prior reviews but NOT in the current review.
   */
  private detectResolvedIssues(
    priorReviews: FullReviewDocument[],
    currentReview: FullReviewDocument
  ): string[] {
    if (priorReviews.length === 0) return [];

    const priorTitles = new Set<string>();
    for (const review of priorReviews) {
      for (const f of review.findings || []) {
        priorTitles.add(f.title.toLowerCase().trim());
      }
    }

    const currentTitles = new Set(
      (currentReview.findings || []).map(f => f.title.toLowerCase().trim())
    );

    const resolved: string[] = [];
    for (const title of priorTitles) {
      if (!currentTitles.has(title)) {
        resolved.push(title.charAt(0).toUpperCase() + title.slice(1));
      }
    }

    return resolved.slice(0, 5); // Limit to 5 most notable resolved items
  }

  /**
   * Computes the overall trajectory trend based on score history.
   */
  private computeOverallTrend(reviews: FullReviewDocument[]): 'improving' | 'declining' | 'stable' {
    if (reviews.length < 2) return 'stable';

    const first = reviews[0].overallScore;
    const last = reviews[reviews.length - 1].overallScore;
    const delta = last - first;

    if (delta >= 5) return 'improving';
    if (delta <= -5) return 'declining';
    return 'stable';
  }
}

export interface StoredHistoricalInsight {
  userId: string;
  currentReviewId: string;
  totalReviews: number;
  scoreTrajectory: Array<{ reviewId: string; score: number; createdAt: Date }>;
  totalGain: number;
  insight: HistoricalInsight;
  updatedAt: Date;
}
