# ── Stage 1: build ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
# When running inside Docker, API calls go through nginx proxy
ENV VITE_API_BASE=/api
RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────
FROM nginx:1.27-alpine AS runner
# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf
# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
