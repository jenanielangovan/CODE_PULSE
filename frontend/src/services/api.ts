import type { ReviewDocument, DashboardData, StoredHistoricalInsight, ReviewRequest } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ============================================================
// Review API
// ============================================================

export async function submitReview(request: ReviewRequest): Promise<ReviewDocument> {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<ReviewDocument>(res);
}

export async function getReview(id: string): Promise<ReviewDocument> {
  const res = await fetch(`${API_BASE}/reviews/${id}`);
  return handleResponse<ReviewDocument>(res);
}

export async function listReviews(userId?: string, limit = 20): Promise<ReviewDocument[]> {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('limit', String(limit));
  const res = await fetch(`${API_BASE}/reviews?${params}`);
  return handleResponse<ReviewDocument[]>(res);
}

// ============================================================
// Dashboard API
// ============================================================

export async function getDashboard(userId?: string): Promise<DashboardData> {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE}/dashboard${params}`);
  return handleResponse<DashboardData>(res);
}

// ============================================================
// Insights API
// ============================================================

export async function getHistoricalInsights(userId?: string): Promise<StoredHistoricalInsight> {
  const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE}/insights${params}`);
  return handleResponse<StoredHistoricalInsight>(res);
}

export async function triggerInsightAnalysis(
  userId: string,
  currentReviewId: string
): Promise<StoredHistoricalInsight> {
  const res = await fetch(`${API_BASE}/insights/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currentReviewId }),
  });
  return handleResponse<StoredHistoricalInsight>(res);
}

// ============================================================
// Demo API
// ============================================================

export async function getDemoReviews(): Promise<{ isDemo: true; reviews: ReviewDocument[] }> {
  const res = await fetch(`${API_BASE}/demo/reviews`);
  return handleResponse(res);
}

export async function getDemoReviewByVersion(
  version: 1 | 2 | 3
): Promise<{ isDemo: true; review: ReviewDocument }> {
  const res = await fetch(`${API_BASE}/demo/reviews/${version}`);
  return handleResponse(res);
}

export async function getDemoInsights(): Promise<StoredHistoricalInsight & { isDemo: true }> {
  const res = await fetch(`${API_BASE}/demo/insights`);
  return handleResponse(res);
}

export async function getDemoDashboard(): Promise<DashboardData & { isDemo: true }> {
  const res = await fetch(`${API_BASE}/demo/dashboard`);
  return handleResponse(res);
}

// ============================================================
// AI Chatbot API
// ============================================================

export async function sendChatMessage(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  context?: import('../types').ChatContext
): Promise<import('../types').ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  return handleResponse<import('../types').ChatResponse>(res);
}

