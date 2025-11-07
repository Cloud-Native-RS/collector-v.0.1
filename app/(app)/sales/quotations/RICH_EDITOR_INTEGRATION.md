# Rich Text Editor Integration

## Pregled izmena

Postojeći offer editor je unapređen integracijom **MinimalTiptapEditor** komponente, zamenjujući obične textarea komponente za Notes i Payment Details polja.

> **Napomena**: Umesto korišćenja editora iz `app/(app)/sales/quotations/ui` biblioteke (`@midday/ui`), koristimo **MinimalTiptapEditor** koji je već deo globalnih komponenti projekta (`@/components/ui/custom/minimal-tiptap`). Ovo omogućava konzistentnost sa ostatkom aplikacije i izbegava probleme sa module resolution-om.

## Šta je izmenjeno

### 1. **Import sekcija**
```typescript
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap";
import type { Content } from "@tiptap/react";
```

### 2. **State management**
- **Uklonjeno**: `useState` za `notes` i `paymentDetails` kao plain stringove
- **Dodato**: `useState` sa `Content` tipom za rich text
```typescript
const [notesContent, setNotesContent] = useState<Content>("");
const [paymentDetailsContent, setPaymentDetailsContent] = useState<Content>("");
```

### 3. **Form submission**
Content se konvertuje u string pre slanja na API:
```typescript
const notesHTML = typeof notesContent === 'string' ? notesContent : JSON.stringify(notesContent);
const paymentDetailsHTML = typeof paymentDetailsContent === 'string' ? paymentDetailsContent : JSON.stringify(paymentDetailsContent);
```

### 4. **UI komponente**
Textarea zamenjene sa **MinimalTiptapEditor** koji podržava:
- ✅ **Bold, Italic, Underline, Strikethrough** (toolbar)
- ✅ **Code** formatting
- ✅ **Ordered & Bullet Lists**
- ✅ **Link formatiranje** (bubble menu)
- ✅ **Clear formatting**
- ✅ **Placeholder tekst**
- ✅ **Keyboard shortcuts**
- ✅ **Multi-line tekst sa formatiranjem**

### 5. **Currency fix**
- Promenjena valuta sa `USD` na `EUR` (odgovara UI prikazu sa € simbolom)

## UI/UX poboljšanja

### Payment Details Editor
```typescript
<MinimalTiptapEditor
  value={paymentDetailsContent}
  onChange={setPaymentDetailsContent}
  placeholder="Bank: Chase
Account number: 085029563
Iban: 061511313434613313
Swift (bic): ESSSESSS"
  className="min-h-[200px] w-full"
  editorContentClassName="p-4"
/>
```

**Karakteristike:**
- `min-h-[200px]` - minimalna visina editora
- `w-full` - puna širina
- `editorContentClassName="p-4"` - padding unutar editor content-a
- Built-in toolbar sa formatiranjem
- Built-in border i focus states

### Notes Editor
Ista implementacija kao Payment Details, ali sa drugim placeholder tekstom.

## Funkcionalnost Editora

### Toolbar Akcije
Vidljiv toolbar na vrhu editora sa sledećim opcijama:
- **Bold** (Ctrl/Cmd + B)
- **Italic** (Ctrl/Cmd + I)
- **Underline** (Ctrl/Cmd + U)
- **Strikethrough**
- **Code** (inline code)
- **Clear Formatting**
- **Ordered List**
- **Bullet List**

### Link Bubble Menu
Kada korisnik selektuje tekst, može dodati/izmeniti linkove kroz bubble menu.

### Ekstenzije (MinimalTiptap)
MinimalTiptapEditor dolazi sa built-in ekstenzijama:
- **StarterKit** - osnovna TipTap funkcionalnost (paragraphs, headings, etc.)
- **Bold, Italic, Underline, Strike** - text formatting
- **Lists** - ordered i unordered liste
- **Link** - link handling sa bubble menu
- **Code** - inline code blocks
- **Selection** - custom selection handling
- **Image** - image support (opcionalno)

## Data Flow

```
User Input → MinimalTiptapEditor → onChange(Content)
                                         ↓
                            State Update (setNotesContent)
                                         ↓
                        Form Submit → Convert to String → API
```

## API Integration

### Kako se podaci šalju
```typescript
// Konverzija Content u string
const notesHTML = typeof notesContent === 'string' 
  ? notesContent 
  : JSON.stringify(notesContent);
  
const paymentDetailsHTML = typeof paymentDetailsContent === 'string' 
  ? paymentDetailsContent 
  : JSON.stringify(paymentDetailsContent);

// Kombinovanje notes i payment details u jedan string
const combinedNotes = [
  notesHTML && notesHTML !== "" && notesHTML !== '""' 
    ? `<div><strong>Notes:</strong><div>${notesHTML}</div></div>` 
    : "",
  paymentDetailsHTML && paymentDetailsHTML !== "" && paymentDetailsHTML !== '""' 
    ? `<div><strong>Payment Details:</strong><div>${paymentDetailsHTML}</div></div>` 
    : ""
].filter(Boolean).join("") || undefined;

// Slanje na API
await createOfferMutation.mutateAsync({
  customerId: selectedCustomerId,
  validUntil: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  currency: "EUR",
  notes: combinedNotes,
  lineItems: [...]
});
```

### API očekivanja
- **Tip**: `notes?: string`
- **Format**: String (može biti HTML, JSON, ili plain text)
- **Validation**: Optional field (može biti prazan)
- **Struktura**: Kombinovani notes i payment details sa HTML wrapping-om

## Prednosti nove implementacije

### ✅ User Experience
1. **Rich formatting** - korisnici mogu formatirati tekst sa toolbar-om
2. **Visual toolbar** - vidljive opcije formatiranja (ne samo bubble menu)
3. **List support** - mogućnost kreiranja ordered i unordered listi
4. **Better UX** - jasni placeholder tekstovi i intuitivni controls
5. **Professional look** - moderan editor interface sa border i focus states
6. **Code formatting** - inline code blocks za strukturirane podatke

### ✅ Maintainability
1. **Built-in component** - MinimalTiptapEditor je već deo projekta
2. **No external dependencies** - koristi postojeće komponente
3. **Type safety** - TypeScript podrška sa Content tipom
4. **Consistent UI** - isto kao drugi rich text editori u projektu
5. **Extensible** - lako dodavanje novih ekstenzija ako zatreba

### ✅ Data Handling
1. **Flexible output** - Content type se može konvertovati u string ili JSON
2. **Empty state handling** - pravilno rukovanje praznim stanjem
3. **Structured data** - mogućnost JSON formata
4. **HTML wrapping** - strukturirano kombinovanje notes i payment details

## Buduća unapređenja (opciono)

### Mogući dodaci:
- [ ] **Autosave** - čuvanje drafta tokom kucanja
- [ ] **Character counter** - ograničenje dužine
- [ ] **Formatting toolbar** - dodatna toolbar opcija
- [ ] **Image upload** - upload slika u notes
- [ ] **Templates** - predefinisani payment details templates
- [ ] **Markdown support** - markdown import/export

## Troubleshooting

### Problem: "Module not found: Can't resolve '@/components/ui/editor'"
**Uzrok**: Editor komponenta ne postoji u globalnom `@/components/ui/` folderu  
**Rešenje**: Koristiti `MinimalTiptapEditor` iz `@/components/ui/custom/minimal-tiptap` umesto

### Problem: Editor ne prikazuje formatiranje
**Rešenje**: MinimalTiptapEditor automatski uključuje stilove, ali proveriti da li su Tailwind klase učitane

### Problem: Content se ne čuva kako treba
**Rešenje**: Proveriti da li se `onChange` callback pravilno poziva i da li se state ažurira

### Problem: Toolbar se ne prikazuje
**Rešenje**: Proveriti `className` prop i da li postoji dovoljna visina (`min-h-[200px]`)

### Problem: HTML tagovi se prikazuju u preview-u
**Rešenje**: Content treba parsirati ili koristiti `dangerouslySetInnerHTML` za HTML rendering

## Zaključak

**MinimalTiptapEditor** je uspešno integrisan u offer editor, pružajući:
- ✅ **Bolji UX** - profesionalniji interface sa toolbar-om i formatting opcijama
- ✅ **Konzistentnost** - koristi istu komponentu kao ostatak projekta
- ✅ **Maintainability** - built-in komponenta bez external dependencies
- ✅ **API kompatibilnost** - konvertuje Content u format koji API očekuje
- ✅ **Čist dizajn** - zadržan invoice-like dizajn sa modernizovanim input poljima

Implementacija je potpuno funkcionalna, održiva, proširiva i ready za production.

