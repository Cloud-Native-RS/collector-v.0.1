# Invoice Creation Drawer - Usage Examples

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Integration Examples](#integration-examples)
3. [Customization](#customization)
4. [Advanced Usage](#advanced-usage)
5. [API Integration](#api-integration)

## Basic Usage

### Simple Button Trigger

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";

export default function MyPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Create Invoice
      </Button>

      <CreateInvoiceDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
```

### With Success Callback

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";
import { toast } from "sonner";

export default function InvoicePage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    toast.success("Invoice created successfully!");
    // Refresh invoice list or perform other actions
    refreshInvoiceList();
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        New Invoice
      </Button>

      <CreateInvoiceDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

## Integration Examples

### Within a Data Table Page

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";
import { InvoiceDataTable } from "./invoice-data-table";

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    // Trigger table refresh
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage all your invoices in one place
          </p>
        </div>
        <Button onClick={() => setIsDrawerOpen(true)} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Data Table */}
      <InvoiceDataTable key={refreshKey} />

      {/* Drawer */}
      <CreateInvoiceDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

### With React Query

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
  });

  const handleSuccess = () => {
    // Invalidate and refetch invoices
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  return (
    <div>
      <Button onClick={() => setIsDrawerOpen(true)}>
        Create Invoice
      </Button>

      {/* Render invoices list */}
      <div>
        {invoices?.map((invoice) => (
          <div key={invoice.id}>{invoice.invoiceNumber}</div>
        ))}
      </div>

      <CreateInvoiceDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

### Programmatic Opening

```tsx
"use client";

import { useState, useEffect } from "react";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";
import { useSearchParams } from "next/navigation";

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchParams = useSearchParams();

  // Open drawer if URL has ?create=invoice
  useEffect(() => {
    if (searchParams.get("create") === "invoice") {
      setIsDrawerOpen(true);
    }
  }, [searchParams]);

  return (
    <div>
      {/* Page content */}
      
      <CreateInvoiceDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
```

## Customization

### Custom Styling

The drawer inherits theme colors and can be customized through Tailwind classes:

```tsx
// In your global CSS or component
.invoice-drawer-custom {
  /* Custom styles */
}

// You can wrap the drawer in a custom div
<div className="invoice-drawer-custom">
  <CreateInvoiceDrawer {...props} />
</div>
```

### Keyboard Shortcuts

```tsx
"use client";

import { useState, useEffect } from "react";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + I to open invoice drawer
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        setIsDrawerOpen(true);
      }

      // ESC to close
      if (e.key === "Escape" && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <CreateInvoiceDrawer
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
    />
  );
}
```

## Advanced Usage

### With Pre-filled Data

To pre-fill the invoice with data, you'd need to extend the component to accept initial data:

```tsx
// Extended version of invoice-form.tsx
interface InvoiceFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  initialData?: {
    customerName?: string;
    customerEmail?: string;
    lineItems?: LineItem[];
  };
}

export function InvoiceForm({ 
  onCancel, 
  onSuccess, 
  initialData 
}: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems || defaultLineItems
  );
  
  // ... rest of the component
}
```

### Validation with React Hook Form

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const invoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    qty: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1, "At least one line item required"),
});

export function InvoiceFormWithValidation() {
  const form = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      lineItems: [],
    },
  });

  // ... form implementation
}
```

## API Integration

### Saving to Backend

```tsx
"use client";

import { useState } from "react";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";
import { toast } from "sonner";

async function saveInvoice(data: InvoiceData) {
  const response = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to save invoice");
  }

  return response.json();
}

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSuccess = async (invoiceData: InvoiceData) => {
    try {
      const result = await saveInvoice(invoiceData);
      toast.success(`Invoice ${result.invoiceNumber} created!`);
      setIsDrawerOpen(false);
      // Refresh list or redirect
    } catch (error) {
      toast.error("Failed to save invoice");
    }
  };

  return (
    <CreateInvoiceDrawer
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
      onSuccess={handleSuccess}
    />
  );
}
```

### With Loading State

```tsx
"use client";

import { useState } from "react";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSuccess = async () => {
    setIsSaving(true);
    
    try {
      await saveToAPI();
      toast.success("Invoice saved successfully!");
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error("Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CreateInvoiceDrawer
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
      onSuccess={handleSuccess}
      disabled={isSaving}
    />
  );
}
```

### Complete Example with All Features

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, Mail } from "lucide-react";
import { CreateInvoiceDrawer } from "@/app/(app)/sales/invoices/components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ComprehensiveInvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices");
      return res.json();
    },
  });

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully!");
      setIsDrawerOpen(false);
    },
    onError: () => {
      toast.error("Failed to create invoice");
    },
  });

  const handleSuccess = () => {
    // This will be called when form is submitted
    // You can trigger the mutation here
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your invoices
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="lg">
            <Mail className="w-4 h-4 mr-2" />
            Send Batch
          </Button>
          <Button 
            onClick={() => setIsDrawerOpen(true)} 
            size="lg"
            className="font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-6">
          <div className="text-sm text-muted-foreground">Total Invoices</div>
          <div className="text-3xl font-bold mt-2">
            {invoices?.length || 0}
          </div>
        </div>
        {/* Add more stat cards */}
      </div>

      {/* Invoices List */}
      <div className="bg-card border rounded-xl">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading invoices...
          </div>
        ) : invoices?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-xl font-semibold mb-2">No invoices yet</div>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first invoice
            </p>
            <Button onClick={() => setIsDrawerOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Invoice
            </Button>
          </div>
        ) : (
          <div>
            {/* Render invoice list */}
          </div>
        )}
      </div>

      {/* Invoice Creation Drawer */}
      <CreateInvoiceDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

## Tips & Best Practices

1. **State Management**: Keep drawer state in parent component for better control
2. **Data Fetching**: Use React Query or SWR for efficient data management
3. **Validation**: Implement proper form validation before submission
4. **Error Handling**: Always handle API errors gracefully with user feedback
5. **Accessibility**: Ensure keyboard navigation works (ESC to close, Tab to navigate)
6. **Performance**: Memoize expensive calculations in line items
7. **Mobile**: Test on mobile devices - the drawer is responsive
8. **Persistence**: Consider auto-saving drafts to localStorage
9. **Testing**: Write unit tests for calculation logic
10. **Documentation**: Keep this usage guide updated with your customizations

## Common Issues & Solutions

### Issue: Drawer doesn't animate smoothly
**Solution**: Ensure Framer Motion is properly installed and imported

### Issue: Invoice number doesn't increment
**Solution**: Check localStorage is available and not blocked

### Issue: Calculations are incorrect
**Solution**: Verify all numeric inputs are parsed correctly (parseFloat)

### Issue: Drawer content overflows
**Solution**: The drawer has proper scroll handling - check parent containers

---

For more information, see the main [README](./INVOICE_DRAWER_README.md)






