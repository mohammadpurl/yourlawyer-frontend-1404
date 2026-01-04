# راهنمای رفع مشکل Encoding (????? ?? ???)

## مشکل
وقتی بک‌اند پاسخ می‌فرستد، متن فارسی به صورت `????? ?? ???` نمایش داده می‌شود.

## علت
مشکل از **encoding** است. بک‌اند باید `Content-Type` را با `charset=utf-8` بفرستد.

## تغییرات اعمال شده در فرانت

✅ فرانت اصلاح شد:
- `Content-Type: application/json; charset=utf-8` اضافه شد
- `Accept: application/json; charset=utf-8` اضافه شد
- `responseEncoding: 'utf8'` تنظیم شد

## بررسی و اصلاح بک‌اند

### اگر بک‌اند FastAPI است:

```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# اضافه کردن charset=utf-8 به response headers
@app.middleware("http")
async def add_charset_header(request, call_next):
    response = await call_next(request)
    if response.headers.get("content-type", "").startswith("application/json"):
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response

# یا در هر endpoint:
@app.get("/rag/ask")
async def ask_question():
    return JSONResponse(
        content={"answer": "پاسخ فارسی"},
        headers={"Content-Type": "application/json; charset=utf-8"}
    )
```

### اگر بک‌اند Flask است:

```python
from flask import Flask, jsonify, make_response

app = Flask(__name__)

@app.route('/rag/ask', methods=['POST'])
def ask_question():
    response = make_response(jsonify({"answer": "پاسخ فارسی"}))
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response
```

### اگر بک‌اند Express.js است:

```javascript
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
```

### اگر بک‌اند Django است:

```python
from django.http import JsonResponse

def ask_question(request):
    response = JsonResponse({"answer": "پاسخ فارسی"})
    response['Content-Type'] = 'application/json; charset=utf-8'
    return response
```

## تست

### 1. بررسی Response Headers

در Developer Tools (F12) → Network → Response Headers را بررسی کن:

```
Content-Type: application/json; charset=utf-8  ✅ درست
```

اگر `charset=utf-8` نیست، مشکل از بک‌اند است.

### 2. بررسی Response Body

در Response tab، باید متن فارسی به درستی نمایش داده شود:

```json
{
  "answer": "پاسخ فارسی"  ✅ درست
}
```

اگر `?????` دیدی، مشکل از encoding است.

## راه‌حل سریع (موقت)

اگر نمی‌توانی بک‌اند را تغییر دهی، می‌توانی در فرانت response را decode کنی:

```typescript
// در http-service.ts (اگر لازم شد)
const response = await httpService(url, options);
if (typeof response.data === 'string') {
    // Try to decode if it's a string
    response.data = JSON.parse(
        decodeURIComponent(escape(response.data))
    );
}
```

اما **بهترین راه** این است که بک‌اند را اصلاح کنی.

## چک‌لیست

- [ ] بک‌اند `Content-Type: application/json; charset=utf-8` می‌فرستد
- [ ] فرانت `Accept: application/json; charset=utf-8` می‌فرستد
- [ ] Response Headers درست است
- [ ] Response Body به درستی نمایش داده می‌شود

## نکات مهم

1. **همیشه از UTF-8 استفاده کن** - این استاندارد برای فارسی است
2. **بک‌اند و فرانت باید هماهنگ باشند** - هر دو باید charset=utf-8 استفاده کنند
3. **Database هم باید UTF-8 باشد** - اگر از database استفاده می‌کنی، مطمئن شو charset=utf8 است

