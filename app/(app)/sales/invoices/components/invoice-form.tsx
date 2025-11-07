"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Save, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  vatPercent: number;
}

interface InvoiceFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function InvoiceForm({ onCancel, onSuccess }: InvoiceFormProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      description: "",
      qty: 1,
      unit: "pcs",
      unitPrice: 0,
      discountPercent: 0,
      vatPercent: 20,
    },
  ]);

  // Generate invoice number on mount
  useEffect(() => {
    const lastInvoiceNumber = parseInt(localStorage.getItem("lastInvoiceNumber") || "0");
    const newInvoiceNumber = lastInvoiceNumber + 1;
    setInvoiceNumber(newInvoiceNumber);
  }, []);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      qty: 1,
      unit: "pcs",
      unitPrice: 0,
      discountPercent: 0,
      vatPercent: 20,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateLineAmount = (item: LineItem) => {
    const subtotal = item.qty * item.unitPrice;
    const discountAmount = subtotal * (item.discountPercent / 100);
    return subtotal - discountAmount;
  };

  const calculateTotals = () => {
    let amountBeforeDiscount = 0;
    let totalDiscount = 0;
    let subtotal = 0;
    let vatAmount = 0;

    lineItems.forEach((item) => {
      const itemSubtotal = item.qty * item.unitPrice;
      const itemDiscount = itemSubtotal * (item.discountPercent / 100);
      const itemAmount = itemSubtotal - itemDiscount;
      const itemVat = itemAmount * (item.vatPercent / 100);

      amountBeforeDiscount += itemSubtotal;
      totalDiscount += itemDiscount;
      subtotal += itemAmount;
      vatAmount += itemVat;
    });

    return {
      amountBeforeDiscount,
      totalDiscount,
      subtotal,
      vatAmount,
      total: subtotal + vatAmount,
    };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleSave = () => {
    // Validate that at least one line item has data
    const hasData = lineItems.some(
      (item) => item.description.trim() !== "" && item.qty > 0 && item.unitPrice > 0
    );

    if (!hasData) {
      toast.error("Please add at least one line item with description, quantity, and price");
      return;
    }

    // Increment and save invoice number
    localStorage.setItem("lastInvoiceNumber", invoiceNumber.toString());

    toast.success("Invoice saved successfully!");
    onSuccess();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            {/* Company Logo Placeholder */}
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Create Invoice</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Fill in the details below to generate your invoice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground font-medium">Invoice Number</div>
              <div className="text-lg font-bold tracking-tight">
                INV-{invoiceNumber.toString().padStart(5, "0")}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="customer@example.com"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Button
                onClick={addLineItem}
                variant="outline"
                size="sm"
                className="h-9"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Line
              </Button>
            </div>

            <div className="border rounded-xl overflow-hidden bg-muted/20">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_80px_100px_120px_100px_100px_120px_40px] gap-3 px-4 py-3 bg-muted/50 border-b text-sm font-semibold text-muted-foreground items-center">
                <div className="text-center">#</div>
                <div>Description</div>
                <div className="text-right">Qty</div>
                <div className="text-right">Unit</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Disc %</div>
                <div className="text-right">VAT %</div>
                <div className="text-right">Amount (€)</div>
                <div></div>
              </div>

              {/* Table Body */}
              <div className="divide-y">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[40px_1fr_80px_100px_120px_100px_100px_120px_40px] gap-3 px-4 py-4 bg-background hover:bg-muted/30 transition-colors items-start"
                  >
                    {/* # */}
                    <div className="grid items-center justify-center text-sm font-medium text-muted-foreground">
                      {index + 1}
                    </div>

                    {/* Description */}
                    <div className="grid">
                      <Textarea
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, "description", e.target.value)
                        }
                        placeholder="Enter detailed description..."
                        className="min-h-[100px] resize-none text-sm"
                      />
                    </div>

                    {/* Qty */}
                    <div className="grid items-center">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "qty",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="1"
                        className="h-11 text-right"
                      />
                    </div>

                    {/* Unit */}
                    <div className="grid items-center">
                      <Select
                        value={item.unit}
                        onValueChange={(value) =>
                          updateLineItem(item.id, "unit", value)
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">pcs</SelectItem>
                          <SelectItem value="hrs">hrs</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="m2">m²</SelectItem>
                          <SelectItem value="m3">m³</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unit Price */}
                    <div className="grid items-center">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.01"
                        className="h-11 text-right"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="grid items-center">
                      <Input
                        type="number"
                        value={item.discountPercent}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "discountPercent",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        max="100"
                        step="0.01"
                        className="h-11 text-right"
                      />
                    </div>

                    {/* VAT % */}
                    <div className="grid items-center">
                      <Select
                        value={item.vatPercent.toString()}
                        onValueChange={(value) =>
                          updateLineItem(item.id, "vatPercent", parseFloat(value))
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="13">13%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                          <SelectItem value="25">25%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div className="grid items-center justify-end">
                      <span className="text-sm font-semibold">
                        {formatCurrency(calculateLineAmount(item))}
                      </span>
                    </div>

                    {/* Delete Button */}
                    <div className="grid items-center justify-center">
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(item.id)}
                          className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calculation Section */}
          <div className="grid justify-end">
            <div className="w-full max-w-md grid gap-3 bg-muted/30 rounded-xl p-6 border">
              <div className="grid grid-cols-[1fr_auto] items-center py-2 text-sm gap-4">
                <span className="text-muted-foreground">Amount before discount:</span>
                <span className="font-semibold">
                  {formatCurrency(totals.amountBeforeDiscount)}
                </span>
              </div>
              
              <div className="grid grid-cols-[1fr_auto] items-center py-2 text-sm gap-4">
                <span className="text-muted-foreground">Discount:</span>
                <span className="font-semibold text-destructive">
                  -{formatCurrency(totals.totalDiscount)}
                </span>
              </div>
              
              <div className="border-t pt-3">
                <div className="grid grid-cols-[1fr_auto] items-center py-2 text-sm gap-4">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-[1fr_auto] items-center py-2 text-sm gap-4">
                <span className="text-muted-foreground">VAT Amount:</span>
                <span className="font-semibold">
                  {formatCurrency(totals.vatAmount)}
                </span>
              </div>
              
              <div className="border-t pt-3">
                <div className="grid grid-cols-[1fr_auto] items-center py-3 gap-4">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-8 py-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            size="lg"
            className="min-w-[160px] h-11 font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}




