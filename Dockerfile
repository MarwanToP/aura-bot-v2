FROM node:20-alpine

# Build deps for native modules (sharp, canvas, etc.)
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy source
COPY . .

# Create logs dir
RUN mkdir -p logs

# Non-root user for security
RUN addgroup -g 1001 -S aura && adduser -S aura -u 1001
RUN chown -R aura:aura /app
USER aura

# Port for the web dashboard (7860 for Hugging Face Spaces, 3000 for standard)
EXPOSE 7860 3000

# Health check for web services; skip when running BOT worker without PORT binding.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD sh -c 'if [ "${MODE:-}" = "BOT" ] && [ -z "${PORT:-}" ]; then exit 0; fi; wget -qO- "http://localhost:${PORT:-7860}/api/health" >/dev/null || exit 1'

CMD ["node", "main.js"]
