"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customersApi, type Customer } from "@/lib/api/registry";
import type { LineItem } from "../types";
import { useCreateOffer, useGenerateOfferToken } from "@/lib/api/offers-hooks";
import { toast } from "sonner";
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap";
import type { Content } from "@tiptap/react";

type OfferEditorProps = {
  onSuccess?: (data?: { offerId: string; token?: string }) => void;
  onCancel?: () => void;
};

export function OfferEditor({ onSuccess, onCancel }: OfferEditorProps) {
  const [offerNumber, setOfferNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", name: "", quantity: 1, price: 0, vat: 20 }
  ]);
  
  // Rich text editor state
  const [notesContent, setNotesContent] = useState<Content>("");
  const [paymentDetailsContent, setPaymentDetailsContent] = useState<Content>("");

  // TanStack Query hooks
  const createOfferMutation = useCreateOffer();
  const generateTokenMutation = useGenerateOfferToken();

  // Format currency
  const formatCurrency = useCallback((amount: number) =>
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await customersApi.list({ status: 'ACTIVE' });
        setCustomers(response.data || []);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

  // Memoized selected customer to avoid multiple find() calls
  const selectedCustomer = useMemo(() =>
    customers.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Memoized calculations
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = lineItems.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      return sum + (itemSubtotal * (item.vat || 0) / 100);
    }, 0);
    const total = subtotal + vat;

    return { subtotal, vat, total };
  }, [lineItems]);

  const calculateSubtotal = useCallback((item: LineItem) => {
    return item.price * item.quantity;
  }, []);

  const addLineItem = useCallback(() => {
    const newId = (Math.max(...lineItems.map(i => parseInt(i.id) || 0)) + 1).toString();
    setLineItems(prev => [
      ...prev,
      { id: newId, name: "", quantity: 1, price: 0, vat: 20 }
    ]);
  }, [lineItems]);

  const removeLineItem = useCallback((id: string) => {
    setLineItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
  }, []);

  const updateLineItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  // Helper to convert TipTap Content to HTML
  const contentToHTML = useCallback((content: Content): string => {
    if (!content) return "";
    if (typeof content === 'string') return content;

    // TipTap content is JSON, extract text from it
    try {
      const jsonContent = typeof content === 'object' ? content : JSON.parse(content as string);

      // Simple text extraction from TipTap JSON structure
      if (jsonContent.type === 'doc' && jsonContent.content) {
        return jsonContent.content
          .map((node: any) => {
            if (node.type === 'paragraph' && node.content) {
              return node.content.map((text: any) => text.text || '').join('');
            }
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }

      return String(content);
    } catch {
      return String(content);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    try {
      // Convert Content to clean text
      const notesText = contentToHTML(notesContent);
      const paymentDetailsText = contentToHTML(paymentDetailsContent);

      // Combine payment details into notes
      const combinedNotes = [
        notesText ? `<div><strong>Notes:</strong><div>${notesText}</div></div>` : "",
        paymentDetailsText ? `<div><strong>Payment Details:</strong><div>${paymentDetailsText}</div></div>` : ""
      ].filter(Boolean).join("") || undefined;

      // Create offer using React Query mutation
      const response = await createOfferMutation.mutateAsync({
        customerId: selectedCustomerId,
        validUntil: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        currency: "EUR" as any,
        notes: combinedNotes,
        lineItems: lineItems.map((item) => ({
          description: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          discountPercent: 0,
          taxPercent: item.vat || 0,
        })),
      });

      if (response.success && response.data) {
        const offerId = response.data.id;
        
        // Generate public token
        let token: string | undefined;
        try {
          const tokenResponse = await generateTokenMutation.mutateAsync(offerId);
          if (tokenResponse.success && tokenResponse.data) {
            token = tokenResponse.data.token;
          }
        } catch (err) {
          console.error("Failed to generate token:", err);
        }

        onSuccess?.({ offerId, token });
      }
    } catch (error) {
      console.error("[Create Offer] Error:", error);
      // Error toast is already handled by the mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto py-8 px-4">
      {/* White invoice paper */}
      <div className="bg-white shadow-sm border rounded-sm p-16 space-y-12">
        {/* Header with Invoice title and details on same line */}
        <div className="space-y-1">
          <h1 className="text-5xl font-bold mb-6">Invoice</h1>
          <div className="text-sm space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[90px]">Invoice No:</span>
              <Input
                value={offerNumber}
                onChange={(e) => setOfferNumber(e.target.value)}
                placeholder="INV-01"
                className="border-none p-0 h-auto w-auto text-sm font-normal focus-visible:ring-0 bg-transparent"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[90px]">Issue date:</span>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="border-none p-0 h-auto w-auto text-sm font-normal focus-visible:ring-0 bg-transparent"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground min-w-[90px]">Due date:</span>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-none p-0 h-auto w-auto text-sm font-normal focus-visible:ring-0 bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* From / To Section */}
        <div className="grid grid-cols-2 gap-20">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold mb-3">From</h3>
            <div className="text-sm space-y-1 text-muted-foreground">
              <Input
                placeholder="Lost island AB"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border-none p-0 h-auto font-semibold text-foreground focus-visible:ring-0 bg-transparent text-sm"
              />
              <Input
                type="email"
                placeholder="Pontus@lostisland.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
              />
              <Input
                placeholder="36182-4441"
                className="border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
              />
              <Textarea
                placeholder="Roslagsgatan 48&#10;211 34 Stockholm, Sweden"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="border-none p-0 h-auto resize-none focus-visible:ring-0 bg-transparent text-sm leading-relaxed"
                rows={2}
              />
              <Input
                placeholder="VAT ID: SE124676767G020"
                className="border-none p-0 h-auto focus-visible:ring-0 bg-transparent text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold mb-3">To</h3>
            <div className="space-y-2">
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
                disabled={loadingCustomers}
              >
                <SelectTrigger className="w-full h-8 border-none bg-muted/30 focus:ring-0 text-sm">
                  <SelectValue placeholder={loadingCustomers ? "Loading..." : "Select customer"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 && !loadingCustomers && (
                    <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                      No customers found
                    </div>
                  )}
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.type === 'COMPANY'
                        ? customer.companyName
                        : `${customer.firstName} ${customer.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className="text-sm text-muted-foreground space-y-1 pt-1">
                  <div className="font-semibold text-foreground">
                    {selectedCustomer.type === 'COMPANY'
                      ? selectedCustomer.companyName
                      : `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                  </div>
                  <div>{selectedCustomer.email}</div>
                  {selectedCustomer.address && (
                    <>
                      <div>{selectedCustomer.address.street}</div>
                      <div>
                        {selectedCustomer.address.city}, {selectedCustomer.address.zipCode}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] items-center pb-2 gap-4">
            <h3 className="text-sm font-semibold">Item</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addLineItem} className="h-7 text-xs -mr-2">
              <PlusIcon className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 pb-2 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide items-center">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-0">
            {lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-center py-3 border-b border-border/50 hover:bg-muted/20 transition-colors group">
                <div className="col-span-1 grid items-center text-xs text-muted-foreground font-medium">{index + 1}</div>
                <div className="col-span-5 grid items-center">
                  <Input
                    value={item.name}
                    onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                    placeholder="Product design"
                    className="border-none p-0 h-auto text-sm focus-visible:ring-0 bg-transparent"
                    required
                  />
                </div>
                <div className="col-span-2 grid items-center justify-center">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="border-none p-0 h-auto text-sm text-center focus-visible:ring-0 bg-transparent w-16"
                    required
                  />
                </div>
                <div className="col-span-2 grid items-center justify-end">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-0.5">
                    <span className="text-xs text-muted-foreground">€</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="border-none p-0 h-auto text-sm text-right focus-visible:ring-0 bg-transparent w-24"
                      required
                    />
                  </div>
                </div>
                <div className="col-span-2 grid grid-cols-[1fr_auto] items-center justify-end gap-4 text-sm font-medium">
                  <span className="text-right">€{formatCurrency(calculateSubtotal(item))}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1}
                    className="h-5 w-5 text-destructive/70 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="grid justify-end pt-6">
            <div className="w-96 grid gap-2 text-sm">
              <div className="grid grid-cols-[1fr_auto] items-center py-2 border-b gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">€{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center py-2 gap-4">
                <span className="text-muted-foreground">VAT (25%)</span>
                <span className="font-medium">€{formatCurrency(calculations.vat)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center pt-4 border-t-2 gap-4">
                <span className="text-base font-bold">Total</span>
                <span className="text-3xl font-bold">€{formatCurrency(calculations.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details and Notes */}
        <div className="grid grid-cols-2 gap-20 pt-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Payment details</h3>
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
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Note</h3>
            <MinimalTiptapEditor
              value={notesContent}
              onChange={setNotesContent}
              placeholder="Add any additional notes with formatting support..."
              className="min-h-[200px] w-full"
              editorContentClassName="p-4"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-10">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="min-w-[120px] h-10">
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            className="min-w-[160px] h-10 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={createOfferMutation.isPending}
          >
            {createOfferMutation.isPending ? "Creating..." : "Create & Send"}
          </Button>
        </div>
      </div>
    </form>
  );
}
