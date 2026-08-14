import { Router, Request, Response } from 'express';
import { ReviewService } from '../services/reviewService.js';

const router = Router();
const reviewService = new ReviewService();

/**
 * POST /api/reviews
 * Request Body: { code: string, filename?: string, userId?: string, projectId?: string, commitHash?: string, branch?: string }
 */
router.post('/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, filename, userId, projectId, commitHash, branch } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "code" parameter in request body.' });
      return;
    }

    console.log(`[APIRoutes]: Processing code review. Code length: ${code.length}`);
    const review = await reviewService.createReview(
      code,
      filename,
      userId || 'default_user',
      projectId || 'default_project',
      commitHash,
      branch
    );

    res.status(201).json(review);
  } catch (error: any) {
    console.error('[APIRoutes]: Error in POST /reviews:', error);
    res.status(500).json({
      error: 'An internal server error occurred while executing the code review.',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/reviews
 * Retrieves a list of recent code reviews.
 */
router.get('/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const limitQuery = req.query.limit;
    let limit = 20;
    if (typeof limitQuery === 'string') {
      const parsed = parseInt(limitQuery, 10);
      if (!isNaN(parsed)) {
        limit = parsed;
      }
    }
    const reviews = await reviewService.listReviews(limit);
    res.json(reviews);
  } catch (error: any) {
    console.error('[APIRoutes]: Error in GET /reviews:', error);
    res.status(500).json({
      error: 'An error occurred while listing the code reviews.',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/reviews/:id
 * Retrieves a specific review by Firestore ID.
 */
router.get('/reviews/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id as string);

    if (!review) {
      res.status(404).json({ error: `Review with ID "${id}" was not found.` });
      return;
    }

    res.json(review);
  } catch (error: any) {
    console.error(`[APIRoutes]: Error in GET /reviews/${req.params.id}:`, error);
    res.status(500).json({
      error: 'An error occurred while retrieving the code review details.',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/insights
 * Returns aggregated insights across reviews. Supports optional ?userId=123.
 */
router.get('/insights', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId;

    if (typeof userId === 'string') {
      const userInsights = await reviewService.getDeveloperInsights(userId);
      if (userInsights) {
        res.json(userInsights);
        return;
      }
    }

    // Fallback to system-wide aggregate insights
    const globalInsights = await reviewService.getInsights();
    res.json(globalInsights);
  } catch (error: any) {
    console.error('[APIRoutes]: Error in GET /insights:', error);
    res.status(500).json({
      error: 'An error occurred while computing historical review insights.',
      message: error.message || 'Unknown error',
    });
  }
});

/**
 * GET /api/dashboard
 * Returns summary statistics for dashboard widgets. Supports optional ?userId=123.
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId;

    if (typeof userId === 'string') {
      const userInsights = await reviewService.getDeveloperInsights(userId);
      const userSnapshots = await reviewService.getQualitySnapshots(userId);

      if (userInsights || userSnapshots) {
        res.json({
          userId,
          totalReviews: userInsights?.totalReviews || 0,
          averageScore: userInsights?.averageScore || 0,
          scoreTrend: userSnapshots?.history || [],
          severityBreakdown: userInsights?.severityBreakdown || {},
          categoryBreakdown: userInsights?.categoryBreakdown || {},
          categoryAverages: userInsights?.categoryAverages || {},
          updatedAt: userInsights?.updatedAt || new Date(),
        });
        return;
      }
    }

    // Fallback to system-wide dashboard
    const globalDashboard = await reviewService.getDashboard();
    res.json(globalDashboard);
  } catch (error: any) {
    console.error('[APIRoutes]: Error in GET /dashboard:', error);
    res.status(500).json({
      error: 'An error occurred while rendering the dashboard statistics.',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;
