# راهنمای دیباگ و بررسی لاگ‌ها

این فایل راهنمای بررسی لاگ‌ها و دیباگ مشکل login در Docker را توضیح می‌دهد.

## تغییرات اعمال شده

### 1. لاگ‌های HTTP Service (`app/core/http-service/http-service.ts`)
- ✅ افزودن timeout 30 ثانیه‌ای به axios
- ✅ لاگ‌گذاری تمام درخواست‌های HTTP (request/response)
- ✅ لاگ‌گذاری خطاهای شبکه و timeout
- ✅ نمایش مدت زمان هر درخواست

### 2. لاگ‌های Auth Actions (`app/_actions/auth-actions.ts`)
- ✅ لاگ‌گذاری کامل flow ورود
- ✅ نمایش environment variables
- ✅ لاگ‌گذاری مدت زمان هر مرحله
- ✅ لاگ‌گذاری خطاها با جزئیات کامل

### 3. لاگ‌های Client-Side (`app/(auth)/login/page.tsx`)
- ✅ لاگ‌گذاری در مرورگر (console)
- ✅ ردیابی زمان هر عملیات

### 4. بهبود Docker Configuration
- ✅ رفع مشکل پورت (3000:6000)
- ✅ افزودن logging driver
- ✅ نمایش environment variables در startup

## نحوه بررسی لاگ‌ها

### 1. لاگ‌های Docker Container

```bash
# مشاهده لاگ‌های real-time
docker logs -f your-lawyer-front

# مشاهده آخرین 100 خط لاگ
docker logs --tail 100 your-lawyer-front

# مشاهده لاگ‌های با timestamp
docker logs -t your-lawyer-front
```

### 2. لاگ‌های Server-Side (در Docker)

لاگ‌های server-side با prefix های زیر نمایش داده می‌شوند:
- `[AUTH-ACTION]` - لاگ‌های مربوط به auth actions
- `[HTTP REQUEST]` - درخواست‌های HTTP
- `[HTTP RESPONSE]` - پاسخ‌های HTTP
- `[HTTP NETWORK ERROR]` - خطاهای شبکه
- `[API_BASE]` - لاگ‌های base API calls

### 3. لاگ‌های Client-Side (در مرورگر)

1. باز کردن Developer Tools (F12)
2. رفتن به تب Console
3. جستجو برای `[CLIENT] [LOGIN]`

## چک‌لیست بررسی مشکل

### مرحله 1: بررسی Environment Variables

در لاگ‌های Docker، به دنبال این خط بگردید:
```
[DOCKER] NEXT_PUBLIC_API_URL=...
[DOCKER] API_URL=...
```

**مشکلات احتمالی:**
- اگر `NEXT_PUBLIC_API_URL` خالی است یا `undefined` است
- اگر URL به درستی تنظیم نشده است
- اگر URL به backend در Docker قابل دسترسی نیست

**راه حل:**
```bash
# بررسی environment variables در container
docker exec your-lawyer-front env | grep API_URL

# تست اتصال به backend از داخل container
docker exec your-lawyer-front wget -O- http://backend-url:port/health
```

### مرحله 2: بررسی درخواست HTTP

به دنبال این لاگ‌ها بگردید:
```
[HTTP REQUEST] POST /auth/login
[API_BASE] Starting request to /auth/login
```

**مشکلات احتمالی:**
- اگر درخواست شروع نمی‌شود → مشکل در client-side
- اگر timeout می‌خورد → مشکل در اتصال به backend
- اگر خطای 404 می‌دهد → URL اشتباه است

### مرحله 3: بررسی پاسخ Backend

به دنبال این لاگ بگردید:
```
[HTTP RESPONSE] POST /auth/login
[API_BASE] Request completed successfully in XXXms
```

**مشکلات احتمالی:**
- اگر این لاگ نمایش داده نمی‌شود → درخواست timeout شده یا خطای شبکه
- اگر خطای 500 می‌دهد → مشکل در backend
- اگر خطای 400 می‌دهد → مشکل در داده‌های ارسالی

### مرحله 4: بررسی Network Errors

اگر خطای شبکه دارید، به دنبال این لاگ بگردید:
```
[HTTP NETWORK ERROR]
```

**مشکلات احتمالی:**
- `ECONNREFUSED` → backend در دسترس نیست
- `ETIMEDOUT` → timeout در اتصال
- `ENOTFOUND` → DNS resolution failed

## مثال لاگ‌های موفق

```
[AUTH-ACTION] [2024-01-01T10:00:00.000Z] [INFO] sendVerificationCodeAction started
[AUTH-ACTION] [2024-01-01T10:00:00.001Z] [INFO] Environment configuration
[HTTP REQUEST] POST /auth/login
[API_BASE] Starting request to /auth/login
[HTTP RESPONSE] POST /auth/login
[API_BASE] Request completed successfully in 250ms
[AUTH-ACTION] [2024-01-01T10:00:00.252Z] [INFO] sendVerificationCodeAction completed successfully
```

## مثال لاگ‌های خطا

```
[AUTH-ACTION] [2024-01-01T10:00:00.000Z] [INFO] sendVerificationCodeAction started
[HTTP REQUEST] POST /auth/login
[HTTP NETWORK ERROR] ECONNREFUSED
[API_BASE] Request failed after 30000ms
[AUTH-ACTION] [2024-01-01T10:00:30.000Z] [ERROR] sendVerificationCodeAction failed
```

## نکات مهم

1. **Timeout**: اگر درخواست بیشتر از 30 ثانیه طول بکشد، timeout می‌خورد
2. **Environment Variables**: در Docker باید از `docker-compose.yml` یا `.env.production` تنظیم شوند
3. **Network**: اگر backend در container دیگری است، از نام service استفاده کنید (مثلاً `http://backend:8000`)
4. **Port Mapping**: مطمئن شوید پورت‌ها به درستی map شده‌اند (3000:6000)

## دستورات مفید برای دیباگ

```bash
# بررسی وضعیت container
docker ps

# بررسی لاگ‌های real-time
docker logs -f your-lawyer-front

# ورود به container
docker exec -it your-lawyer-front sh

# تست اتصال به backend از داخل container
docker exec your-lawyer-front wget -O- http://your-backend-url/api/health

# بررسی environment variables
docker exec your-lawyer-front env

# بررسی network connectivity
docker network inspect your-lawyer-front-next_app-network
```

## رفع مشکلات رایج

### مشکل: درخواست pending می‌ماند و timeout می‌خورد

**علت احتمالی:**
- Backend در دسترس نیست
- URL اشتباه است (استفاده از localhost در Docker)
- مشکل در network Docker
- مشکل در firewall

**راه حل:**
1. بررسی لاگ‌های backend
2. تست اتصال از داخل container
3. بررسی network Docker
4. بررسی environment variables
5. **مهم:** مطمئن شوید از `localhost` استفاده نمی‌کنید - از service name یا IP استفاده کنید

**برای راهنمای کامل رفع مشکل timeout، فایل `TIMEOUT_FIX_GUIDE.md` را مطالعه کنید.**

### مشکل: Environment variables تنظیم نشده

**راه حل:**
1. ایجاد فایل `.env.production` در root پروژه
2. اضافه کردن متغیرها:
   ```
   NEXT_PUBLIC_API_URL=http://your-backend-url:port
   API_URL=http://your-backend-url:port
   JWT_SERVER_SECRET=your-secret-key
   ```
3. Rebuild container:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### مشکل: پورت اشتباه

**راه حل:**
- Dockerfile پورت 6000 را expose می‌کند
- docker-compose.yml باید `3000:6000` باشد (نه `3000:3000`)

