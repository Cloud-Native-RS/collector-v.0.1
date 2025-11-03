# Seed Scripts - Quick Fix Guide

## 🔴 Problem

Seed skripte ne rade jer:
1. `tsx` nije dostupan u production Docker image-u (devDependency)
2. Database permissions problem sa user `collector`

## ✅ Rešenje - Pokretanje lokalno

Seed skripte treba da se pokrenu **lokalno** (ne kroz Docker) jer:
- `tsx` je dostupan lokalno (devDependency)
- Baza je dostupna na `localhost:5432` iz Docker kontejnera

### Kako pokrenuti:

```bash
# Offers (25 offers)
cd services/offers-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_offers_db?schema=public' npm run db:seed

# Orders (25 orders)
cd services/orders-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_orders_db?schema=public' npm run db:seed

# Invoices (25 invoices)
cd services/invoices-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_invoices_db?schema=public' npm run db:seed

# Delivery (25 delivery notes)
cd services/delivery-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_delivery_db?schema=public' npm run db:seed

# Registry (customers/companies)
cd services/registry-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_account_registry_db?schema=public' npm run db:seed

# Inventory (products)
cd services/inventory-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_inventory_db?schema=public' npm run db:seed

# HR (25 employees)
cd services/hr-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_hr_db?schema=public' npm run db:seed

# Projects (25 projects)
cd services/project-management-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_projects_db?schema=public' npm run db:seed
```

### Master script:

```bash
npm run seed:all
# ili
./scripts/seed-all.sh
```

**Napomena:** Master script pokušava da pokrene seed lokalno sa pravilnim DATABASE_URL.

## 📊 Provera rezultata

```bash
# Provera broja offers
docker exec collector-postgres psql -U collector -d collector_offers_db -c "SELECT COUNT(*) FROM offers WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25

# Provera broja orders  
docker exec collector-postgres psql -U collector -d collector_orders_db -c "SELECT COUNT(*) FROM orders WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25
```

## 🔧 Trajno rešenje

Dodati `tsx` u Dockerfile production stage:

```dockerfile
# Copy tsx from builder (needed for seed scripts)
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/.bin/tsx ./node_modules/.bin/tsx
```

ILI koristiti kompajlovanu verziju seed.ts.

