# Seed Scripts - Docker Problem & Solution

## 🔴 Problem

Seed skripte ne rade u Docker kontejnerima jer:
- Docker image koristi `npm ci --only=production` (linija 39 u Dockerfile)
- `tsx` je u `devDependencies`, pa se ne instalira u production image
- Kontejner koristi non-root user (`nodejs`) bez dozvola za `npm install`

Greška:
```
sh: 1: tsx: not found
```

## ✅ Rešenja

### Rešenje 1: Dodati tsx u production Dockerfile (PREPORUČENO)

Dodajte u Dockerfile **posle linije 46** (gde se kopira prisma):

```dockerfile
# Copy tsx from builder (needed for seed scripts)
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin/tsx ./node_modules/.bin/tsx
```

**Ili** dodati posle linije 49:
```dockerfile
# Copy dev dependencies needed for seeding
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
```

### Rešenje 2: Pokrenuti seed lokalno (za development)

Umesto kroz Docker, pokrenite seed skripte lokalno sa pravilnim DATABASE_URL:

```bash
# U services/offers-service/
DATABASE_URL="postgresql://collector:collector_dev_pass@localhost:5432/collector_offers_db?schema=public" npm run db:seed
```

### Rešenje 3: Kompajlovati seed.ts u build procesu

U Dockerfile builder stage, kompajlujte seed.ts:

```dockerfile
# Build TypeScript (uključujući seed)
RUN npm run build
RUN npx tsc src/prisma/seed.ts --outDir dist/prisma
```

Zatim u production stage pokrenite:
```bash
node dist/prisma/seed.js
```

### Rešenje 4: Dodati seed script u package.json koji koristi node

Promeniti `db:seed` script da koristi kompajlovanu verziju:

```json
{
  "scripts": {
    "db:seed": "node dist/prisma/seed.js"
  }
}
```

---

## 🚀 Brzo rešenje za sada

Za sada, pokrenite seed skripte **lokalno** sa pravilnim environment variables:

```bash
# Offers
cd services/offers-service
DATABASE_URL="postgresql://collector:collector_dev_pass@localhost:5432/collector_offers_db?schema=public" npm run db:seed

# Orders
cd services/orders-service  
DATABASE_URL="postgresql://collector:collector_dev_pass@localhost:5432/collector_orders_db?schema=public" npm run db:seed

# itd...
```

**ILI** pokrenite direktno kroz Docker postgres kontejner (ako ima psql):

```bash
# Seed direktno u bazi kroz SQL
docker exec -i collector-postgres psql -U collector -d collector_offers_db < seed.sql
```

---

## 🔧 Trajno rešenje

Dodajte `tsx` u sve Dockerfile fajlove (u production stage):

```dockerfile
# Copy tsx and other tools needed for seeding from builder
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin/tsx ./node_modules/.bin/tsx
```

ili dodati posle `npm ci --only=production`:

```dockerfile
# Install tsx for seed scripts (needed in development)
RUN npm install tsx --save-dev || true
```

**Napomena:** Drugo rešenje nije idealno jer dodaje pakete u runtime image, ali radi brzo.

