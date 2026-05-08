# syntax=docker/dockerfile:1

# Stage 1: Build stage - install dependencies
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY --link package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Stage 2: Runtime stage - run the application
FROM node:24-alpine

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copy application code
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src

# Switch to non-root user (node user is built-in with UID 1000)
USER 1000

# Expose ports (8080 for app, 44420 for health/metrics)
EXPOSE 8080 44420

# Start the application
ENTRYPOINT ["node", "src/index.js"]
