# User i Tenant Struktura - Dokumentacija

## 📋 Struktura korisnika

### 1. Admin korisnik 👑

**Email:** `admin@example.com`  
**Password:** `Admin123!`  
**Ime:** Admin User  
**Avatar:** `/images/avatars/01.png`

**Pristup:**
- ✅ **ACME Corporation** (acme-corp) - Role: `admin`
- ✅ **Tech Solutions Ltd** (tech-solutions) - Role: `admin`
- ✅ Može da prebacuje između obe kompanije
- ✅ **Primary Tenant:** ACME Corporation (acme-corp)

**UserTenant veze:**
- `user_tenants`: Admin User → ACME Corporation (role: admin)
- `user_tenants`: Admin User → Tech Solutions Ltd (role: admin)

---

### 2. User 1 — ACME Corporation 👤

**Email:** `user@example.com`  
**Password:** `User123!`  
**Ime:** ACME User  
**Avatar:** `/images/avatars/02.png`

**Pristup:**
- ✅ **Samo ACME Corporation** (acme-corp) - Role: `user`
- ❌ Nema pristup Tech Solutions Ltd
- ✅ **Primary Tenant:** ACME Corporation (acme-corp)

**UserTenant veze:**
- `user_tenants`: ACME User → ACME Corporation (role: user)

---

### 3. User 2 — Tech Solutions Ltd 👤

**Email:** `test@example.com`  
**Password:** `Test123!`  
**Ime:** Tech Solutions User  
**Avatar:** `/images/avatars/03.png`

**Pristup:**
- ✅ **Samo Tech Solutions Ltd** (tech-solutions) - Role: `user`
- ❌ Nema pristup ACME Corporation
- ✅ **Primary Tenant:** Tech Solutions Ltd (tech-solutions)

**UserTenant veze:**
- `user_tenants`: Tech Solutions User → Tech Solutions Ltd (role: user)

---

## 🏢 Kompanije (Tenants)

### 1. ACME Corporation
- **Name:** `acme-corp`
- **Display Name:** `ACME Corporation`
- **Status:** `ACTIVE`
- **Users:**
  - Admin User (admin@example.com) - role: admin
  - ACME User (user@example.com) - role: user

### 2. Tech Solutions Ltd
- **Name:** `tech-solutions`
- **Display Name:** `Tech Solutions Ltd`
- **Status:** `ACTIVE`
- **Users:**
  - Admin User (admin@example.com) - role: admin
  - Tech Solutions User (test@example.com) - role: user

### 3. Default Tenant
- **Name:** `default-tenant`
- **Display Name:** `Default Tenant`
- **Status:** `ACTIVE`
- **Svrha:** Backward kompatibilnost sa drugim entitetima (Customers, Companies, Orders, Invoices, itd.)
- **Napomena:** Nema direktno dodeljenih korisnika preko UserTenant, već se koristi kao `tenantId` String za druge entitete

---

## 🗄️ Baza podataka struktura

### Tabele:

1. **`users`** - Korisnici
   - `id`, `email`, `password` (hashovano), `name`, `avatar`
   - `primaryTenantId` - Glavni tenant za korisnika
   - `isActive`

2. **`tenants`** - Kompanije/Tenant-i
   - `id`, `name`, `displayName`, `isActive`

3. **`user_tenants`** - Many-to-many veza User ↔ Tenant
   - `userId`, `tenantId`, `role` (user/admin/owner), `isActive`
   - `@@unique([userId, tenantId])` - Jedan korisnik može imati jedan role po tenant-u

---

## 📊 Seed Skripta Implementacija

**Fajl:** `services/registry-service/src/prisma/seed.ts`

### Koraci:

1. **Kreiraj Tenants** (linija 20-51)
   ```typescript
   // acme-corp, tech-solutions, default-tenant
   ```

2. **Kreiraj Users** (linija 59-106)
   ```typescript
   // Hash passwords sa bcrypt
   // Kreiraj admin, regular, test users
   ```

3. **Dodeli Tenants Users** (linija 108-177)
   ```typescript
   // Admin → oba tenant-a (acme-corp, tech-solutions)
   // Regular user → samo acme-corp
   // Test user → samo tech-solutions
   ```

---

## ✅ Provera seed skripte

Seed skripta je **usklađena** i **spremna za pokretanje**. Implementacija odgovara opisu:

- ✅ Admin korisnik ima pristup obema kompanijama
- ✅ User 1 ima pristup samo ACME Corporation
- ✅ User 2 ima pristup samo Tech Solutions Ltd
- ✅ Default Tenant postoji za backward kompatibilnost
- ✅ Passwords su hashovani sa bcrypt
- ✅ UserTenant veze su pravilno kreirane

---

## 🚀 Pokretanje seed skripte

```bash
cd services/registry-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_account_registry_db?schema=public' npm run db:seed
```

Ili kroz master script:
```bash
npm run seed:registry
```

---

## 🔍 Provera rezultata u bazi

```sql
-- Provera korisnika
SELECT id, email, name, "primaryTenantId", "isActive" 
FROM users 
ORDER BY email;

-- Provera tenant-a
SELECT id, name, "displayName", "isActive" 
FROM tenants 
ORDER BY name;

-- Provera UserTenant veza
SELECT 
  u.email,
  t.name as tenant_name,
  t."displayName" as tenant_display,
  ut.role,
  ut."isActive"
FROM user_tenants ut
JOIN users u ON ut."userId" = u.id
JOIN tenants t ON ut."tenantId" = t.id
ORDER BY u.email, t.name;
```

---

## 📝 Test kredencijali (za login)

### Admin
```
Email: admin@example.com
Password: Admin123!
Pristup: ACME Corporation + Tech Solutions Ltd
```

### ACME User
```
Email: user@example.com
Password: User123!
Pristup: Samo ACME Corporation
```

### Tech Solutions User
```
Email: test@example.com
Password: Test123!
Pristup: Samo Tech Solutions Ltd
```

---

## 🔐 Security Napomene

1. **Password Hashing:** Passwords su hashovani sa `bcrypt` (10 salt rounds)
2. **Role-based Access:** Koristi se `role` field u `user_tenants` tabeli
3. **Tenant Isolation:** Svaki user vidi samo svoje tenant-e preko `UserTenant` veze
4. **Primary Tenant:** Koristi se kao default tenant kada user loguje

---

## 🎯 Funkcionalnost

### Admin korisnik:
- ✅ Vidi obe kompanije u dropdown-u za prebacivanje
- ✅ Može da prebacuje između acme-corp i tech-solutions
- ✅ Ima admin role u obema kompanijama
- ✅ Primary tenant je acme-corp

### User 1 (ACME):
- ✅ Vidi samo ACME Corporation
- ✅ Ne vidi Tech Solutions Ltd u dropdown-u
- ✅ Ima user role u acme-corp
- ✅ Primary tenant je acme-corp

### User 2 (Tech Solutions):
- ✅ Vidi samo Tech Solutions Ltd
- ✅ Ne vidi ACME Corporation u dropdown-u
- ✅ Ima user role u tech-solutions
- ✅ Primary tenant je tech-solutions

