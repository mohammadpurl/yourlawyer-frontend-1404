# Docker Deployment Guide

این راهنما نحوه دیپلوی پروژه با استفاده از Docker را توضیح می‌دهد.

## پیش‌نیازها

- Docker
- Docker Compose (اختیاری)

## ساخت Image

```bash
docker build -t your-lawyer-front:latest .
```

## اجرای Container

### با Docker:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-api-url.com \
  --name your-lawyer-front \
  your-lawyer-front:latest
```

### با Docker Compose:

1. فایل `.env.production` را ایجاد کنید:
```bash
cp .env.production.example .env.production
```

2. متغیرهای محیطی را در `.env.production` تنظیم کنید

3. اجرای با docker-compose:
```bash
docker-compose up -d
```

## بررسی وضعیت

```bash
# مشاهده لاگ‌ها
docker logs your-lawyer-front

# یا با docker-compose
docker-compose logs -f
```

## توقف و حذف

```bash
# با Docker
docker stop your-lawyer-front
docker rm your-lawyer-front

# با Docker Compose
docker-compose down
```

## نکات مهم

1. **متغیرهای محیطی**: حتماً `NEXT_PUBLIC_API_URL` را تنظیم کنید
2. **Port**: به طور پیش‌فرض پورت 3000 استفاده می‌شود
3. **Production**: این Dockerfile برای محیط production بهینه شده است
4. **Security**: Container با user غیر root اجرا می‌شود

## ساختار Dockerfile

Dockerfile از سه مرحله استفاده می‌کند:

1. **deps**: نصب dependencies
2. **builder**: ساخت پروژه Next.js
3. **runner**: اجرای production build

این ساختار باعث می‌شود image نهایی کوچک‌تر و سریع‌تر باشد.

