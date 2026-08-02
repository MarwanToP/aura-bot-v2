# Multi-stage Dockerfile for Aura Bot v2 Monorepo
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY packages/config/package*.json ./packages/config/
COPY packages/database/package*.json ./packages/database/
COPY packages/logger/package*.json ./packages/logger/
COPY packages/redis/package*.json ./packages/redis/
COPY apps/bot/package*.json ./apps/bot/
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY apps/ai-worker/package*.json ./apps/ai-worker/

RUN npm ci --legacy-peer-deps || npm install

# Copy application sources
COPY . .

# Environment
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
