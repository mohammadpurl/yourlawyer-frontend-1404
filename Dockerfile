# Build
FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
# Never bake secrets into the image
RUN rm -f .env .env.local .env.development .env.production .env.*.local || true
RUN npm run build

# Runtime (non-root, standalone)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8000

CMD ["node", "server.js"]
