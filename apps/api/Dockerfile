# Multi-stage build for production optimization
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/logger/package.json ./packages/logger/
COPY apps/api/tsconfig.json ./apps/api/
COPY nest-cli.json ./
COPY tsconfig.base.json ./
COPY nx.json ./nx.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api/src ./apps/api/src
COPY packages/logger/src ./packages/logger/src

# Build the application
RUN pnpm --filter api build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/logger/package.json ./packages/logger/

# Install production dependencies only
RUN npm install -g pnpm@10.15.0 && \
    pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "apps/api/dist/main.js"]