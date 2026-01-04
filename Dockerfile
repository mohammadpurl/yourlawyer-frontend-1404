# مرحله بیلد
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# مرحله اجرا
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

# همه چیز لازم رو کپی کن (شامل node_modules و .next)
COPY --from=builder /app /app

EXPOSE 8000

CMD ["npx", "next", "start", "-p", "8000"]
