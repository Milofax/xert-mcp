# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Release stage
FROM node:18-alpine AS release

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Production dependencies only
ENV NODE_ENV=production
RUN npm ci --ignore-scripts --omit=dev

# Security: run as non-root user
USER node

# MCP servers use STDIO transport
ENTRYPOINT ["node", "dist/server.js"]
