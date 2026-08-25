import { Router, Request, Response } from 'express';
import { ReviewService } from '../services/reviewService.js';
import { HistoricalAnalysisService } from '../services/historicalAnalysisService.js';
import { DemoService } from '../services/demoService.js';

const router = Router();
const reviewService = new ReviewService();
const historicalAnalysisService = new HistoricalAnalysisService();
const demoService = new DemoService();

// ---------------------------------------------------------------------------
// Review endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/reviews
 * Submits code for review. Calls Gemini through Vertex AI and persists to Firestore.
 *
 * Body: { code, language?, filename?, userId?, projectId? }
 */
router.post('/reviews', async (req: Request, res: Response): Promise<void> => {
  const { code, language, filename, userId, projectId } = req.body;

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    res.status(400).json({ error: 'Missing or invalid "code" field. Must be a non-empty string.' });
    return;
  }

  if (code.length > 50_000) {
    res.status(413).json({ error: 'Code exceeds the 50,000 character limit.' });
    return;
  }

  try {
    const review = await reviewService.createReview(
      code,
      language,
      filename,
      userId || 'default_user',
      projectId || 'default_project'
    );
    res.status(201).json(review);
  } catch (error: any) {
    console.error('[apiRoutes] POST /reviews error:', error);
    res.status(500).json({
      error: 'We could not complete the review. Please try again.',
    });
  }
});

/**
 * GET /api/reviews
 * Lists recent reviews. Supports ?userId=xxx and ?limit=n query params.
 */
router.get('/reviews', async (req: Request, res: Response): Promise<void> => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  const limit = parseInt(req.query.limit as string, 10) || 20;

  try {
    const reviews = await reviewService.listReviews(userId, Math.min(limit, 50));
    res.json(reviews);
  } catch (error: any) {
    console.error('[apiRoutes] GET /reviews error:', error);
    res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

/**
 * GET /api/reviews/:id
 * Retrieves a single review by ID.
 */
router.get('/reviews/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await reviewService.getReviewById(req.params.id as string);
    if (!review) {
      res.status(404).json({ error: `Review "${req.params.id}" not found.` });
      return;
    }
    res.json(review);
  } catch (error: any) {
    console.error('[apiRoutes] GET /reviews/:id error:', error);
    res.status(500).json({ error: 'Failed to retrieve review.' });
  }
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/**
 * GET /api/dashboard
 * Returns dashboard summary for a user. Requires ?userId=xxx.
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : 'default_user';

  try {
    const dashboard = await reviewService.getDashboard(userId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('[apiRoutes] GET /dashboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
  }
});

// ---------------------------------------------------------------------------
// Historical insights
// ---------------------------------------------------------------------------

/**
 * GET /api/insights
 * Returns stored historical insight for a user. Requires ?userId=xxx.
 */
router.get('/insights', async (req: Request, res: Response): Promise<void> => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : 'default_user';

  try {
    const insight = await historicalAnalysisService.getHistoricalInsight(userId);
    if (!insight) {
      res.status(404).json({
        error: 'No historical insight found.',
        message: 'Submit at least 2 reviews to generate historical intelligence.',
      });
      return;
    }
    res.json(insight);
  } catch (error: any) {
    console.error('[apiRoutes] GET /insights error:', error);
    res.status(500).json({ error: 'Failed to retrieve insights.' });
  }
});

/**
 * POST /api/insights/analyze
 * Manually triggers historical analysis for a user.
 *
 * Body: { userId, currentReviewId }
 */
router.post('/insights/analyze', async (req: Request, res: Response): Promise<void> => {
    const { userId, currentReviewId } = req.body as { userId: string; currentReviewId: string };

  if (!userId || !currentReviewId) {
    res.status(400).json({ error: 'userId and currentReviewId are required.' });
    return;
  }

  try {
    const insight = await historicalAnalysisService.analyzeUserHistory(userId, currentReviewId);
    if (!insight) {
      res.status(422).json({
        error: 'Not enough review history to generate insights.',
        message: 'At least 2 reviews are required.',
      });
      return;
    }
    res.json(insight);
  } catch (error: any) {
    console.error('[apiRoutes] POST /insights/analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze history.' });
  }
});

// ---------------------------------------------------------------------------
// Demo endpoints — labeled, deterministic, no production data
// ---------------------------------------------------------------------------

/**
 * GET /api/demo/reviews
 * Returns all three demo reviews (62, 76, 91).
 */
router.get('/demo/reviews', (_req: Request, res: Response): void => {
  res.json({
    isDemo: true,
    message: 'Demo data — not real production reviews.',
    reviews: demoService.getReviews(),
  });
});

/**
 * GET /api/demo/reviews/:version
 * Returns a specific demo review version (1, 2, or 3).
 */
router.get('/demo/reviews/:version', (req: Request, res: Response): void => {
  const version = parseInt(String(req.params.version), 10);
  if (version < 1 || version > 3) {
    res.status(400).json({ error: 'Version must be 1, 2, or 3.' });
    return;
  }
  res.json({
    isDemo: true,
    review: demoService.getReviewByVersion(version as 1 | 2 | 3),
  });
});

/**
 * GET /api/demo/insights
 * Returns pre-computed historical insight showing the 62 → 76 → 91 story.
 */
router.get('/demo/insights', (_req: Request, res: Response): void => {
  res.json({
    isDemo: true,
    message: 'Demo data — shows the CodePulse historical learning story.',
    ...demoService.getHistoricalInsight(),
  });
});

/**
 * GET /api/demo/dashboard
 */
router.get('/demo/dashboard', (_req: Request, res: Response): void => {
  res.json(demoService.getDashboard());
});

export default router;
