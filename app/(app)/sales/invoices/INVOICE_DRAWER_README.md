# Invoice Creation Drawer - Documentation

## Overview

A modern, responsive Invoice Creation Page UI built with Next.js 14, TypeScript, TailwindCSS, Shadcn/UI, and Framer Motion. The component appears as a sliding drawer from the right side of the screen with smooth animations.

## Features

### 🎨 Design
- **Geist Font**: Used throughout the interface for modern typography
- **Sliding Drawer**: Smooth slide-in animation from the right using Framer Motion
- **Clean UI**: Minimalistic design inspired by Linear.app and Vercel dashboard
- **Responsive Layout**: Adapts to different screen sizes
- **Soft Shadows & Rounded Corners**: Modern card-based design with subtle elevation

### 🧾 Invoice Table
- **Dynamic Line Items**: Add/remove rows as needed
- **Large Text Areas**: Support for detailed descriptions (300+ characters)
- **Columns**:
  - # (Line number)
  - Description (Textarea with vertical spacing)
  - Qty (Quantity input)
  - Unit (Dropdown: pcs, hrs, kg, m, m², m³, l)
  - Unit Price (Numeric input with 2 decimal places)
  - Disc % (Discount percentage)
  - VAT % (VAT percentage with preset options)
  - Amount (€) (Auto-calculated)
  - Delete button (for each row)

### 💰 Calculation Section
Auto-calculating summary section aligned to the right:
- **Amount before discount**: Sum of all line items before discounts
- **Discount**: Total discount amount (in red)
- **Subtotal**: Amount after discount
- **VAT Amount**: Calculated VAT based on line items
- **Total**: Final amount (bold, larger font, primary color)

### 🔢 Invoice Number
- Auto-incrementing invoice number (format: INV-00001)
- Persisted in localStorage
- Displayed in top-right corner
- Automatically increments with each saved invoice

### ⚙️ Functionality
- **State Management**: React hooks (useState, useEffect)
- **Real-time Calculations**: Automatic updates for all totals
- **Form Validation**: Ensures at least one line item has data
- **Currency Formatting**: EUR with proper decimal places
- **Unit Selection**: Multiple unit types available
- **VAT Presets**: Common VAT percentages (0%, 5%, 10%, 13%, 20%, 25%)

## File Structure

```
app/(app)/sales/invoices/
├── components/
│   ├── create-invoice-drawer.tsx    # Main drawer component with animation
│   ├── invoice-form.tsx              # Form with table and calculations
│   └── index.ts                      # Barrel export
└── page.tsx                          # Demo page
```

## Usage

### Basic Implementation

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateInvoiceDrawer } from "./components/create-invoice-drawer";

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsDrawerOpen(true)}>
        Create Invoice
      </Button>

      <CreateInvoiceDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSuccess={() => {
          console.log("Invoice created successfully");
        }}
      />
    </div>
  );
}
```

## Component Props

### CreateInvoiceDrawer

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Controls drawer visibility |
| `onOpenChange` | `(open: boolean) => void` | Callback when drawer state changes |
| `onSuccess` | `() => void` | Optional callback when invoice is saved |

### InvoiceForm

| Prop | Type | Description |
|------|------|-------------|
| `onCancel` | `() => void` | Callback when cancel button is clicked |
| `onSuccess` | `() => void` | Callback when invoice is saved |

## Styling Details

### Colors & Spacing
- Background: Clean white with subtle gray accents
- Primary Color: Uses theme primary color for emphasis
- Borders: Subtle borders using theme border color
- Spacing: Generous padding (px-8, py-6) for readability
- Rounded Corners: Consistent border-radius (rounded-xl, rounded-2xl)

### Typography
- **Headers**: text-2xl/3xl with font-semibold/bold
- **Labels**: text-sm with font-medium
- **Body Text**: text-sm/base
- **Totals**: text-lg/2xl with font-bold
- **Font**: Geist (already configured in project)

### Animations
- **Drawer Entry**: Spring animation with damping: 30, stiffness: 300
- **Backdrop**: Fade in/out with 0.2s duration
- **Exit**: Smooth slide-out to the right

## Calculations Logic

### Line Item Amount
```
subtotal = qty × unitPrice
discount = subtotal × (discountPercent / 100)
lineAmount = subtotal - discount
```

### Total Calculations
```
amountBeforeDiscount = Σ(qty × unitPrice)
totalDiscount = Σ(subtotal × discountPercent)
subtotal = amountBeforeDiscount - totalDiscount
vatAmount = Σ(lineAmount × vatPercent)
total = subtotal + vatAmount
```

## Technologies Used

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **TailwindCSS**: Utility-first CSS
- **Shadcn/UI**: UI component library
- **Framer Motion (motion)**: Animations
- **Geist Font**: Modern typography
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management
- Screen reader friendly
- Proper semantic HTML

## Performance

- Optimized re-renders with React hooks
- Smooth 60fps animations
- Lazy loading support
- No unnecessary re-calculations
- Efficient state management

## Future Enhancements

- [ ] Save invoice to database/API
- [ ] PDF export functionality
- [ ] Email sending
- [ ] Customer search/autocomplete
- [ ] Product catalog integration
- [ ] Multi-currency support
- [ ] Tax calculation by region
- [ ] Invoice templates
- [ ] Recurring invoices
- [ ] Payment tracking

## Testing Recommendations

1. Test with various screen sizes
2. Verify calculations with different scenarios
3. Test invoice number increment
4. Validate form submission
5. Test animation performance
6. Check browser compatibility
7. Test accessibility with screen readers

## Notes

- Invoice numbers are stored in localStorage for demo purposes
- In production, integrate with backend API for persistence
- Customize VAT rates based on your region
- Add authentication/authorization as needed
- Consider adding audit trail for invoice changes

---

Built with ❤️ using modern web technologies






