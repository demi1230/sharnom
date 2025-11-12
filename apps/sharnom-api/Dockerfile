# Multi-stage Dockerfile for sharnom-api (Express + Prisma + SQLite)

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy root package files and workspace configs
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./
COPY nx.json ./

# Copy libs (contracts, config)
COPY libs ./libs

# Copy API package.json and prisma schema
COPY apps/sharnom-api/package.json ./apps/sharnom-api/
COPY apps/sharnom-api/prisma ./apps/sharnom-api/prisma

# Install dependencies (use npm install for monorepo)
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate --schema=apps/sharnom-api/prisma/schema.prisma

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage (only root node_modules in monorepo)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/tsconfig.json ./
COPY --from=deps /app/tsconfig.base.json ./
COPY --from=deps /app/nx.json ./
COPY --from=deps /app/libs ./libs
COPY apps/sharnom-api ./apps/sharnom-api

# Sync Nx workspace before building
RUN npx nx sync

# Build the API
RUN npx nx build sharnom-api --prod

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Install production dependencies only
ENV NODE_ENV=production

# Copy package.json files for module resolution
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/sharnom-api/package.json ./apps/sharnom-api/

# Copy built application
COPY --from=builder /app/apps/sharnom-api/dist ./apps/sharnom-api/dist
COPY --from=builder /app/apps/sharnom-api/prisma ./apps/sharnom-api/prisma

# Copy libs (needed for @sharnom/contracts and @sharnom/config resolution)
COPY --from=builder /app/libs ./libs

# Copy node_modules from deps (includes Prisma client and all dependencies)
COPY --from=deps /app/node_modules ./node_modules

# Run migrations and start server
EXPOSE 3000

# Use shell form for CMD to run migrations then start
CMD npx prisma migrate deploy --schema=apps/sharnom-api/prisma/schema.prisma && \
    npx prisma db seed && \
    node apps/sharnom-api/dist/main.js
