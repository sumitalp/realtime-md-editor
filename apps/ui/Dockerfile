# Multi-stage build for Next.js production
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/ui/package.json ./apps/ui/
COPY apps/ui/next.config.* ./apps/ui/ 2>/dev/null || true
COPY apps/ui/tailwind.config.* ./apps/ui/ 2>/dev/null || true
COPY nx.json ./nx.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/ui/src ./apps/ui/src
COPY apps/ui/public ./apps/ui/public

# Build the application
RUN pnpm --filter ui build

# Production stage - Use standalone output for smaller image
FROM node:20-alpine AS production

WORKDIR /app

# Install dependencies for standalone mode
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/ui/.next/standalone ./apps/ui
COPY --from=builder --chown=nodejs:nodejs /app/apps/ui/.next/static ./apps/ui/.next/static
COPY --from=builder --chown=nodejs:nodejs /app/apps/ui/public ./apps/ui/public

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "apps/ui/server.js"]