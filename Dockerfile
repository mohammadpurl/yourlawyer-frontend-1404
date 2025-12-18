# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 6000

ENV PORT=6000
ENV HOSTNAME="0.0.0.0"

# Log environment variables at startup (for debugging)
RUN echo "Environment variables will be logged at container startup"

CMD ["sh", "-c", "echo '[DOCKER] Starting Next.js server...' && echo '[DOCKER] NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL' && echo '[DOCKER] API_URL=$API_URL' && echo '[DOCKER] NODE_ENV=$NODE_ENV' && echo '[DOCKER] PORT=$PORT' && npm start"]

