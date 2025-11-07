"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { CreateInvoiceDrawer } from "./components/create-invoice-drawer";

export default function InvoicesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none border-b bg-background">
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your invoices
            </p>
          </div>
          <Button
            onClick={() => setIsDrawerOpen(true)}
            size="lg"
            className="h-11 font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">No invoices yet</h2>
            <p className="text-muted-foreground">
              Get started by creating your first invoice
            </p>
          </div>
          <Button
            onClick={() => setIsDrawerOpen(true)}
            size="lg"
            className="h-12 px-8 font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Drawer */}
      <CreateInvoiceDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onSuccess={() => {
          // Handle success
          console.log("Invoice created successfully");
        }}
      />
    </div>
  );
}
