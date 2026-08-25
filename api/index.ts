import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../backend/src/routes/apiRoutes.js';
import reviewRoutes from '../backend/src/routes/reviewRoutes.js';

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Mount API routes
app.use('/api', apiRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'CodePulse Vercel API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });
});

export default app;
