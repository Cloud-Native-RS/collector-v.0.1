# Seed Skripte - Pregled

## 📊 Status seed skripti po servisu

### ✅ **1. Offers Service** (`services/offers-service/src/prisma/seed.ts`)
- **Status:** ✅ Generiše **25 offers**
- **Opis:** Kreira 1 offer + 24 dodatnih = 25 ukupno
- **Pokretanje:**
  ```bash
  cd services/offers-service
  npm run db:seed
  # ili
  docker-compose exec offers-service npm run db:seed
  ```

### ✅ **2. Orders Service** (`services/orders-service/src/prisma/seed.ts`)
- **Status:** ✅ Generiše **25 orders**
- **Opis:** Kreira 5 orders + 20 dodatnih = 25 ukupno
- **Pokretanje:**
  ```bash
  cd services/orders-service
  npm run db:seed
  # ili
  docker-compose exec orders-service npm run db:seed
  ```

### ✅ **3. Invoices Service** (`services/invoices-service/src/prisma/seed.ts`)
- **Status:** ✅ Generiše **25 invoices**
- **Opis:** Kreira 5 invoices + 20 dodatnih = 25 ukupno
- **Pokretanje:**
  ```bash
  cd services/invoices-service
  npm run db:seed
  # ili
  docker-compose exec invoices-service npm run db:seed
  ```

### ✅ **4. Delivery Service** (`services/delivery-service/src/prisma/seed.ts`)
- **Status:** ✅ Generiše **25 delivery notes**
- **Opis:** Kreira tačno 25 delivery notes
- **Pokretanje:**
  ```bash
  cd services/delivery-service
  npm run db:seed
  # ili
  docker-compose exec delivery-service npm run db:seed
  ```

### ✅ **5. Registry Service** (`services/registry-service/src/prisma/seed.ts`)
- **Status:** ✅ Generiše **25 companies + 25 contacts**
- **Opis:** Kreira customers, companies, addresses, contacts, bank accounts
- **Napomena:** Ne generiše tačno 25 customers, ali generiše sve potrebne reference
- **Pokretanje:**
  ```bash
  cd services/registry-service
  npm run db:seed
  # ili
  docker-compose exec registry-service npm run db:seed
  ```

### ✅ **6. HR Service** (`services/hr-service/src/prisma/seed.ts`)
- **Status:** ✅ Generiše **25 employees**
- **Opis:** Kreira 2 employees + 23 dodatnih = 25 ukupno
- **Pokretanje:**
  ```bash
  cd services/hr-service
  npm run db:seed
  # ili
  docker-compose exec hr-service npm run db:seed
  ```

### ✅ **7. Project Management Service** (`services/project-management-service/src/prisma/seed.ts`)
- **Status:** ✅ Generiše **25 projects**
- **Opis:** Kreira 1 project + 24 dodatnih = 25 ukupno
- **Pokretanje:**
  ```bash
  cd services/project-management-service
  npm run db:seed
  # ili
  docker-compose exec project-management-service npm run db:seed
  ```

### ⚠️ **8. Inventory Service** (`services/inventory-service/src/prisma/seed.ts`)
- **Status:** ⚠️ Ne generiše tačno 25 products
- **Opis:** Generiše oko 10-12 products (ne fokusira se na broj, već na raznovrsnost kategorija)
- **Napomena:** Inventory service ima warehouses, suppliers, purchase orders, ali ne generiše 25 products
- **Pokretanje:**
  ```bash
  cd services/inventory-service
  npm run db:seed
  # ili
  docker-compose exec inventory-service npm run db:seed
  ```

---

## 🚀 Master Script za pokretanje svih seed skripti

Kreirajte skriptu za pokretanje svih seed skripti odjednom:

```bash
#!/bin/bash
# scripts/seed-all.sh

echo "🌱 Seeding all microservices databases..."

services=(
  "registry-service"
  "offers-service"
  "orders-service"
  "invoices-service"
  "delivery-service"
  "inventory-service"
  "hr-service"
  "project-management-service"
)

for service in "${services[@]}"; do
  echo ""
  echo "📦 Seeding $service..."
  cd "services/$service" || exit 1
  npm run db:seed || echo "❌ Failed to seed $service"
  cd ../..
done

echo ""
echo "✅ All seed scripts completed!"
```

---

## 📋 Docker Compose Seed Komande

Ako koristite Docker Compose, možete pokrenuti seed skripte preko kontejnera:

```bash
# Offers
docker-compose exec collector-offers npm run db:seed

# Orders
docker-compose exec collector-orders npm run db:seed

# Invoices
docker-compose exec collector-invoices npm run db:seed

# Registry
docker-compose exec collector-registry npm run db:seed

# Delivery
docker-compose exec collector-delivery npm run db:seed

# Inventory
docker-compose exec collector-inventory npm run db:seed

# HR
docker-compose exec collector-hr npm run db:seed

# Project Management
docker-compose exec collector-pm npm run db:seed
```

---

## 🔍 Provera da li seed skripte rade

```bash
# Provera broja offers
docker exec collector-postgres psql -U collector -d collector_offers_db -c "SELECT COUNT(*) FROM offers WHERE \"tenantId\" = 'default-tenant';"

# Provera broja orders
docker exec collector-postgres psql -U collector -d collector_orders_db -c "SELECT COUNT(*) FROM orders WHERE \"tenantId\" = 'default-tenant';"

# Provera broja invoices
docker exec collector-postgres psql -U collector -d collector_invoices_db -c "SELECT COUNT(*) FROM invoices WHERE \"tenantId\" = 'default-tenant';"
```

---

## ✅ Zaključak

**Servisi koji definitivno generišu 25 objekata:**
- ✅ Offers Service - **25 offers**
- ✅ Orders Service - **25 orders**
- ✅ Invoices Service - **25 invoices**
- ✅ Delivery Service - **25 delivery notes**
- ✅ HR Service - **25 employees** (2 + 23)
- ✅ Project Management - **25 projects** (1 + 24)

**Servisi koji ne generišu 25 objekata (ali imaju seed skripte):**
- ⚠️ Inventory Service - generiše ~10-12 products (raznovrsne kategorije)
- ⚠️ Registry Service - generiše customers/companies, ali ne fokusira se na broj 25

---

## 🚀 Brzo pokretanje seed skripti

**VAŽNO:** Seed skripte se pokreću kroz Docker kontejnere jer baze su u Docker kontejnerima!

### Sve odjednom:
```bash
npm run seed:all
# ili
./scripts/seed-all.sh
```

### Pojedinačno (kroz Docker):
```bash
npm run seed:offers      # Offers service (kroz Docker)
npm run seed:orders      # Orders service (kroz Docker)
npm run seed:invoices    # Invoices service (kroz Docker)
npm run seed:delivery    # Delivery service (kroz Docker)
npm run seed:registry    # Registry service (kroz Docker)
npm run seed:inventory   # Inventory service (kroz Docker)
npm run seed:hr          # HR service (kroz Docker)
npm run seed:projects    # Project Management service (kroz Docker)
```

### Direktno kroz docker-compose:
```bash
docker-compose exec collector-offers npm run db:seed
docker-compose exec collector-orders npm run db:seed
docker-compose exec collector-invoices npm run db:seed
docker-compose exec collector-delivery npm run db:seed
docker-compose exec collector-account-registry npm run db:seed
docker-compose exec collector-inventory npm run db:seed
docker-compose exec collector-hr npm run db:seed
docker-compose exec collector-projects npm run db:seed
```

---

## 📊 Provera seed rezultata

```bash
# Offers
docker exec collector-postgres psql -U collector -d collector_offers_db -c "SELECT COUNT(*) FROM offers WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25

# Orders
docker exec collector-postgres psql -U collector -d collector_orders_db -c "SELECT COUNT(*) FROM orders WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25

# Invoices
docker exec collector-postgres psql -U collector -d collector_invoices_db -c "SELECT COUNT(*) FROM invoices WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25

# Delivery Notes
docker exec collector-postgres psql -U collector -d collector_delivery_db -c "SELECT COUNT(*) FROM delivery_notes WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25

# Employees
docker exec collector-postgres psql -U collector -d collector_hr_db -c "SELECT COUNT(*) FROM employees WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25

# Projects
docker exec collector-postgres psql -U collector -d collector_pm_db -c "SELECT COUNT(*) FROM projects WHERE \"tenantId\" = 'default-tenant';"
# Očekivano: 25
```

