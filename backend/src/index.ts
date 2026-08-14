import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import reviewRoutes from './routes/reviewRoutes.js';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
