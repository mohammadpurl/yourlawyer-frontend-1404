# راهنمای رفع مشکل Timeout در Production

## مشکل
وقتی پروژه را روی سرور deploy می‌کنید، درخواست login بعد از ~30 ثانیه timeout می‌خورد، در حالی که:
- ✅ در local به درستی کار می‌کند
- ✅ Backend کد را تولید می‌کند و می‌فرستد
- ❌ Frontend نمی‌تواند پاسخ را دریافت کند

## علت‌های احتمالی

### 1. مشکل در URL Configuration

**مشکل:** استفاده از `localhost` یا `127.0.0.1` در production

**راه حل:**
- اگر backend و frontend در یک Docker network هستند، از **service name** استفاده کنید
- اگر backend در سرور دیگری است، از **IP یا domain** استفاده کنید
- هرگز از `localhost` در Docker container استفاده نکنید

**مثال:**
```yaml
# ❌ اشتباه
NEXT_PUBLIC_API_URL=http://localhost:8000

# ✅ درست - اگر backend در همان docker-compose است
NEXT_PUBLIC_API_URL=http://backend-service:8000

# ✅ درست - اگر backend در سرور دیگری است
NEXT_PUBLIC_API_URL=http://your-backend-domain.com:8000
# یا
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
```

### 2. مشکل در Docker Network

**مشکل:** Container ها نمی‌توانند به یکدیگر متصل شوند

**بررسی:**
```bash
# بررسی network
docker network inspect your-lawyer-front-next_app-network

# تست اتصال از داخل container
docker exec your-lawyer-front wget -O- http://backend-url:port/health
```

**راه حل:**
اگر backend در docker-compose دیگری است، باید:
1. از `host` network استفاده کنید، یا
2. Network مشترک ایجاد کنید

### 3. مشکل در Firewall یا Network Policy

**بررسی:**
```bash
# بررسی firewall
sudo ufw status
sudo iptables -L

# تست از داخل container
docker exec your-lawyer-front ping backend-ip
docker exec your-lawyer-front telnet backend-ip port
```

### 4. مشکل در DNS Resolution

**بررسی:**
```bash
# تست DNS از داخل container
docker exec your-lawyer-front nslookup backend-domain
docker exec your-lawyer-front dig backend-domain
```

## راه‌حل‌های گام به گام

### مرحله 1: بررسی لاگ‌ها

بعد از rebuild، لاگ‌ها را بررسی کنید:

```bash
docker logs -f your-lawyer-front
```

**به دنبال این لاگ‌ها بگردید:**

1. **Environment Variables:**
```
[CONFIG] Environment variables: { API_URL: '...', ... }
[AUTH-ACTION] Environment configuration { NEXT_PUBLIC_API_URL: '...', ... }
```

2. **HTTP Request:**
```
[HTTP REQUEST] POST /auth/login
[API_BASE] Starting request to /auth/login
```

3. **Timeout Error:**
```
[HTTP TIMEOUT ERROR] ...
[API_BASE] Request TIMEOUT after 30000ms
```

### مرحله 2: بررسی URL

در لاگ‌ها، `baseURL` و `fullURL` را بررسی کنید:

```
[HTTP REQUEST] POST /auth/login
baseURL: "http://localhost:8000"  ❌ اشتباه
fullURL: "http://localhost:8000/auth/login"
```

**اگر `localhost` دیدید، مشکل از اینجاست!**

### مرحله 3: تنظیم صحیح Environment Variables

#### اگر Backend در همان Docker Compose است:

```yaml
# docker-compose.yml
services:
  backend:
    # ... backend config
    networks:
      - app-network
  
  nextjs:
    # ... frontend config
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000  # استفاده از service name
      - API_URL=http://backend:8000
    networks:
      - app-network
```

#### اگر Backend در سرور دیگری است:

```bash
# .env.production
NEXT_PUBLIC_API_URL=http://your-backend-ip:8000
# یا
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### مرحله 4: تست اتصال

قبل از rebuild، از داخل container تست کنید:

```bash
# ورود به container
docker exec -it your-lawyer-front sh

# تست اتصال
wget -O- http://your-backend-url:port/health
# یا
curl http://your-backend-url:port/health
```

اگر این کار نکرد، مشکل از network است.

### مرحله 5: افزایش Timeout (راه حل موقت)

اگر مطمئن هستید که backend پاسخ می‌دهد ولی کند است:

```typescript
// app/core/http-service/http-service.ts
timeout: 60000, // 60 seconds instead of 30
```

**⚠️ توجه:** این فقط راه حل موقت است. باید مشکل اصلی را پیدا کنید.

## چک‌لیست رفع مشکل

- [ ] بررسی لاگ‌ها برای دیدن `baseURL`
- [ ] اطمینان از اینکه `localhost` استفاده نمی‌شود
- [ ] تست اتصال از داخل container
- [ ] بررسی Docker network
- [ ] بررسی firewall
- [ ] بررسی DNS resolution
- [ ] بررسی environment variables در container

## مثال Configuration صحیح

### سناریو 1: Backend و Frontend در یک Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: your-backend-image
    ports:
      - "8000:8000"
    networks:
      - app-network

  nextjs:
    build: .
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - API_URL=http://backend:8000
    networks:
      - app-network
    depends_on:
      - backend

networks:
  app-network:
    driver: bridge
```

### سناریو 2: Backend در سرور دیگری

```bash
# .env.production
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
API_URL=http://192.168.1.100:8000
```

یا اگر از domain استفاده می‌کنید:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_URL=https://api.yourdomain.com
```

## دستورات مفید برای دیباگ

```bash
# مشاهده لاگ‌های real-time
docker logs -f your-lawyer-front

# بررسی environment variables در container
docker exec your-lawyer-front env | grep API_URL

# تست اتصال به backend
docker exec your-lawyer-front wget -O- http://backend-url:port/health

# بررسی network
docker network inspect your-lawyer-front-next_app-network

# بررسی DNS
docker exec your-lawyer-front nslookup backend-domain

# بررسی firewall
sudo ufw status
```

## نکات مهم

1. **هرگز از `localhost` در Docker استفاده نکنید** - در Docker، `localhost` به خود container اشاره می‌کند، نه host machine

2. **از Service Name استفاده کنید** - اگر در یک docker-compose هستید، از نام service استفاده کنید

3. **IP یا Domain** - اگر backend در جای دیگری است، از IP یا domain استفاده کنید

4. **بررسی Network** - مطمئن شوید container ها در یک network هستند

5. **بررسی Firewall** - مطمئن شوید firewall مانع اتصال نمی‌شود

## بعد از اعمال تغییرات

1. Rebuild کنید:
```bash
docker-compose down
docker-compose up --build -d
```

2. لاگ‌ها را بررسی کنید:
```bash
docker logs -f your-lawyer-front
```

3. به دنبال این لاگ‌ها بگردید:
- `[CONFIG] Environment variables` - باید URL صحیح را نشان دهد
- `[HTTP REQUEST]` - باید fullURL صحیح را نشان دهد
- اگر timeout دیدید، `[HTTP TIMEOUT ERROR]` را بررسی کنید

