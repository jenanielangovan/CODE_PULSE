import { Router, Request, Response } from 'express';
import { GeminiService } from '../gemini/geminiService.js';

const router = Router();
const geminiService = new GeminiService();

/**
 * POST /api/v1/reviews/analyze
 * Request Body: { diff: string }
 */
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { diff } = req.body;

    if (!diff || typeof diff !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid "diff" parameter in request body.',
      });
      return;
    }

    console.log(`[ReviewRoutes]: Received code review request. Diff length: ${diff.length}`);
    const reviewResult = await geminiService.analyzeDiff(diff);

    res.json(reviewResult);
  } catch (error: any) {
    console.error('[ReviewRoutes]: Error analyzing diff:', error);
    res.status(500).json({
      error: 'An internal server error occurred while analyzing the code diff.',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;
