# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files (explicitly include package-lock.json)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs && \
    useradd -r -g nodejs nodejs

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --production; fi && \
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
ENV PORT=3009

# Expose port
EXPOSE 3009

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3009/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]

