# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client and build
RUN npm run db:generate && \
    npm run build

# Production stage
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for OpenShift
RUN groupadd -r nodejs && \
    useradd -r -g nodejs nodejs

WORKDIR /app

# Install production dependencies only (including Prisma CLI for migrations)
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# Copy Prisma CLI from builder (needed for generate command)
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Regenerate Prisma Client with updated binaryTargets for production runtime
RUN npx prisma generate

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production

# Expose port (will be set via environment variable in docker-compose)
EXPOSE 3007

# Health check (uses PORT environment variable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const port = process.env.PORT || '3007'; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]

