FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm install -D typescript tsx
RUN npx tsc

# ── Production image ──
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copy prompts directory (required at runtime for AI prompts)
COPY prompts/ ./prompts/

COPY package*.json ./

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S codepulse -u 1001
USER codepulse

# Cloud Run listens on PORT env variable (default 8080)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8080}/health || exit 1

CMD ["node", "dist/index.js"]
