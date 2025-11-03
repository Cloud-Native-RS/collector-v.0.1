# Seed Skripte - Detaljan Pregled

## 📋 Pregled svih seed skripti

### ✅ **1. Offers Service** (`services/offers-service/src/prisma/seed.ts`)

**Šta generiše:**
- ✅ **25 offers** (1 initial + 24 additional)
- **Offer struktura:**
  - `offerNumber` (OFF-00001, OFF-00002, ...)
  - `customerId` (povezano sa registry service)
  - `status` (DRAFT, SENT, APPROVED, REJECTED, EXPIRED)
  - `lineItems` (1 line item po offer-u)
  - `subtotal`, `discountTotal`, `taxTotal`, `grandTotal`
  - `currency` (USD)
  - `issueDate`, `validUntil`
  - `tenantId` = 'default-tenant'

**Pokretanje:**
```bash
cd services/offers-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_offers_db?schema=public' npm run db:seed
```

---

### ✅ **2. Orders Service** (`services/orders-service/src/prisma/seed.ts`)

**Šta generiše:**
- ✅ **25 orders** (5 initial + 20 additional)
- **Order struktura:**
  - `orderNumber` (ORD-001, ORD-002, ...)
  - `customerId` (povezano sa registry service)
  - `status` (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  - `lineItems` (1-2 line items po order-u)
  - `subtotal`, `taxTotal`, `discountTotal`, `grandTotal`
  - `currency` (USD)
  - `orderDate`, `expectedDeliveryDate`
  - `paymentStatus` (PENDING, PARTIAL, PAID)
  - `paymentMethod` (CREDIT_CARD, BANK_TRANSFER, PAYPAL)
  - `tenantId` = 'default-tenant'

**Pokretanje:**
```bash
cd services/orders-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_orders_db?schema=public' npm run db:seed
```

---

### ✅ **3. Invoices Service** (`services/invoices-service/src/prisma/seed.ts`)

**Šta generiše:**
- ✅ **25 invoices** (5 initial + 20 additional)
- **Tax Configuration** (1 record)
- **Invoice struktura:**
  - `invoiceNumber` (INV-001, INV-002, ...)
  - `customerId` (povezano sa registry service)
  - `orderId` (opciono, povezano sa orders)
  - `status` (DRAFT, SENT, PAID, OVERDUE, CANCELLED)
  - `lineItems` (1-2 line items po invoice-u)
  - `subtotal`, `taxTotal`, `discountTotal`, `grandTotal`
  - `paidAmount`, `outstandingAmount`
  - `currency` (USD)
  - `issueDate`, `dueDate`
  - `tenantId` = 'default-tenant'

**Pokretanje:**
```bash
cd services/invoices-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_invoices_db?schema=public' npm run db:seed
```

---

### ✅ **4. Delivery Service** (`services/delivery-service/src/prisma/seed.ts`)

**Šta generiše:**
- ✅ **25 delivery notes**
- **3 Carriers** (FedEx, UPS, DHL)
- **Delivery Note struktura:**
  - `deliveryNumber` (DEL-001, DEL-002, ...)
  - `orderId` (povezano sa orders)
  - `carrierId` (povezano sa carriers)
  - `status` (PENDING, DISPATCHED, IN_TRANSIT, DELIVERED, FAILED)
  - `items` (1 item po delivery note-u)
  - `events` (tracking events)
  - `trackingNumber`
  - `shippedAt`, `deliveredAt`
  - `deliveryAddressId`
  - `tenantId` = 'default-tenant'

**Pokretanje:**
```bash
cd services/delivery-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_delivery_db?schema=public' npm run db:seed
```

---

### ✅ **5. Registry Service** (`services/registry-service/src/prisma/seed.ts`)

**Šta generiše:**
- ✅ **3 Tenants** (acme-corp, tech-solutions, default-tenant)
- ✅ **3 Users** (admin@example.com, user@example.com, test@example.com)
- ✅ **25 Companies** (companies)
- ✅ **25 Contacts** (contacts)
- **Addresses** (10 addresses)
- **Bank Accounts** (bank accounts povezani sa companies)
- **Individual Customers** (individual customers)
- **Company Customers** (company customers)

**Customer/Company struktura:**
- `name`, `email`, `phone`
- `taxId`, `registrationNumber`
- `addresses`, `contacts`, `bankAccounts`
- `tenantId` = 'default-tenant' (ili drugi tenant)

**Pokretanje:**
```bash
cd services/registry-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_account_registry_db?schema=public' npm run db:seed
```

---

### ✅ **6. HR Service** (`services/hr-service/src/prisma/seed.ts`)

**Šta generiše:**
- ✅ **25 Employees** (2 initial + 23 additional)
- **Employee struktura:**
  - `employeeId` (EMP001, EMP002, ...)
  - `firstName`, `lastName`, `email`, `phone`
  - `position`, `department`
  - `hireDate`, `salary`
  - `status` (ACTIVE, ON_LEAVE, TERMINATED)
  - `tenantId` = 'default-tenant'
- **Attendance records** (check-in/check-out)
- **Payroll records** (salary, bonuses, deductions)
- **Job Postings** (job postings za recruiting)

**Pokretanje:**
```bash
cd services/hr-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_hr_db?schema=public' npm run db:seed
```

---

### ✅ **7. Project Management Service** (`services/project-management-service/src/prisma/seed.ts`)

**Šta generiše:**
- ✅ **25 Projects** (1 initial + 24 additional)
- **Milestones** (za projekte)
- **Tasks** (za projekte i milestones)
- **Resources** (EMPLOYEE, EQUIPMENT)
- **Task Resources** (resource allocation)
- **Project Progress** (progress tracking)

**Project struktura:**
- `name`, `description`
- `clientId` (opciono, povezano sa registry)
- `status` (PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED)
- `startDate`, `endDate`
- `milestones[]`, `tasks[]`
- `tenantId` = 'default-tenant'

**Pokretanje:**
```bash
cd services/project-management-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_projects_db?schema=public' npm run db:seed
```

---

### ⚠️ **8. Inventory Service** (`services/inventory-service/src/prisma/seed.ts`)

**Šta generiše:**
- ⚠️ **~10-12 Products** (ne tačno 25, fokus na raznovrsnost)
- **Warehouses** (2-3 warehouses)
- **Stock Records** (stock levels za products u warehouses)
- **Suppliers** (suppliers/vendors)
- **Purchase Orders** (purchase orders sa line items)

**Product kategorije:**
- ELECTRONICS (Laptops, Mice, Monitors)
- CLOTHING (T-Shirts, Jeans)
- FOOD (Coffee, Tea, Snacks)
- OFFICE_SUPPLIES (Notebooks, Pens)

**Pokretanje:**
```bash
cd services/inventory-service
DATABASE_URL='postgresql://collector:collector_dev_pass@localhost:5432/collector_inventory_db?schema=public' npm run db:seed
```

---

## 🎯 Ukupan pregled

| Servis | Objekti | Broj | Status |
|--------|---------|------|--------|
| **Offers Service** | Offers | 25 | ✅ |
| **Orders Service** | Orders | 25 | ✅ |
| **Invoices Service** | Invoices | 25 | ✅ |
| **Delivery Service** | Delivery Notes | 25 | ✅ |
| **HR Service** | Employees | 25 | ✅ |
| **Project Management** | Projects | 25 | ✅ |
| **Registry Service** | Companies | 25 | ✅ |
| **Registry Service** | Contacts | 25 | ✅ |
| **Inventory Service** | Products | ~10-12 | ⚠️ |

---

## 🚀 Master Script

Sve seed skripte mogu se pokrenuti odjednom:

```bash
npm run seed:all
# ili
./scripts/seed-all.sh
```

**Napomena:** Master script pokreće seed skripte lokalno (ne kroz Docker) sa pravilnim DATABASE_URL jer `tsx` nije dostupan u production Docker image-u.

---

## 📊 Provera rezultata

```bash
# Offers
docker exec collector-postgres psql -U collector -d collector_offers_db -c "SELECT COUNT(*) FROM offers WHERE \"tenantId\" = 'default-tenant';"

# Orders
docker exec collector-postgres psql -U collector -d collector_orders_db -c "SELECT COUNT(*) FROM orders WHERE \"tenantId\" = 'default-tenant';"

# Invoices
docker exec collector-postgres psql -U collector -d collector_invoices_db -c "SELECT COUNT(*) FROM invoices WHERE \"tenantId\" = 'default-tenant';"

# Delivery Notes
docker exec collector-postgres psql -U collector -d collector_delivery_db -c "SELECT COUNT(*) FROM delivery_notes WHERE \"tenantId\" = 'default-tenant';"

# Employees
docker exec collector-postgres psql -U collector -d collector_hr_db -c "SELECT COUNT(*) FROM employees WHERE \"tenantId\" = 'default-tenant';"

# Projects
docker exec collector-postgres psql -U collector -d collector_projects_db -c "SELECT COUNT(*) FROM projects WHERE \"tenantId\" = 'default-tenant';"

# Companies
docker exec collector-postgres psql -U collector -d collector_account_registry_db -c "SELECT COUNT(*) FROM companies WHERE \"tenantId\" = 'default-tenant';"

# Contacts
docker exec collector-postgres psql -U collector -d collector_account_registry_db -c "SELECT COUNT(*) FROM contacts WHERE \"tenantId\" = 'default-tenant';"
```

