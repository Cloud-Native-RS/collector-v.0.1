# Invoice Creation Drawer - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```typescript
import { CreateInvoiceDrawer } from "./components";

function MyPage() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Create Invoice</button>
      <CreateInvoiceDrawer 
        open={open} 
        onOpenChange={setOpen}
        onSuccess={() => console.log("Saved!")}
      />
    </>
  );
}
```

---

## 📋 Component API

### CreateInvoiceDrawer Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ Yes | Controls drawer visibility |
| `onOpenChange` | `(open: boolean) => void` | ✅ Yes | Callback when drawer state changes |
| `onSuccess` | `() => void` | ❌ No | Called when invoice is saved |

---

## 🎨 Features at a Glance

| Feature | Description | Status |
|---------|-------------|--------|
| **Slide Animation** | Smooth slide-in from right | ✅ |
| **Auto-increment** | Invoice numbers (INV-00001) | ✅ |
| **Calculations** | Real-time totals | ✅ |
| **Dynamic Rows** | Add/remove line items | ✅ |
| **Validation** | Form validation | ✅ |
| **Responsive** | Mobile-friendly | ✅ |
| **Accessible** | WCAG compliant | ✅ |
| **Dark Mode** | Theme support | ✅ |

---

## 📊 Table Columns

| # | Column | Type | Options |
|---|--------|------|---------|
| 1 | # | Auto | 1, 2, 3... |
| 2 | Description | Textarea | 300+ chars |
| 3 | Qty | Number | 0+ |
| 4 | Unit | Dropdown | pcs, hrs, kg, m, m², m³, l |
| 5 | Unit Price | Number | €0.00+ |
| 6 | Disc % | Number | 0-100% |
| 7 | VAT % | Dropdown | 0%, 5%, 10%, 13%, 20%, 25% |
| 8 | Amount | Calculated | Read-only |

---

## 🧮 Calculation Formula

```typescript
// Per Line Item
lineAmount = (qty × unitPrice) - (qty × unitPrice × discountPercent / 100)

// Summary
amountBeforeDiscount = Σ(qty × unitPrice)
totalDiscount = Σ(lineAmount - amount)
subtotal = amountBeforeDiscount - totalDiscount
vatAmount = Σ(lineAmount × vatPercent / 100)
grandTotal = subtotal + vatAmount
```

---

## 🎯 Common Use Cases

### 1. Basic Usage
```typescript
<CreateInvoiceDrawer open={isOpen} onOpenChange={setIsOpen} />
```

### 2. With Success Callback
```typescript
<CreateInvoiceDrawer 
  open={isOpen} 
  onOpenChange={setIsOpen}
  onSuccess={() => {
    toast.success("Invoice created!");
    refetchInvoices();
  }}
/>
```

### 3. With React Query
```typescript
const queryClient = useQueryClient();

<CreateInvoiceDrawer 
  open={isOpen} 
  onOpenChange={setIsOpen}
  onSuccess={() => {
    queryClient.invalidateQueries(['invoices']);
  }}
/>
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Next field |
| `Shift + Tab` | Previous field |
| `Enter` | Submit / Open dropdown |
| `Esc` | Close drawer |
| `Arrow Keys` | Navigate dropdowns |

---

## 🎨 Styling Classes (Tailwind)

```css
/* Drawer */
max-w-6xl          /* Max width */
rounded-l-2xl      /* Rounded left corners */
shadow-2xl         /* Shadow */

/* Form */
px-8 py-6          /* Padding */
space-y-8          /* Section spacing */

/* Inputs */
h-11               /* Input height */
rounded-xl         /* Border radius */

/* Buttons */
h-11               /* Default height */
h-12               /* Large height */
font-semibold      /* Font weight */
```

---

## 🔍 Debugging

### Check Invoice Number
```javascript
localStorage.getItem('lastInvoiceNumber') // Current number
localStorage.setItem('lastInvoiceNumber', '0') // Reset
```

### Inspect State
```javascript
// React DevTools
Component: InvoiceForm
State: lineItems, invoiceNumber
```

### Console Logging
```typescript
console.log(calculateTotals()); // Check calculations
console.log(lineItems); // Check line items
```

---

## 📱 Responsive Breakpoints

| Device | Breakpoint | Layout |
|--------|-----------|---------|
| Mobile | < 768px | Full width, stacked |
| Tablet | 768px - 1024px | 80% width |
| Desktop | > 1024px | Max 6xl width |

---

## 🎨 Theme Variables

```css
--background      /* Main background */
--foreground      /* Text color */
--primary         /* Brand color */
--muted           /* Subtle backgrounds */
--border          /* Border color */
--destructive     /* Error/discount color */
```

---

## 🔧 Configuration

### Change Currency
```typescript
// In invoice-form.tsx
formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR", // Change to USD, GBP, etc.
  }).format(amount);
}
```

### Change VAT Rates
```typescript
// In invoice-form.tsx, VAT dropdown
<SelectItem value="20">20%</SelectItem>
// Add more options as needed
```

### Change Units
```typescript
// In invoice-form.tsx, Unit dropdown
<SelectItem value="pcs">pcs</SelectItem>
// Add more units as needed
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Drawer doesn't open | Check `open` prop is true |
| Animation is choppy | Check Framer Motion is installed |
| Calculations wrong | Verify numeric parsing (parseFloat) |
| Invoice # doesn't increment | Check localStorage is available |
| Styles look wrong | Verify TailwindCSS is configured |

---

## 📦 Dependencies

```json
{
  "motion": "^12.23.24",          // Animations
  "lucide-react": "^0.469.0",     // Icons
  "sonner": "^1.7.1",             // Toasts
  "@radix-ui/*": "^1.x",          // UI primitives
  "tailwindcss": "^4.1.16"        // Styling
}
```

---

## 📚 Documentation Files

| File | Purpose | Lines |
|------|---------|-------|
| `INVOICE_DRAWER_README.md` | Component docs | ~350 |
| `USAGE_EXAMPLES.md` | Integration examples | ~600 |
| `DEMO_GUIDE.md` | Visual tour | ~400 |
| `QUICK_REFERENCE.md` | This file | ~200 |

---

## 🎯 Key Files

```
components/
├── create-invoice-drawer.tsx    # Main wrapper (75 lines)
├── invoice-form.tsx              # Form logic (450 lines)
└── index.ts                      # Exports (2 lines)
```

---

## ⚡ Performance Tips

1. **Memoize Calculations**: Use `useMemo` for expensive operations
2. **Debounce Input**: For real-time search/validation
3. **Lazy Load**: Import drawer only when needed
4. **Optimize Renders**: Use `React.memo` for list items
5. **Code Split**: Dynamic import for heavy components

---

## ♿ Accessibility Checklist

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus indicators
- ✅ ARIA labels
- ✅ Color contrast
- ✅ Error messages
- ✅ Touch targets (44px min)

---

## 🔐 Security Notes

- ✅ No sensitive data in localStorage
- ✅ Input validation on all fields
- ✅ XSS protection (React escapes by default)
- ⚠️ Add server-side validation when integrating API
- ⚠️ Implement authentication/authorization

---

## 📈 Next Steps

1. **Backend**: Connect to API endpoints
2. **PDF**: Add PDF generation
3. **Email**: Implement email sending
4. **Tests**: Add unit/integration tests
5. **Analytics**: Track usage metrics

---

## 🆘 Quick Help

### Can't find the file?
```bash
cd /Users/darioristic/Projects/Collector\ v.0.1/app/\(app\)/sales/invoices/
ls -la components/
```

### Need to restart?
```bash
npm run dev
# or
bun run dev
```

### Check for errors?
```bash
npm run typecheck  # TypeScript
npm run lint       # ESLint
```

---

## 💡 Pro Tips

1. **Use the success callback** to refresh your invoice list
2. **Store draft data** in localStorage for auto-save
3. **Pre-fill customer data** from previous invoices
4. **Add keyboard shortcuts** for power users
5. **Implement undo/redo** for better UX

---

## 📞 Need More Help?

- 📖 Read: `INVOICE_DRAWER_README.md`
- 💻 Examples: `USAGE_EXAMPLES.md`
- 🎨 Demo: `DEMO_GUIDE.md`
- 📋 Overview: `INVOICE_CREATION_FEATURE.md`

---

**Quick Reference v1.0.0** | Last Updated: Nov 4, 2025

*Print this card and keep it handy!* 📌






