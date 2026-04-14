FROM node:20-alpine
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p logs
RUN addgroup -g 1001 -S aura && adduser -S aura -u 1001
RUN chown -R aura:aura /app
USER aura
EXPOSE 3000
CMD ["node", "src/index.js"]
