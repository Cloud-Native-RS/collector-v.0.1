# Tenant Sistem - Detaljno Objašnjenje

## 📚 Šta je Tenant?

**Tenant** (u našem slučaju `tenantId`) je identifikator koji izoluje podatke različitih klijenata (kompanija/organizacija) u istoj aplikaciji. Ovo je koncept **Multi-Tenancy** arhitekture.

### Primer:
- **Tenant A** (kompanija "ABC Corp") → vidi samo svoje ponude, narudžbe, fakture
- **Tenant B** (kompanija "XYZ Ltd") → vidi samo svoje podatke
- Podaci su potpuno izolovani u bazi podataka

## 🎯 Zašto se koristi?

1. **Izolacija podataka** - Svaki klijent vidi samo svoje podatke
2. **Bezbednost** - Sprečava slučajni pristup tuđim podacima
3. **Skalabilnost** - Jedna aplikacija, više klijenata
4. **Ekonomski model** - SaaS (Software as a Service) platforma

## 🏗️ Kako radi u Collector aplikaciji?

### 1. **Frontend (Next.js) → Backend Flow**

```
Browser (localStorage) 
  ↓
  tenantId: "default-tenant"
  ↓
Next.js API Route (app/api/*/route.ts)
  ↓
  Header: x-tenant-id: "default-tenant"
  ↓
Microservice (Express)
  ↓
  Middleware ekstraktuje tenantId
  ↓
Database Query
  ↓
  WHERE tenantId = 'default-tenant'
```

### 2. **Gde se čuva tenantId?**

#### **Frontend (Browser):**
```typescript
// localStorage
localStorage.setItem('tenantId', 'default-tenant');
const tenantId = localStorage.getItem('tenantId') || 'default-tenant';
```

#### **Backend (JWT Token):**
```typescript
// JWT token payload
{
  "id": "test-user-1",
  "tenantId": "default-tenant",  // ← Tenant ID u tokenu
  "email": "test@example.com"
}
```

### 3. **Kako se prosleđuje kroz API pozive?**

#### **Frontend API Client (`lib/api/*.ts`):**
```typescript
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const tenantId = typeof window !== 'undefined' 
    ? localStorage.getItem('tenantId') || 'default-tenant' 
    : 'default-tenant';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId,  // ← Šalje se kao header
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
}
```

#### **Next.js API Route (`app/api/*/route.ts`):**
```typescript
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
  const authHeader = request.headers.get('authorization');

  // Prosleđuje se microservice-u
  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,  // ← Prosleđuje dalje
    'Authorization': authHeader,
  };

  return fetch(`${SERVICE_URL}/api/endpoint`, { headers });
}
```

#### **Microservice Middleware (`services/*/src/middleware/tenant.middleware.ts`):**
```typescript
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Prvo pokušava da uzme iz JWT tokena (req.user.tenantId)
  // 2. Zatim iz header-a (req.headers['x-tenant-id'])
  // 3. Fallback na 'default-tenant'
  const tenantId = req.user?.tenantId 
    || req.headers['x-tenant-id'] as string 
    || 'default-tenant';
  
  if (!tenantId) {
    return next(new AppError('Tenant ID is required', 400));
  }

  // Dodaje u request objekat
  req.tenantId = tenantId;
  next();
};
```

#### **Database Query (`services/*/src/services/*.service.ts`):**
```typescript
static async getOfferById(id: string, tenantId: string) {
  const offer = await prisma.offer.findFirst({
    where: {
      id,
      tenantId,  // ← Filter po tenantId - samo podaci ovog tenanta
    },
  });
  return offer;
}
```

## 🔐 Best Practices za pravilno korišćenje

### ✅ **1. UVIJEK koristiti tenantId u database upitima**

```typescript
// ✅ DOBRO - Filtrirano po tenantId
const offers = await prisma.offer.findMany({
  where: { tenantId: req.tenantId }
});

// ❌ LOŠE - Može vratiti podatke drugih tenanata!
const offers = await prisma.offer.findMany(); // OPASNO!
```

### ✅ **2. Validirati tenantId u svakom API pozivu**

```typescript
// ✅ DOBRO - Middleware validira tenantId
app.use(tenantMiddleware);

// ✅ DOBRO - Double-check u servisu
async getById(id: string, tenantId: string) {
  const item = await prisma.item.findFirst({
    where: { id, tenantId }  // Oba uslova!
  });
  
  if (!item) {
    throw new AppError('Not found', 404);
  }
  
  return item;
}
```

### ✅ **3. Prosleđivati tenantId iz route-a u servis**

```typescript
// ✅ DOBRO
app.get('/api/offers/:id', async (req, res) => {
  const tenantId = req.tenantId!;  // Iz middleware-a
  const offer = await OfferService.getById(req.params.id, tenantId);
  res.json(offer);
});
```

### ✅ **4. Koristiti tenantId iz localStorage na frontendu**

```typescript
// ✅ DOBRO - Čita iz localStorage
const tenantId = localStorage.getItem('tenantId') || 'default-tenant';

// ❌ LOŠE - Hardcoded
const tenantId = 'default-tenant';
```

### ✅ **5. Prosleđivati tenantId kroz sve API pozive**

```typescript
// ✅ DOBRO - Automatski u fetchWithAuth
const response = await fetchWithAuth('/api/offers');  
// Automatski dodaje x-tenant-id header

// ❌ LOŠE - Ručno bez header-a
const response = await fetch('/api/offers');  
// Nedostaje x-tenant-id!
```

## 📋 Checklist za novi feature

Kada dodajete novi feature, uvek proverite:

- [ ] Da li frontend prosleđuje `x-tenant-id` header?
- [ ] Da li Next.js API route prosleđuje `x-tenant-id` dalje?
- [ ] Da li microservice middleware ekstraktuje `tenantId`?
- [ ] Da li servis koristi `tenantId` u database upitima?
- [ ] Da li su svi `WHERE` klauzule filtrirane po `tenantId`?

## 🔍 Primer: Kompletan flow

### 1. Frontend poziv
```typescript
// app/(app)/sales/quotations/page.tsx
const offers = await offersApi.list({ status: 'DRAFT' });
```

### 2. API Client
```typescript
// lib/api/offers.ts
async list(filters) {
  const tenantId = localStorage.getItem('tenantId') || 'default-tenant';
  return fetchWithAuth('/api/offers', {
    headers: { 'x-tenant-id': tenantId }
  });
}
```

### 3. Next.js API Route
```typescript
// app/api/offers/route.ts
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  return fetch(`${OFFERS_SERVICE_URL}/api/offers`, {
    headers: { 'x-tenant-id': tenantId }
  });
}
```

### 4. Microservice Middleware
```typescript
// services/offers-service/src/middleware/tenant.middleware.ts
req.tenantId = req.headers['x-tenant-id'];
```

### 5. Service Layer
```typescript
// services/offers-service/src/services/offer.service.ts
static async listOffers(tenantId: string, filters) {
  return prisma.offer.findMany({
    where: { tenantId, ...filters }  // ← FILTER PO TENANT
  });
}
```

### 6. Database
```sql
SELECT * FROM offers 
WHERE "tenantId" = 'default-tenant' 
  AND status = 'DRAFT';
```

## ⚠️ Česte greške

### ❌ **Greška 1: Zaboravljate tenantId u WHERE**
```typescript
// OPASNO - vraća sve podatke svih tenanata!
const allOffers = await prisma.offer.findMany();
```

### ❌ **Greška 2: Ne prosleđujete tenantId kroz chain**
```typescript
// Route
app.get('/api/offers/:id', async (req, res) => {
  const offer = await OfferService.getById(req.params.id);
  // ❌ Nedostaje tenantId!
});
```

### ❌ **Greška 3: Hardcoded tenantId**
```typescript
// ❌ Ne koristite hardcoded vrednosti
const offers = await prisma.offer.findMany({
  where: { tenantId: 'default-tenant' }  // Loše!
});
```

## 🎓 Primeri iz koda

### Primer 1: Dobro implementiran servis
```typescript
// services/offers-service/src/services/offer.service.ts
static async getOfferById(id: string, tenantId: string) {
  // ✅ Filtrirano po id I tenantId
  const offer = await prisma.offer.findFirst({
    where: { id, tenantId },
    include: { lineItems: true }
  });
  return offer;
}
```

### Primer 2: Dobro implementiran route
```typescript
// services/offers-service/src/routes/offer.routes.ts
router.get('/:id', authMiddleware, tenantMiddleware, async (req, res) => {
  const tenantId = req.tenantId!;  // ✅ Iz middleware-a
  const offer = await OfferService.getOfferById(req.params.id, tenantId);
  res.json({ success: true, data: offer });
});
```

## 🚀 Development vs Production

### Development
- Default tenant: `'default-tenant'`
- Često se koristi za testiranje
- Može biti manje strog u validaciji

### Production
- Tenant ID mora doći iz JWT tokena (iz authentication servisa)
- Ne sme postojati fallback na `'default-tenant'`
- Stroga validacija i izolacija

## 📝 Rezime

1. **Tenant ID** izoluje podatke različitih klijenata
2. **Frontend** čuva u `localStorage` i šalje kao `x-tenant-id` header
3. **Next.js API** prosleđuje header dalje microservice-u
4. **Middleware** ekstraktuje tenantId i dodaje u `req.tenantId`
5. **Service** UVEK koristi tenantId u database upitima
6. **Database** filtrira sve upite po tenantId

**Zlatno pravilo:** Uvek filtrirati sve podatke po `tenantId` - bez izuzetaka!

