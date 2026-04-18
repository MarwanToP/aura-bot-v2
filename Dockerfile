FROM node:20-alpine

# Build deps for native modules (sharp, canvas, etc.)
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create logs dir
RUN mkdir -p logs

# Non-root user for security
RUN addgroup -g 1001 -S aura && adduser -S aura -u 1001
RUN chown -R aura:aura /app
USER aura

# Port for the web dashboard
EXPOSE 3000

# Health check — Railway uses this to confirm the service is alive
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "main.js"]
