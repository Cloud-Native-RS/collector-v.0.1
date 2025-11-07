# 🔄 Migration Guide - Kako Primeniti Optimizacije

Ovaj guide pokazuje kako da primenite nove optimizacije na postojeći kod.

---

## 🚀 Quick Start

### 1. Setup React Query Provider

**File**: `app/layout.tsx`

```tsx
// Dodajte import
import { QueryProvider } from "@/lib/react-query";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {/* Wrap children sa QueryProvider */}
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 📋 Primeri Migracije

### MIGRACIJA 1: useEffect → React Query

#### ❌ BEFORE (Anti-pattern):
```tsx
function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const response = await customersApi.list();
        setContacts(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return <div>{/* render contacts */}</div>;
}
```

#### ✅ AFTER (Best practice):
```tsx
import { useContacts } from "@/lib/react-query";

function ContactsList() {
  const { data: contacts, isLoading, error } = useContacts();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return <div>{/* render contacts */}</div>;
}
```

**Benefiti**:
- 10 linija manje koda
- Automatic caching
- Background refetching
- Request deduplication

---

### MIGRACIJA 2: Regular Table → Virtualized Table

#### ❌ BEFORE:
```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
    <TableBody>
      {table.getRowModel().rows.map((row) => (
        <TableRow key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

#### ✅ AFTER (50+ rows):
```tsx
import { VirtualizedTable } from "@/components/ui/virtualized-table";

<div className="rounded-md border">
  <VirtualizedTable
    table={table}
    estimateSize={53}  // Row height
    overscan={5}       // Extra rows to render
  />
</div>
```

**Kada koristiti**: Tabele sa 50+ redova

---

### MIGRACIJA 3: Desktop-Only Table → Mobile Responsive

#### ❌ BEFORE (Desktop only):
```tsx
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```

#### ✅ AFTER (Option 1 - Simple Scroll):
```tsx
import { ResponsiveTableWrapper } from "@/components/ui/responsive-table-wrapper";

<ResponsiveTableWrapper>
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</ResponsiveTableWrapper>
```

#### ✅ AFTER (Option 2 - Card View for Mobile):
```tsx
import { MobileCardView } from "@/components/ui/mobile-card-view";
import { useMediaQuery } from "@/hooks/use-media-query";

function ContactsTable({ contacts }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <MobileCardView
        data={contacts}
        renderCard={(contact) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {contact.firstName} {contact.lastName}
              </h3>
              <Badge>{contact.status}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {contact.email}
            </div>
          </div>
        )}
      />
    );
  }

  return (
    <Table>
      <TableHeader>...</TableHeader>
      <TableBody>...</TableBody>
    </Table>
  );
}
```

---

### MIGRACIJA 4: Immediate UI Blocks → Optimistic Updates

#### ❌ BEFORE (Blocking):
```tsx
const handleDragEnd = async (dealId, newStage) => {
  setIsUpdating(true);  // Show loading spinner
  try {
    await crmApi.updateDealStage(dealId, newStage);
    await refreshDeals();  // Refetch all deals
  } catch (error) {
    toast.error("Failed to update");
  } finally {
    setIsUpdating(false);
  }
};
```

#### ✅ AFTER (Instant UI):
```tsx
import { useUpdateDealStage } from "@/lib/react-query";

const updateStage = useUpdateDealStage();

const handleDragEnd = (dealId, newStage) => {
  // UI updates instantly, rolls back on error
  updateStage.mutate({
    dealId,
    stage: newStage
  });
};
```

**Benefiti**:
- Instant UI feedback
- Automatic rollback on error
- Background refetch after success
- Much better UX

---

### MIGRACIJA 5: window.location.reload() → Proper Refetch

#### ❌ BEFORE (Anti-pattern):
```tsx
const handleSave = async (contact) => {
  await customersApi.update(contact.id, contact);
  toast.success("Contact saved");
  window.location.reload();  // Full page reload!
};
```

#### ✅ AFTER:
```tsx
import { useUpdateContact } from "@/lib/react-query";

const updateContact = useUpdateContact();

const handleSave = (contact) => {
  updateContact.mutate({
    id: contact.id,
    data: contact
  });
  // Automatically invalidates queries and refetches!
};
```

---

### MIGRACIJA 6: Heavy Components → Dynamic Imports

#### ❌ BEFORE:
```tsx
// page.tsx
import HeavyKanbanBoard from "./kanban-board";

export default function Page() {
  return <HeavyKanbanBoard />;
}
```

#### ✅ AFTER:
```tsx
// page.tsx (Server Component)
import KanbanClient from "./kanban-client";

export default function Page() {
  return <KanbanClient />;
}

// kanban-client.tsx (NEW FILE)
"use client";

import dynamic from "next/dynamic";

const HeavyKanbanBoard = dynamic(() => import("./kanban-board"), {
  loading: () => <div>Loading kanban...</div>,
  ssr: false
});

export default function KanbanClient() {
  return <HeavyKanbanBoard />;
}
```

**Smanjenje bundle size-a**: ~30-40%

---

### MIGRACIJA 7: Duplicate Detail Panels → Shared Components

#### ❌ BEFORE (770 lines duplicated):
```tsx
// ContactDetailsPanel.tsx - 762 lines
// CompanyDetailsPanel.tsx - 770 lines
// 80% identical code!
```

#### ✅ AFTER:
```tsx
import { useDetailPanelState } from "@/app/(app)/crm/shared/hooks/useDetailPanelState";
import {
  DetailPanelLayout,
  AddressSection,
  ContactInfoField
} from "@/app/(app)/crm/shared/components";

export function ContactDetailsPanel({ contact, ...props }) {
  const state = useDetailPanelState({
    entity: contact,
    open: props.open,
    isNewEntity: props.isNewContact,
    defaultNewEntity: defaultContact,
  });

  return (
    <DetailPanelLayout
      open={props.open}
      onClose={props.onClose}
      title={contact?.firstName || "New Contact"}
      isEditMode={state.isEditMode}
      onEdit={state.handleEdit}
      onSave={handleSave}
      onCancel={state.handleCancel}
    >
      <ContactInfoField
        icon={Mail}
        label="Email"
        value={state.editedEntity?.email}
        isEditMode={state.isEditMode}
        onChange={(v) => state.updateEditedEntity({ email: v })}
      />

      <AddressSection
        address={state.editedEntity?.address}
        isEditMode={state.isEditMode}
        onAddressChange={(field, value) =>
          state.updateEditedEntity({
            address: { ...state.editedEntity?.address, [field]: value }
          })
        }
      />
    </DetailPanelLayout>
  );
}
```

**Redukcija koda**: ~80%

---

### MIGRACIJA 8: `any` Types → Prisma Types

#### ❌ BEFORE:
```typescript
// service.ts
async getAll(tenantId: string, filters?: any): Promise<any[]> {
  const where: any = { tenantId };

  if (filters?.category) {
    where.category = filters.category;
  }

  return this.prisma.product.findMany({ where });
}

async update(id: string, data: Partial<any>): Promise<Product> {
  return this.prisma.product.update({
    where: { id },
    data
  });
}
```

#### ✅ AFTER:
```typescript
import { Product, Prisma } from '@prisma/client';

async getAll(
  tenantId: string,
  filters?: {
    category?: ProductCategory;
    search?: string;
  }
): Promise<Product[]> {
  const where: Prisma.ProductWhereInput = { tenantId };

  if (filters?.category) {
    where.category = filters.category;
  }

  return this.prisma.product.findMany({ where });
}

async update(
  id: string,
  data: Prisma.ProductUpdateInput
): Promise<Product> {
  return this.prisma.product.update({
    where: { id },
    data
  });
}
```

**Benefiti**:
- Full TypeScript type safety
- IntelliSense autocomplete
- Compile-time error catching

---

### MIGRACIJA 9: Unoptimized Images → Optimized

#### ❌ BEFORE:
```tsx
<Image
  src="/logo.png"
  width={30}
  height={30}
  alt="Logo"
  unoptimized  // ❌ BAD!
/>
```

#### ✅ AFTER:
```tsx
<Image
  src="/logo.png"
  width={30}
  height={30}
  alt="Logo"
  priority  // For above-the-fold images
/>

// For responsive images:
<Image
  src={product.image}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
  alt={product.name}
/>
```

---

### MIGRACIJA 10: console.log → Environment-Protected Logging

#### ❌ BEFORE:
```typescript
console.log("Debug info:", data);  // Always logs!
```

#### ✅ AFTER:
```typescript
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

---

## 📊 Checklist Pre Production Deploy

- [ ] React Query Provider je dodat u root layout
- [ ] Sve tabele sa 50+ redova koriste virtualizaciju
- [ ] Mobilna responzivnost testirana
- [ ] Dynamic imports dodati za teške komponente (>50KB)
- [ ] `unoptimized` flag uklonjen sa svih slika
- [ ] Error boundaries postavljeni
- [ ] Console.logs zaštićeni environment checks
- [ ] `any` tipovi zamenjeni sa proper types
- [ ] ARIA labele dodate na interactive elements
- [ ] Build prošao uspešno: `npm run build`

---

## 🚨 Common Pitfalls

### 1. Zaboravljanje React Query Provider
```tsx
// ❌ Query hooks neće raditi
<App />

// ✅ Correct
<QueryProvider>
  <App />
</QueryProvider>
```

### 2. Koristiti virtualizaciju na malim tabelama
```tsx
// ❌ Overkill za 10 redova
<VirtualizedTable data={10rows} />

// ✅ Use regular table
<Table>...</Table>
```

### 3. Dynamic import u Server Component sa ssr:false
```tsx
// ❌ Ne radi u Server Components
const Comp = dynamic(() => import('./comp'), { ssr: false });

// ✅ Pravi client wrapper
// client.tsx
"use client";
const Comp = dynamic(() => import('./comp'), { ssr: false });
```

---

## 🎓 Best Practices

1. **Always use React Query za API calls**
   - Automatic caching
   - Better UX
   - Less code

2. **Virtualize large lists** (50+ items)
   - Tables
   - Infinite scroll lists
   - Heavy content lists

3. **Dynamic import heavy components** (>50KB)
   - Charts libraries
   - Rich text editors
   - Calendar components

4. **Test mobile responsiveness**
   - Use Chrome DevTools
   - Test on real devices
   - Check all breakpoints

5. **Type safety first**
   - Never use `any`
   - Use Prisma generated types
   - Enable TypeScript strict mode

---

**Happy Optimizing!** 🚀
