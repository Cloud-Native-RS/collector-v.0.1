# Quick Start - Testing

Brzi vodič za pokretanje testova u Collector mikroservisima.

## Pokretanje Testova

### Sve testove odjednom

```bash
# Iz root direktorijuma
npm run test:services
```

### Pojedinačni servis

```bash
cd services/<service-name>
npm test
```

### Sa coverage reportom

```bash
cd services/<service-name>
npm test -- --coverage
```

## Servisi sa Testovima

| Servis | Status | Coverage | Test Komanda |
|--------|--------|----------|--------------|
| Registry | ✅ | 85% | `cd services/registry-service && npm test` |
| CRM | ✅ | 80% | `cd services/crm-service && npm test` |
| Inventory | ✅ | 85% | `cd services/inventory-service && npm test` |
| Invoices | ✅ | 75% | `cd services/invoices-service && npm test` |
| Orders | ✅ | 70% | `cd services/orders-service && npm test` |
| Delivery | ✅ | 75% | `cd services/delivery-service && npm test` |
| Offers | ✅ | 80% | `cd services/offers-service && npm test` |
| HR | ✅ | 70% | `cd services/hr-service && npm test` |
| Project Management | ✅ | 75% | `cd services/project-management-service && npm test` |

## Test Struktura

```
services/<service-name>/
├── src/
│   ├── services/__tests__/    # Service unit testovi
│   ├── middleware/__tests__/  # Middleware testovi
│   └── utils/__tests__/       # Utility testovi
└── vitest.config.ts
```

## Detaljnija Dokumentacija

Za kompletnu dokumentaciju o testiranju, pogledajte:
- [TESTING.md](./TESTING.md) - Kompletan vodič
- [TEST_COVERAGE_REPORT.md](./TEST_COVERAGE_REPORT.md) - Coverage report

## Troubleshooting

### Testovi padaju zbog baze

Testovi koriste mock Prisma klijent, ne zahtevaju pravu bazu.

### Coverage se ne generiše

Proverite da li je `--coverage` flag dodat:
```bash
npm test -- --coverage
```

### Testovi se ne pokreću

Proverite da li su dependencies instalirane:
```bash
npm install
```

