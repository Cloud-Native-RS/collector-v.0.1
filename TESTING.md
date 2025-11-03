# Testing Guide

Ovaj dokument opisuje test strategiju i kako pokretati testove za Collector aplikaciju.

## Pregled

Aplikacija koristi [Vitest](https://vitest.dev/) kao test framework. Testovi su organizovani po mikroservisima sa fokusom na unit testove servisa i utilities.

## Struktura Testova

```
services/
  ├── registry-service/
  │   ├── src/
  │   │   ├── services/
  │   │   │   └── __tests__/
  │   │   │       ├── customer.service.test.ts
  │   │   │       └── company.service.test.ts
  │   │   └── utils/
  │   │       └── __tests__/
  │   │           └── validation.test.ts
  │   └── vitest.config.ts
  ├── invoices-service/
  │   ├── src/
  │   │   ├── services/
  │   │   │   └── __tests__/
  │   │   │       └── invoice.service.test.ts
  │   │   └── utils/
  │   │       └── __tests__/
  │   │           ├── calculations.test.ts
  │   │           └── number-generator.test.ts
  │   └── vitest.config.ts
  └── delivery-service/
      └── src/
          └── services/
              └── __tests__/
                  └── delivery.service.test.ts
```

## Pokretanje Testova

### Pojedinačni Servis

```bash
# Registry Service
cd services/registry-service
npm test

# Invoices Service
cd services/invoices-service
npm test

# Delivery Service
cd services/delivery-service
npm test
```

### Svi Testovi

```bash
# Iz root direktorijuma
npm test
```

### Watch Mode

```bash
# Automatski re-run testova na promene koda
npm test -- --watch
```

### Coverage Report

```bash
# Generiši coverage report
npm test -- --coverage
```

### Verbose Output

```bash
# Detaljniji output
npm test -- --reporter=verbose
```

## Test Strategija

### Unit Testovi

**Coverage**: Biznis logika u servisima i utility funkcije

**Fokus**:
- Validacije inputa
- Biznis pravila
- Transformacije podataka
- Izračunavanja

**Primer**: `CustomerService`, `InvoiceService`, `calculateLineItemTotal`, `validateTaxId`

### Integration Testovi

**Coverage**: API endpoints, baza podataka, external servisi

**Status**: Planirani za budućnost

### Mocking

Testovi koriste Vitest mocking za:
- Prisma Client
- External API pozive (Axios)
- Event Publisher
- Database operacije

**Primer**:
```typescript
const mockPrisma = {
  customer: {
    create: vi.fn(),
    findFirst: vi.fn(),
    // ...
  },
} as unknown as PrismaClient;
```

## Test Coverage Goals

| Servis | Target Coverage | Current |
|--------|----------------|---------|
| Registry Service | 80%+ | In Progress |
| Invoices Service | 80%+ | In Progress |
| Delivery Service | 80%+ | Partial |
| Orders Service | 80%+ | Planned |
| Offers Service | 80%+ | Planned |
| Inventory Service | 80%+ | Planned |
| HR Service | 80%+ | Planned |
| Project Management | 80%+ | Planned |

## Test Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('should create customer with valid data', async () => {
  // Arrange
  const mockCustomer = { id: 'cust-1', ... };
  (mockPrisma.customer.create as any).mockResolvedValue(mockCustomer);

  // Act
  const result = await service.create(validData);

  // Assert
  expect(result).toBeDefined();
  expect(result.id).toBe('cust-1');
});
```

### 2. Test Organization

```typescript
describe('CustomerService', () => {
  describe('create', () => {
    it('should create customer with valid data', () => {});
    it('should reject duplicate email', () => {});
    it('should reject invalid tax ID', () => {});
  });

  describe('update', () => {
    it('should update customer successfully', () => {});
    it('should throw error if not found', () => {});
  });
});
```

### 3. Edge Cases

Uvek testirati:
- Empty arrays
- Null/undefined values
- Boundary values
- Invalid input formats
- Error conditions

### 4. Mocking Guidelines

- Mockuj sve external dependencies
- Koristi real data structure u mock-ovima
- Clear mocks između testova
- Specific mocks za specific test scenarios

### 5. Assertions

```typescript
// Specific assertions
expect(result.status).toBe('ACTIVE');
expect(result.email).toBe('test@example.com');

// Error messages
await expect(service.create(invalidData))
  .rejects.toThrow('Invalid Tax ID');

// Called with correct params
expect(mockPrisma.customer.create)
  .toHaveBeenCalledWith({ data: expectedData });
```

## Implemented Tests

### Registry Service ✅

- **Customer Service**: Create, Read, Update, Delete, Lookup
- **Company Service**: Create, Read, Update, Delete, Lookup
- **Validation Utils**: Tax ID, IBAN, SWIFT validation

### Invoices Service ✅

- **Invoice Service**: Create, Issue, Cancel, Record Payment, Overdue Check
- **Calculation Utils**: Line items, Tax, Discounts
- **Number Generator**: Invoice numbering

### Delivery Service ✅

- **Delivery Service**: Create, Read, Update
- **Event Publishing**: Event emission

## Running Tests in CI/CD

```yaml
# .github/workflows/test.yml example
- name: Run Tests
  run: |
    for service in services/*; do
      if [ -f "$service/package.json" ]; then
        cd "$service"
        npm test
        cd ../..
      fi
    done
```

## Troubleshooting

### Testovi padaju zbog module resolution

```bash
# Rebuild TypeScript
npm run build
```

### Mock-ovi ne rade

```typescript
// Proveri da li si ispravno importovao vi
import { vi } from 'vitest';

// Proveri da li si postavio globals: true u vitest.config.ts
```

### Coverage prikazuje 0%

```bash
# Proveri exclude patterns u vitest.config.ts
# Ukloni fajlove iz exclude koji bi trebali biti testirani
```

## Budući Koraci

- [ ] Dodati testove za sve preostale servise
- [ ] Implementirati integration testove
- [ ] Dodati E2E testove za kritične flow-ove
- [ ] Postaviti CI/CD test pipeline
- [ ] Dodati performance testove
- [ ] Implementirati snapshot testing za API response-e

## Reference

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Jest Migration Guide](https://vitest.dev/guide/migration.html)

