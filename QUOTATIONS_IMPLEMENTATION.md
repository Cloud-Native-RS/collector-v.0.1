# Quotations System Implementation

## Pregled

Implementiran je kompletan sistem za kreiranje i pregled ponuda (quotations) u Collector aplikaciji. Sistem uključuje:

- **Backend API** za upravljanje ponudama
- **Sheet modal** za kreiranje ponuda
- **Public preview** stranica za klijente
- **PDF generisanje** koristeći postojeće invoice template
- **Konverzija** ponuda u fakture

## Arhitektura

### Backend (offers-service)

#### 1. Prisma Schema Proširenje

Nova polja dodata u `Offer` model:
- `customerName` - Ime klijenta
- `customerDetails`, `fromDetails`, `paymentDetails`, `noteDetails` - JSON EditorDoc format
- `topBlock`, `bottomBlock` - Custom sadržaj
- `template` - Kompletan Template objekat
- `logoUrl` - Logo kompanije
- `dateFormat`, `locale`, `timezone` - Format konfiguracija
- `includeDecimals`, `includeUnits` - Display opcije
- `token` - JWT token za javni pristup
- `viewedAt`, `sentTo` - Tracking
- `convertedToInvoiceId` - Referenca na fakturu

Nova polja u `OfferLineItem` model:
- `name` - Display name
- `unit` - Jedinica mere (kom, m2, sat, etc.)

#### 2. Novi API Endpoints

**Public (bez autentifikacije):**
- `GET /api/offers/public/:token` - Javni pristup ponudi

**Protected (sa autentifikacijom):**
- `POST /api/offers/:id/generate-token` - Generisanje share tokena
- `POST /api/offers/:id/mark-viewed` - Označavanje kao pregledano
- `POST /api/offers/:id/convert-to-invoice` - Konverzija u fakturu

#### 3. Novi Servisi

**Token Service** (`src/utils/token.ts`):
- JWT generisanje i verifikacija
- 30 dana validnost tokena

**Invoice Integration Service** (`src/services/invoice-integration.service.ts`):
- Komunikacija sa invoices-service
- Mapiranje Offer → Invoice podataka

### Frontend

#### 1. Public Preview Page (`/app/q/[token]/page.tsx`)

- **Pristup**: Nezavisna stranica bez autentifikacije
- **Layout**: Minimalistički, bez sidebara
- **Funkcije**:
  - Prikaz ponude u HTML formatu
  - Download PDF dugme
  - Accept/Reject dugmad (za SENT status)
  - Automatsko markiranje kao viewed

#### 2. Create Offer Sheet (`/app/(app)/sales/quotations/components/create-offer-sheet.tsx`)

- **Tip**: Sheet modal sa desne strane
- **Funkcije**:
  - Multi-field forma za osnovne podatke
  - Line items manager sa dinamičkim dodavanjem
  - Real-time kalkulacija (subtotal, tax, total)
  - Nakon kreiranja: "View Preview" dugme

#### 3. Data Table Enhancements (`/app/(app)/sales/quotations/offer-data-table.tsx`)

Nove akcije u dropdown meniju:
- **Preview** - Sheet preview unutar aplikacije
- **View Full Page** - Otvara `/q/[token]` u novom tabu
- **Copy Share Link** - Kopira shareable link
- **Download PDF** - Preuzima PDF
- **Convert to Invoice** - Konvertuje u fakturu (samo za APPROVED)

#### 4. Offer to Invoice Adapter (`/app/(app)/sales/quotations/utils/offer-to-invoice-adapter.ts`)

- Konvertuje Offer tip u Invoice tip
- Omogućava korišćenje postojećih invoice template komponenti

#### 5. PDF Generation (`/app/api/offers/[id]/pdf/route.ts`)

- Next.js API route
- Koristi `@react-pdf/renderer`
- Generisanje PDF-a iz ponude

## Environment Varijable

Dodati u `.env`:

```bash
# Offer JWT Secret za token generisanje
OFFER_JWT_SECRET=your-secret-key-change-in-production

# Invoices Service URL
INVOICES_SERVICE_URL=http://localhost:3004

# Offers Service URL (za Next.js frontend)
OFFERS_SERVICE_URL=http://localhost:3003
```

## Migracija Baze

Migracija je kreirana u:
```
/services/offers-service/prisma/migrations/20251103220851_add_quotation_fields/migration.sql
```

**Za primenu migracije:**

```bash
cd services/offers-service
npx prisma migrate deploy
```

## Korišćenje

### 1. Kreiranje Ponude

1. Idi na `/sales/quotations`
2. Klikni "Create Offer" dugme
3. Popuni formu:
   - Customer ID
   - Valid Until datum
   - Currency
   - Line items (dodaj proizvode/usluge)
4. Klikni "Create Quotation"
5. Nakon kreiranja, klikni "View Preview" za prikaz

### 2. Pregled Ponude

**Interna pregled:**
- Klikni na offer number u tabeli
- Ili klikni "Actions" → "Preview"

**Javni pregled (za klijente):**
- "Actions" → "Copy Share Link"
- Pošalji link klijentu
- Link: `https://yourapp.com/q/{token}`

### 3. PDF Download

- "Actions" → "Download PDF"
- PDF se automatski preuzima

### 4. Konverzija u Fakturu

1. Ponuda mora biti u statusu "APPROVED"
2. "Actions" → "Convert to Invoice"
3. Automatski kreira fakturu u invoices-service

## Status Flow

```
DRAFT → SENT → APPROVED → Converted to Invoice
              ↓
           REJECTED
```

## Struktura Fajlova

```
services/offers-service/
├── prisma/
│   ├── migrations/
│   │   └── 20251103220851_add_quotation_fields/
│   │       └── migration.sql
│   └── schema.prisma (proširena)
├── src/
│   ├── routes/
│   │   ├── offer.routes.ts (nove rute)
│   │   └── public-offer.routes.ts (javne rute)
│   ├── services/
│   │   ├── offer.service.ts (nove metode)
│   │   └── invoice-integration.service.ts (novo)
│   └── utils/
│       └── token.ts (novo)

app/
├── q/
│   └── [token]/
│       ├── layout.tsx (novi minimalistički layout)
│       └── page.tsx (public preview)
├── api/
│   └── offers/
│       └── [id]/
│           └── pdf/
│               └── route.ts (PDF generation)
└── (app)/
    └── sales/
        └── quotations/
            ├── components/
            │   └── create-offer-sheet.tsx (novo)
            ├── utils/
            │   └── offer-to-invoice-adapter.ts (novo)
            ├── offer-data-table.tsx (proširena)
            └── page.tsx (proširena)
```

## Tehnologije

- **Backend**: Express.js, Prisma, PostgreSQL, JWT (jose)
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **PDF**: @react-pdf/renderer
- **Forms**: react-hook-form
- **UI**: shadcn/ui komponente

## Testiranje

### 1. Testiranje Kreiranje Ponude
```bash
# Pokreni offers-service
cd services/offers-service
npm run dev

# Pokreni Next.js app
npm run dev
```

Idi na `http://localhost:3000/sales/quotations` i testiraj kreiranje.

### 2. Testiranje Public Preview

1. Kreiraj ponudu
2. Generiši token ("View Full Page" ili "Copy Share Link")
3. Otvori link u incognito window
4. Proveri da li se prikazuje bez autentifikacije

### 3. Testiranje PDF

1. Klikni "Download PDF" na bilo kojoj ponudi
2. Proveri generisani PDF fajl

## Napomene

- **Token trajanje**: 30 dana
- **Template**: Koristi isti dizajn kao invoice
- **Konverzija**: Zahteva da invoices-service bude pokrenut
- **Placeholder customer ID**: U create form-i trenutno se koristi temp ID - potrebno je povezati sa customer selection komponentom

## Buduća Unapređenja

1. **Customer Selection**: Dropdown sa pretragom umesto ručnog unosa ID-a
2. **Rich Text Editors**: TipTap editori za customerDetails, fromDetails, paymentDetails
3. **Email Integration**: Slanje ponuda direktno klijentu putem email-a
4. **Verzionisanje**: UI za pregled revizija ponuda
5. **Approval Workflow**: Implementacija multi-step approval procesa
6. **Bulk Actions**: Bulk generisanje PDF-a, bulk slanje
7. **Templates**: Custom templates za različite tipove ponuda

## Autor

Implementacija u skladu sa postojećim invoice sistemom i best practices.

