import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import apiRoutes from './routes/apiRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Security: limit request body size to prevent abuse
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// CORS — in production, restrict to your frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.use('/api', apiRoutes);
app.use('/api/v1/reviews', reviewRoutes); // Legacy route kept for compatibility

// Health check — required for Cloud Run
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'CodePulse API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler — never expose stack traces
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server]: Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
});

app.listen(port, () => {
  console.log(`[CodePulse]: Server running at http://localhost:${port}`);
  console.log(`[CodePulse]: GCP Project: ${process.env.GCP_PROJECT_ID || 'not configured'}`);
  console.log(`[CodePulse]: Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'}`);
});
