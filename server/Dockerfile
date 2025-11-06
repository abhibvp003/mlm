FROM node:18-alpine
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy source
COPY . .

# Environment defaults (can be overridden by compose)
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001
CMD ["node", "index.js"]


