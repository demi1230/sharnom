# Multi-stage Dockerfile for sharnom-web (Next.js 15)

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY nx.json ./
COPY eslint.config.mjs ./
COPY jest.config.ts ./
COPY jest.preset.js ./

# Copy libs
COPY libs ./libs

# Copy web package.json
COPY apps/sharnom-web/package.json ./apps/sharnom-web/

# Install dependencies (use npm install for monorepo)
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/tsconfig.json ./
COPY --from=deps /app/tsconfig.base.json ./
COPY --from=deps /app/nx.json ./
COPY --from=deps /app/eslint.config.mjs ./
COPY --from=deps /app/jest.config.ts ./
COPY --from=deps /app/jest.preset.js ./
COPY --from=deps /app/libs ./libs

# Copy source
COPY apps/sharnom-web ./apps/sharnom-web

# Set build-time env vars
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3000}

# Sync Nx workspace before building
RUN npx nx sync

# Build Next.js app
RUN npx nx build sharnom-web --prod

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder /app/apps/sharnom-web/.next/standalone ./
COPY --from=builder /app/apps/sharnom-web/.next/static ./apps/sharnom-web/.next/static
COPY --from=builder /app/apps/sharnom-web/public ./apps/sharnom-web/public

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 4200

ENV PORT=4200
ENV HOSTNAME="0.0.0.0"

# Start Next.js server
CMD ["node", "apps/sharnom-web/server.js"]
