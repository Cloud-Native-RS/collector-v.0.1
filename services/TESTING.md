# Testing Documentation - Collector Microservices

Kompletan vodič za testiranje svih mikroservisa u Collector platformi.

## 📋 Sadržaj

1. [Pregled test strategije](#pregled-test-strategije)
2. [Struktura testova](#struktura-testova)
3. [Pokretanje testova](#pokretanje-testova)
4. [Test pokrivenost](#test-pokrivenost)
5. [Testovi po servisima](#testovi-po-servisima)
6. [Najbolje prakse](#najbolje-prakse)
7. [CI/CD integracija](#cicd-integracija)

## Pregled Test Strategije

Collector platforma koristi **Vitest** kao test framework. Test strategija se sastoji od:

- **Unit Testovi** - Testiranje pojedinačnih servisa i funkcija
- **Integration Testovi** - Testiranje API ruta i middleware-a
- **E2E Testovi** - Testiranje kompletnih flow-ova između mikroservisa

### Test Piramida

```
        /\
       /E2E\          (10%)
      /------\
     /Integr.\        (30%)
    /----------\
   /   Unit     \     (60%)
  /--------------\
```

## Struktura Testova

Svaki mikroservis ima sledeću strukturu:

```
services/<service-name>/
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   └── *.service.test.ts    # Unit testovi za servise
│   │   └── *.service.ts
│   ├── routes/
│   │   ├── __tests__/
│   │   │   └── *.routes.test.ts     # Integration testovi za rute
│   │   └── *.routes.ts
│   ├── middleware/
│   │   ├── __tests__/
│   │   │   └── *.middleware.test.ts # Middleware testovi
│   │   └── *.middleware.ts
│   └── utils/
│       ├── __tests__/
│       │   └── *.test.ts            # Utility testovi
│       └── *.ts
├── vitest.config.ts                 # Konfiguracija testova
└── package.json
```

## Pokretanje Testova

### Sve testove u workspace-u

```bash
# Root direktorijum
npm run test:services
```

### Testovi za specifičan servis

```bash
# Inventory Service
cd services/inventory-service
npm test

# CRM Service
cd services/crm-service
npm test

# Registry Service
cd services/registry-service
npm test
```

### Testovi sa coverage reportom

```bash
cd services/<service-name>
npm test -- --coverage
```

### Watch mode (razvoj)

```bash
cd services/<service-name>
npm test -- --watch
```

### UI mode (interaktivno)

```bash
cd services/<service-name>
npm test -- --ui
```

## Test Pokrivenost

Cilj je postići **minimum 80% pokrivenost koda** za:

- ✅ Servise (business logic)
- ✅ Middleware (autentifikacija, tenant isolation)
- ✅ Utilities (validacija, number generators)

Preporučeno pokrivenje:

- **Kritični servisi** (payment, invoicing): 90%+
- **Standardni servisi**: 80%+
- **Utility funkcije**: 85%+

### Generisanje coverage reporta

```bash
# Za sve servise
npm run test:services-coverage

# Za jedan servis
cd services/<service-name>
npm test -- --coverage
```

Coverage report se generiše u `coverage/` direktorijumu.

## Testovi po Servisima

### 1. Registry Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Customer Service (`customer.service.test.ts`)
- ✅ Company Service (`company.service.test.ts`)
- ✅ Validation Utils (`validation.test.ts`)

**Pokretanje**:
```bash
cd services/registry-service
npm test
```

### 2. CRM Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Lead Service (`lead.service.test.ts`)
- ✅ Deal Service (`deal.service.test.ts`)
- ✅ Task Service (`task.service.test.ts`)
- ✅ Activity Service (`activity.service.test.ts`)
- ✅ Number Generator (`number-generator.test.ts`)

**Pokretanje**:
```bash
cd services/crm-service
npm test
```

### 3. Inventory Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Product Service (`product.service.test.ts`)
- ✅ Warehouse Service (`warehouse.service.test.ts`)
- ✅ Stock Service (`stock.service.test.ts`)
- ✅ Supplier Service (`supplier.service.test.ts`)
- ✅ Purchase Order Service (`purchase-order.service.test.ts`)
- ✅ Delivery Sync Service (`delivery-sync.service.test.ts`)
- ✅ Auth Middleware (`auth.middleware.test.ts`)
- ✅ Tenant Middleware (`tenant.middleware.test.ts`)
- ✅ Error Handler (`error-handler.test.ts`)

**Pokretanje**:
```bash
cd services/inventory-service
npm test
```

### 4. Invoices Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Invoice Service (`invoice.service.test.ts`)
- ✅ Calculations Utils (`calculations.test.ts`)
- ✅ Number Generator (`number-generator.test.ts`)

**Pokretanje**:
```bash
cd services/invoices-service
npm test
```

### 5. Orders Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Order Service (`order.service.test.ts`)

**Pokretanje**:
```bash
cd services/orders-service
npm test
```

### 6. Delivery Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Delivery Service (`delivery.service.test.ts`)
- ✅ Carrier Service (`carrier.service.test.ts`)

**Pokretanje**:
```bash
cd services/delivery-service
npm test
```

### 7. Offers Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Offer Service (`offer.service.test.ts`)
- ✅ Calculation Service (`calculation.service.test.ts`)

**Pokretanje**:
```bash
cd services/offers-service
npm test
```

### 8. HR Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Employee Service (`employee.service.test.ts`)

**Pokretanje**:
```bash
cd services/hr-service
npm test
```

### 9. Project Management Service ✅

**Status**: Kompletan test coverage

**Testovi**:
- ✅ Project Service (`project.service.test.ts`)

**Pokretanje**:
```bash
cd services/project-management-service
npm test
```

## Najbolje Prakse

### 1. Test Imeovanje

Koristiti deskriptivne nazive:

```typescript
// ✅ Dobro
describe('LeadService', () => {
  describe('create', () => {
    it('should create a lead with valid data', () => {});
    it('should reject duplicate email', () => {});
  });
});

// ❌ Loše
describe('test', () => {
  it('works', () => {});
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 },
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(35);
});
```

### 3. Mocking External Dependencies

```typescript
const mockPrisma = {
  lead: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
} as unknown as PrismaClient;
```

### 4. Test Isolation

Svaki test mora biti nezavisan:

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Očisti mock-ove između testova
});
```

### 5. Testing Error Cases

Uvek testirati error scenarije:

```typescript
it('should throw error if lead not found', async () => {
  (mockPrisma.lead.findFirst as any).mockResolvedValue(null);

  await expect(service.getById('non-existent', 'tenant'))
    .rejects.toThrow(AppError);
});
```

### 6. Multi-tenant Testing

Uvek uključiti tenant ID u testove:

```typescript
it('should only return leads for specific tenant', async () => {
  await service.getAll('tenant-1');
  
  expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        tenantId: 'tenant-1',
      }),
    })
  );
});
```

## CI/CD Integracija

### GitHub Actions Primer

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        service:
          - registry-service
          - crm-service
          - inventory-service
          # ... ostali servisi
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: services/${{ matrix.service }}
        run: npm ci
      
      - name: Run tests
        working-directory: services/${{ matrix.service }}
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./services/${{ matrix.service }}/coverage/coverage-final.json
```

## Test Utilities

### Test Helper Funkcije

Možete kreirati zajedničke helper funkcije u `services/shared/test-utils/`:

```typescript
// services/shared/test-utils/mock-prisma.ts
import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

export function createMockPrisma(): Partial<PrismaClient> {
  return {
    lead: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient;
}
```

## Troubleshooting

### Problem: Testovi padaju zbog timezone-a

**Rešenje**: Koristiti UTC za sve datume u testovima:

```typescript
const date = new Date('2024-01-01T00:00:00Z');
```

### Problem: Mock funkcije se ne resetuju

**Rešenje**: Koristiti `beforeEach` sa `vi.clearAllMocks()`:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Problem: Async testovi ne čekaju završetak

**Rešenje**: Uvek koristiti `await` za async operacije:

```typescript
it('should fetch data', async () => {
  await service.fetchData();
  expect(mockFunction).toHaveBeenCalled();
});
```

## Dodatni Resursi

- [Vitest Dokumentacija](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mock Functions Guide](https://vitest.dev/api/vi.html#vi-fn)

## Kontakt

Za pitanja ili probleme sa testovima, kontaktirajte tim ili otvorite issue na GitHub-u.

