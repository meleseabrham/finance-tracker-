# ── Stage 1: dependencies ──────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# ── Stage 2: runtime ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S fintrack && adduser -S fintrack -G fintrack

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN chown -R fintrack:fintrack /app
USER fintrack

EXPOSE 5000
CMD ["node", "src/index.js"]
