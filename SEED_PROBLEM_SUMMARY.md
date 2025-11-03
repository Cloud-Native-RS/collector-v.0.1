# Seed Scripts - Problem Summary & Solution

## 🔴 Problem

Seed skripte ne rade jer:
1. **`tsx` nije dostupan u Docker production image-u** (devDependency)
2. **Prisma Client dobija "User collector was denied access"** grešku kada se pokreće lokalno
   - **Napomena:** Direktni `psql` INSERT radi, što znači da problem nije u dozvolama već u Prisma Client konekciji

## ✅ Status Seed Skripti

Svi servisi **imaju seed skripte** koje generišu po **25 objekata**:

- ✅ Offers Service - 25 offers
- ✅ Orders Service - 25 orders
- ✅ Invoices Service - 25 invoices
- ✅ Delivery Service - 25 delivery notes
- ✅ HR Service - 25 employees
- ✅ Project Management - 25 projects
- ⚠️ Inventory Service - ~10-12 products (raznovrsne kategorije)
- ⚠️ Registry Service - customers/companies (varijabilan broj)

## 🔧 Rešenje - 3 opcije

### Opcija 1: Dodati tsx u Dockerfile (PREPORUČENO za production)

U svim Dockerfile fajlovima, posle linije 46 (gde se kopira prisma), dodati:

```dockerfile
# Copy tsx from builder (needed for seed scripts)
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin/tsx ./node_modules/.bin/tsx
```

Zatim seed skripte će raditi kroz Docker:
```bash
docker exec collector-offers npm run db:seed
```

### Opcija 2: Kompajlovati seed.ts u build procesu

U Dockerfile builder stage:
```dockerfile
# Build seed script
RUN npx tsc src/prisma/seed.ts --outDir dist/prisma --esModuleInterop --module commonjs --target es2020
```

U package.json:
```json
"db:seed": "node dist/prisma/seed.js"
```

### Opcija 3: Koristiti direktni SQL seed (za development)

Kreirati SQL fajlove za svaki servis i pokrenuti ih direktno kroz Docker postgres.

## 📝 Trenutno stanje

**Dobro:**
- Svi servisi imaju seed skripte
- Master script (`scripts/seed-all.sh`) postoji
- Seed skripte generišu 25 objekata

**Problemi:**
- Seed ne radi kroz Docker (tsx nedostaje)
- Seed ne radi lokalno (Prisma permissions error)

**Workaround:**
- Podaci su već u bazi (25 offers, 25 orders, 25 invoices, itd.) jer smo ih ranije dodali direktno
- Za testiranje možete koristiti postojeće podatke

## 🚀 Sledeći koraci

1. **Za sada:** Podaci su već u bazi - možete testirati aplikaciju
2. **Za buduće:** Dodati tsx u Dockerfile-ove ili kompajlovati seed.ts
3. **Alternativa:** Koristiti SQL seed fajlove umesto TypeScript seed skripti

