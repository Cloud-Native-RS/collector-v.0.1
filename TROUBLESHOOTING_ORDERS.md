# 🔧 Troubleshooting: "Failed to load orders" Error

## Problem
Frontend prikazuje grešku: "Failed to load orders: An error occurred"

## Mogući Uzroci

### 1. **Orders Service nije pokrenut** (Najčešći)

**Provera:**
```bash
# Proveri da li servis radi
curl http://localhost:3002/health

# Ili proveri proces
ps aux | grep "orders-service\|node.*orders"
```

**Rešenje:**
```bash
# Pokreni orders-service
cd services/orders-service
npm run dev

# Ili koristi Docker Compose
cd services/orders-service
docker-compose up -d
```

### 2. **Port Konflikt**

**Provera:**
```bash
# Proveri da li je port 3002 zauzet
lsof -i :3002
```

**Rešenje:**
- Zaustavi drugi proces koji koristi port 3002
- Ili promeni PORT u `.env` fajlu

### 3. **Database Konekcija**

**Provera:**
```bash
# Testiraj health endpoint
curl http://localhost:3002/health

# Ako vraća 503, proveri database
psql -h localhost -p 5433 -U orders_user -d orders_db
```

**Rešenje:**
```bash
# Pokreni database ako ne radi
cd services/orders-service
docker-compose up -d postgres

# Pokreni migracije
npm run db:migrate:deploy
```

### 4. **Environment Varijable**

**Provera:**
```bash
# Proveri da li postoji .env fajl
cat services/orders-service/.env

# Proveri frontend .env
cat .env.local | grep ORDERS
```

**Rešenje:**
Kreiraj/azuriraj `.env` fajlove:

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_ORDERS_SERVICE_URL=http://localhost:3002
```

**Backend `services/orders-service/.env`:**
```bash
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://orders_user:orders_pass@localhost:5433/orders_db?schema=public
JWT_SECRET=dev-jwt-secret-change-in-production
CORS_ORIGIN=http://localhost:3000
```

### 5. **CORS Problem**

**Provera:**
Otvorite browser DevTools (F12) → Network tab → pogledaj CORS greške

**Rešenje:**
Dodaj u `services/orders-service/.env`:
```bash
CORS_ORIGIN=http://localhost:3000
```

I proveri da li servis koristi ovu vrednost:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
```

### 6. **Autentifikacija Problem**

**Provera:**
Proveri browser console za 401 (Unauthorized) greške

**Rešenje:**
Proveri da li postoji token u localStorage:
```javascript
// Browser console
localStorage.getItem('token')
```

Ako ne postoji, dodaj mock token:
```javascript
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci0xIiwidGVuYW50SWQiOiJkZWZhdWx0LXRlbmFudCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2MTgxOTY1MCwiZXhwIjoxNzYxOTA2MDUwfQ.fsYunvfCb6ckAyk61ng40OMP9q9HcZHyP7LQ21N5NOA')
localStorage.setItem('tenantId', 'default-tenant')
```

### 7. **Network Error u Browser-u**

**Provera:**
Browser DevTools → Console → proveri detaljne greške

**Uobičajene greške:**
- `Failed to fetch` - servis nije pokrenut
- `CORS error` - CORS nije konfigurisan
- `401 Unauthorized` - token problem
- `500 Internal Server Error` - server greška

## Quick Fix Checklist

- [ ] Orders service je pokrenut (`npm run dev` u `services/orders-service`)
- [ ] Database je pokrenut (`docker-compose up -d postgres`)
- [ ] Health endpoint radi (`curl http://localhost:3002/health`)
- [ ] Frontend `.env.local` ima `NEXT_PUBLIC_ORDERS_SERVICE_URL=http://localhost:3002`
- [ ] Backend `.env` ima pravilne vrednosti
- [ ] Token postoji u localStorage
- [ ] Browser refresh (Ctrl+Shift+R ili Cmd+Shift+R)

## Debug Koraci

### 1. Proveri da li servis radi
```bash
curl -v http://localhost:3002/health
```

### 2. Proveri da li API endpoint radi
```bash
curl -v http://localhost:3002/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: default-tenant"
```

### 3. Proveri frontend logs
- Otvori browser DevTools (F12)
- Console tab - proveri greške
- Network tab - proveri failed requests

### 4. Proveri backend logs
```bash
# Ako koristiš npm run dev
# Proveri terminal gde je pokrenut servis

# Ako koristiš Docker
docker-compose logs -f orders-service
```

## Rešavanje Problema Korak po Korak

### Korak 1: Pokreni sve servise
```bash
# Terminal 1: Database
cd services/orders-service
docker-compose up -d postgres redis rabbitmq

# Terminal 2: Orders Service
cd services/orders-service
npm install
npm run db:generate
npm run db:migrate
npm run dev

# Terminal 3: Frontend
npm run dev
```

### Korak 2: Testiraj pojedinačno
```bash
# Test health
curl http://localhost:3002/health

# Test API (zameni TOKEN)
curl http://localhost:3002/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "x-tenant-id: default-tenant"
```

### Korak 3: Proveri frontend
- Otvori `http://localhost:3000`
- Otvori DevTools (F12)
- Idite na Orders stranicu
- Proveri Console i Network tab

## Česti Problemi i Rešenja

### Problem: "Connection refused"
**Uzrok:** Servis nije pokrenut
**Rešenje:** Pokreni servis (`npm run dev`)

### Problem: "CORS policy error"
**Uzrok:** CORS nije konfigurisan
**Rešenje:** Dodaj `CORS_ORIGIN=http://localhost:3000` u `.env`

### Problem: "401 Unauthorized"
**Uzrok:** Token nedostaje ili je nevažeći
**Rešenje:** Dodaj token u localStorage ili proveri JWT_SECRET

### Problem: "503 Service Unavailable"
**Uzrok:** Database nije dostupan
**Rešenje:** Pokreni database i proveri DATABASE_URL

### Problem: "Cannot find module"
**Uzrok:** Dependencies nisu instalirani
**Rešenje:** `npm install` u `services/orders-service`

## Dodatna Pomoc

Ako problem persisitra:
1. Proveri kompletnu error poruku u browser console
2. Proveri backend logs
3. Proveri da li su sve zavisnosti pokrenute (database, redis, itd.)
4. Restartuj sve servise

