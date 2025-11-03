# Database Seeding Guide

Ovaj dokument objašnjava kako da kreiraš marshmallow i podesiš test podatke za sve mikroservise.

## 🎯 Pregled

Ovaj projekat sadrži comprehensive seed skripte za sve mikroservise:
- **Registry Service**: Kupci, kompanije, adrese, kontakti, bankovni računi
- **Inventory Service**: Proizvodi, skladišta, zalihe, dobavljači, narudžbenice
- **Orders Service**: Narudžbe sa različitim statusima, plaćanja, status istorija
- **Offers Service**: Ponude i kvote
- **Invoices Service**: Fakture, plaćanja, opomene za naplatu
- **Delivery Service**: Kurirske službe, dostavnice
- **Project Management Service**: Projekti, zadaci, milestoni, resursi
- **HR Service**: Zaposleni, prisustvo, plate, regrutovanje
- **CRM Service**: Leads, Tasks, Deals, Activities, Sales Pipeline

## 🚀 Brzi Start

### Opcija 1: Automatsko seed-ovanje svih servisa

```bash
# 1. Setup baze (migracije)
./scripts/setup-databases.sh

# 2. Seed sve servise
./scripts/seed-all-services.sh
```

### Opcija 2: Manualno seed-ovanje pojedinačnih servisa

```bash
# Primer: Seed registry service
cd services/registry-service
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
```

## 📋 Detaljne Instrukcije

### 1. Priprema

Osiguraj da su sve zavisnosti instalirane:

```bash
# Root level dependencies
npm install

# Za svaki servis
cd services/[service-name]
npm install
```

### 2. Konfiguracija Baza

Osiguraj da su environment varijable podešene za svaki servis:

```bash
# Primer: services/registry-service/.env
DATABASE_URL="postgresql://user:password@localhost:5432/registry_db"
```

### 3. Migracije Baza

```bash
# Setup baze (automatski za sve servise)
./scripts/setup-databases.sh

# Ili manualno za svaki servis:
cd services/[service-name]
npx prisma migrate deploy
# ili
npx prisma db push
```

### 4. Seed-ovanje

```bash
# Seed sve servise odjednom
./scripts/seed-all-services.sh

# Ili individualno:
cd services/[service-name]
npm run seed
```

## 📊 Test Podaci

### Registry Service
- ✅ 5 individualnih kupaca
- ✅ 2 kompanije kao kupci
- ✅ 5 kompanija
- ✅ 8 adresa (različite države)
- ✅ 10 kontakata
- ✅ 8 bankovnih računa (različiti format: IBAN, SWIFT, routing numbers)

### Inventory Service
- ✅ 18 proizvoda (elektronika, odeća, hrana, knjige, nameštaj, alati, kancelarijski materijal)
- ✅ 4 skladišta (različiti statusi)
- ✅ 40+ stock records (zalihe po skladištima i proizvodima)
- ✅ 5 dobavljača
- ✅ 3 narudžbenice (različiti statusi: DRAFT, SENT, RECEIVED)

### Orders Service
- ✅ 5 narudžbi sa različitim statusima:
  - PENDING (neplaćena)
  - CONFIRMED (potvrđena i plaćena)
  - PROCESSING (u obradi)
  - SHIPPED (poslata)
  - DELIVERED (isporučena)
- ✅ Različiti payment provideri (Stripe, PayPal, Bank Transfer)
- ✅ Kompletna status istorija
- ✅ Shipping adrese

### Invoices Service
- ✅ 5 faktura sa različitim statusima:
  - PAID (plaćena)
  - ISSUED (izdata, neplaćena)
  - PARTIALLY_PAID (delimično plaćena)
  - OVERDUE (prekoračena)
  - DRAFT (nacrt)
- ✅ Payment records
- ✅ Dunning reminders (opomene za naplatu)
- ✅ Tax configuration

### Offers Service
- ✅ Ponude sa različitim statusima
- ✅ Line items
- ✅ Approval workflow

### Delivery Service
- ✅ 3 kurirske službe (DHL, UPS, GLS)
- ✅ Delivery notes
- ✅ Tracking events

### Project Management Service
- ✅ Projekti sa milestonima
- ✅ Zadaci sa dependencies
- ✅ Resource allocations
- ✅ Progress tracking

### HR Service
- ✅ Zaposleni
- ✅ Attendance records
- ✅ Payroll records
- ✅ Job postings i applicants

### CRM Service
- ✅ 5 leads sa različitim statusima (NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION)
- ✅ 3 deals u različitim pipeline stage-ovima
- ✅ 4 tasks povezane sa leads/deals
- ✅ 4 activities (calls, emails, meetings, notes)
- ✅ Lead sources (WEBSITE, SOCIAL, EMAIL, CALL, REFERRAL)

## 🔄 Re-seeding

Ako želiš da reset-uješ podatke i seed-uješ pon calling:

```bash
# Pažljivo: Ovo će obrisati sve postojeće podatke!

# Za svaki servis:
cd services/[service-name]
npx prisma migrate reset  # Ovo briše podatke, reset-uje migracije i seed-uje ponovo

# Ili manualno:
npx prisma db push --force-reset
npm run seed
```

## 🧪 Testiranje

Nakon seed-ovanja, možeš testirati:

1. **API Endpoints**: Koristi Swagger dokumentaciju za svaki servis
2. **Integracije**: Testiraj inter-service komunikaciju
3. **Business Logic**: Verifikuj da svi statusi i workflow-ovi rade kako treba

## 📝 Napomene

- Seed skripte koriste `default-tenant` kao tenantId za sve podatke
- Customer i Product IDs su mock vrednosti - u production-u bi se dohvatili iz odgovarajućih servisa
- Svi podaci su dizajnirani za testiranje različitih scenarija i edge case-ova
- Seed skripte su idempotentne - mogu se pokrenuti više puta bez problema

## 🐛 Troubleshooting

### Problem: "Cannot find module '@prisma/client'"
**Rešenje**: 
```bash
cd services/[service-name]
npm install
npx prisma generate
```

### Problem: "Database connection failed"
**Rešenje**: Proveri DATABASE_URL u .env fajlu i da je baza pokrenuta

### Problem: "Migration failed"
**Rešenje**: 
```bash
npx prisma migrate reset  # Pažljivo - briše podatke!
# ili
npx prisma db push
```

### Problem: "Seed script not found"
**Rešenje**: Proveri da package.json sadrži seed script:
```json
{
  "prisma": {
    "seed": "ts-node src/prisma/seed.ts"
  }
}
```

## 📚 Dodatni Resursi

- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Compose Setup](../infrastructure/README.md)
- [API Documentation](../docs/)

