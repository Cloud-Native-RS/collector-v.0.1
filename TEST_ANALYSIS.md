# Analiza koda i testovi

## Pregled

Ovaj dokument sadrži analizu koda tri glavne komponente u CRM modulu i kompletan set testova za njih.

## Analizirane komponente

### 1. ViewLeadDialog (`app/(app)/crm/leads/view-lead-dialog.tsx`)

**Opis:** Dialog komponenta za prikaz detalja lead-a. Omogućava pregled svih informacija o lead-u, uključujući kontakt informacije, kompaniju, timeline, i beleške.

**Ključne funkcionalnosti:**
- Prikaz kompletnih lead informacija
- Editovanje beleški (double-click ili Enter)
- Akcije: Edit, Convert to Customer, Close
- Prikaz statusa i izvora lead-a
- Formiranje URL-ova za email i telefon
- Formatiranje datuma i vrednosti

**Test pokrivenost:**
- ✅ Rendering sa svim sekcijama
- ✅ Prikaz kontakt informacija
- ✅ Prikaz kompanije informacija
- ✅ Prikaz legal representative
- ✅ Timeline prikaz
- ✅ Editovanje beleški (double-click, Enter key)
- ✅ Čuvanje beleški (uspeh i greška)
- ✅ Otkazivanje editovanja
- ✅ Action buttons (Edit, Convert, Close)
- ✅ Status i source mapping
- ✅ Edge cases (null vrednosti, prazna polja)

**Broj testova:** 40+ test slučajeva

### 2. ContactsRegistryPage (`app/(app)/crm/contacts-registry/page.tsx`)

**Opis:** Server-side komponenta koja učitava kontakte iz Registry Service API-ja. Transformiše Customer objekte u Contact format, filtrira samo INDIVIDUAL tipove, i prosleđuje podatke klijentskoj komponenti.

**Ključne funkcionalnosti:**
- Učitavanje INDIVIDUAL tipova kupaca
- Filtriranje COMPANY tipova
- Transformacija Customer → Contact
- Mapiranje kompanija iz Companies API-ja
- Čišćenje "Trading as:" prefiksa
- Status mapping (ACTIVE → active, itd.)
- Error handling

**Test pokrivenost:**
- ✅ Loading state
- ✅ Učitavanje kontakata
- ✅ Filtriranje COMPANY tipova
- ✅ Transformacija podataka
- ✅ Korišćenje company relation
- ✅ Fallback na contact object
- ✅ Čišćenje "Trading as:" teksta
- ✅ Status mapping
- ✅ Error handling (API greške)
- ✅ Validacija kupaca
- ✅ Statistics logging

**Broj testova:** 25+ test slučajeva

### 3. ViewCompanyDialog (`app/(app)/crm/company-registry/view-company-dialog.tsx`)

**Opis:** Dialog komponenta za prikaz detalja kompanije. Prikazuje osnovne informacije, kontakt podatke, adresu, legal representative, bankovni račun, i kontakt osobe.

**Ključne funkcionalnosti:**
- Prikaz kompletnih kompanija informacija
- Uslovno prikazivanje sekcija
- Accordion za kontakt osobe
- Formatiranje web sajta URL-ova
- Formatiranje datuma
- Edit akcija

**Test pokrivenost:**
- ✅ Rendering sa svim sekcijama
- ✅ Basic Information
- ✅ Contact Information (sa i bez kontakt osoba)
- ✅ Address
- ✅ Legal Representative
- ✅ Bank Account
- ✅ Metadata (datumi)
- ✅ Contact Persons accordion
- ✅ Action buttons (Edit, Close)
- ✅ Edge cases (prazna polja, različiti tipovi kompanija)
- ✅ Website URL formatting

**Broj testova:** 35+ test slučajeva

## Test infrastruktura

### Konfiguracija

**Vitest config** (`vitest.config.ts`):
- Environment: jsdom (za React komponente)
- Setup file: `vitest.setup.ts`
- Coverage provider: v8
- Path alias: `@` → root directory

**Setup file** (`vitest.setup.ts`):
- Mock Next.js router hooks
- Mock sonner toast
- Mock window.matchMedia
- Mock IntersectionObserver i ResizeObserver
- Console error suppression

### Instalirane biblioteke

```json
{
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.1.0",
  "@testing-library/user-event": "^14.5.2",
  "@vitejs/plugin-react": "^4.3.4",
  "jsdom": "^25.0.1",
  "vitest": "^3.1.8"
}
```

### Test skripte

```bash
# Pokreni sve testove
npm test

# Pokreni testove u watch modu
npm run test:watch

# Pokreni testove sa UI
npm run test:ui

# Pokreni testove sa coverage
npm run test:coverage
```

## Struktura testova

### ViewLeadDialog testovi

```
view-lead-dialog.test.tsx
├── Rendering
│   ├── Ne renderuje kada je lead null
│   ├── Prikazuje lead name kao title
│   ├── Prikazuje sve sekcije
│   └── Prikazuje status i source badge-ove
├── Contact Information
│   ├── Prikazuje full name
│   ├── Email kao link
│   ├── Phone kao link
│   └── Assigned to
├── Company Information
│   ├── Prikazuje sve kompanije informacije
│   ├── Website kao link
│   └── Tax ID i Registration Number
├── Legal Representative
│   ├── Prikazuje informacije
│   └── Email i phone kao linkovi
├── Timeline
│   ├── Created at date
│   └── Last updated date
├── Notes
│   ├── Prikazuje notes
│   ├── Double-click edit mode
│   ├── Enter key edit mode
│   ├── Save notes (uspeh/greška)
│   └── Cancel editing
├── Action Buttons
│   ├── Close button
│   ├── Edit button
│   └── Convert button
└── Edge Cases
    ├── Status mapping
    ├── Source mapping
    └── State management
```

### ContactsRegistryPage testovi

```
page.test.tsx
├── Loading State
│   └── Prikazuje loading message
├── Data Loading
│   ├── Učitava INDIVIDUAL kontakte
│   ├── Filtrira COMPANY tipove
│   └── Handle-uje praznu listu
├── Data Transformation
│   ├── Transformiše customer u contact
│   ├── Koristi company relation
│   ├── Fetch-uje company iz map-e
│   ├── Contact object fallback
│   ├── Čisti "Trading as:" tekst
│   └── Status mapping
├── Error Handling
│   ├── API greške
│   ├── Companies API greška
│   └── Invalid customers
└── Customer Validation
    ├── Missing firstName/lastName
    └── companyId konverzija
```

### ViewCompanyDialog testovi

```
view-company-dialog.test.tsx
├── Rendering
│   ├── Ne renderuje kada je company null
│   └── Prikazuje sve sekcije
├── Basic Information
│   ├── Legal name
│   ├── Industry
│   ├── Tax ID
│   └── Registration Number
├── Contact Information
│   ├── Email i phone
│   ├── Website formatting
│   └── Uslovno prikazivanje
├── Address
│   └── Sva polja
├── Legal Representative
│   ├── Prikazuje informacije
│   └── Uslovno prikazivanje
├── Bank Account
│   ├── Prikazuje informacije
│   └── Uslovno prikazivanje
├── Metadata
│   └── Formatiranje datuma
├── Contact Persons
│   ├── Accordion prikaz
│   ├── Prikaz informacija
│   └── Minimal informacije
├── Action Buttons
│   ├── Close button
│   └── Edit button
└── Edge Cases
    ├── Prazna polja
    ├── Website URL formatting
    └── Različiti tipovi i statusi
```

## Pokretanje testova

### Prvo pokretanje

```bash
# Instaliraj dependencies
npm install

# Pokreni testove
npm test
```

### Watch mode (razvoj)

```bash
npm run test:watch
```

### Coverage report

```bash
npm run test:coverage
```

Coverage report će biti dostupan u `coverage/` direktorijumu.

### UI mode

```bash
npm run test:ui
```

Otvara Vitest UI u browser-u za interaktivno testiranje.

## Mock-ovanje

### API Mock-ovi

Svi API pozivi su mock-ovani koristeći Vitest `vi.mock()`:

- `@/lib/api/crm` - Mock-ovan za CRM API pozive
- `@/lib/api/registry` - Mock-ovan za Registry API pozive
- `sonner` - Mock-ovan za toast notifikacije

### Next.js Mock-ovi

Next.js router hooks su mock-ovani u `vitest.setup.ts`:
- `useRouter`
- `usePathname`
- `useSearchParams`

## Testiranje best practices

### 1. Arrange-Act-Assert pattern

Svi testovi prate AAA pattern:

```typescript
it('should do something', async () => {
  // Arrange
  const props = { ... };
  const mockFunction = vi.fn();
  
  // Act
  render(<Component {...props} />);
  await user.click(button);
  
  // Assert
  expect(mockFunction).toHaveBeenCalled();
});
```

### 2. Koristi userEvent umesto fireEvent

```typescript
// ✅ Dobro
const user = userEvent.setup();
await user.click(button);

// ❌ Loše
fireEvent.click(button);
```

### 3. Koristi waitFor za async operacije

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 4. Cleanup između testova

Svi mock-ovi se reset-uju u `beforeEach` i `afterEach` hooks.

## Potencijalna poboljšanja

### 1. Integration testovi

Trenutno su samo unit testovi. Možete dodati integration testove koji testiraju interakciju između komponenti.

### 2. E2E testovi

Dodajte Playwright ili Cypress testove za end-to-end testiranje.

### 3. Visual regression testovi

Koristite Chromatic ili Percy za visual regression testiranje.

### 4. Performance testovi

Dodajte testove za performance metrike (render time, memory usage).

## Coverage ciljevi

Trenutni coverage ciljevi:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Troubleshooting

### Problem: Testovi ne pronalaze komponente

**Rešenje:** Proveri da li su svi mock-ovi pravilno postavljeni u `vitest.setup.ts`.

### Problem: Async warnings u testovima

**Rešenje:** Koristi `waitFor` za async assertions i `act` kada je potrebno.

### Problem: Module resolution greške

**Rešenje:** Proveri `vitest.config.ts` i path aliases.

## Zaključak

Sve tri komponente imaju kompletnu test pokrivenost sa preko 100 test slučajeva koji pokrivaju:
- ✅ Rendering
- ✅ User interakcije
- ✅ API pozive
- ✅ Error handling
- ✅ Edge cases
- ✅ State management

Testovi su organizovani, čitljivi, i održivi, sledeći React Testing Library best practices.


