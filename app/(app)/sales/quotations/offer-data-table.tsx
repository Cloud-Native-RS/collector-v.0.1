"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye } from "lucide-react";
import { format } from "date-fns";
import { offersApi, Offer } from "@/lib/api/offers";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useMemo, useState } from "react";
import { customersApi, type Customer } from "@/lib/api/registry";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap/minimal-tiptap";
import type { Content } from "@tiptap/react";

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning' | 'info'> = {
  DRAFT: "secondary",
  SENT: "info",
  APPROVED: "success",
  REJECTED: "destructive",
  EXPIRED: "warning",
  CANCELLED: "outline",
};

export default function OfferDataTable({ 
  data, 
  loading, 
  onRefresh 
}: { 
  data: Offer[]; 
  loading: boolean; 
  onRefresh: () => void;
}) {
  const [customerNameById, setCustomerNameById] = useState<Record<string, string>>({});
  const [customerDetails, setCustomerDetails] = useState<Record<string, any>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOffer, setPreviewOffer] = useState<Offer | null>(null);

  const uniqueCustomerIds = useMemo(() => Array.from(new Set(data.map((o) => o.customerId).filter(Boolean))), [data]);

  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      if (!uniqueCustomerIds.length) return;
      try {
        const entries = await Promise.all(
          uniqueCustomerIds
            .filter((id) => !(id in customerNameById))
            .map(async (id) => {
              try {
                const res = await customersApi.getById(id);
                const c = res.data as Customer;
                const name = c.type === 'COMPANY'
                  ? (c.companyName || c.customerNumber)
                  : [c.firstName, c.lastName].filter(Boolean).join(' ') || c.customerNumber;
                return [id, name] as const;
              } catch {
                return [id, id] as const;
              }
            })
        );
        if (!cancelled && entries.length) {
          setCustomerNameById((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
        }
      } catch {
        // Silent fail; keep IDs if lookup fails
      }
    }
    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, [uniqueCustomerIds]);

  const openPreview = async (offerId: string) => {
    try {
      setPreviewLoading(true);
      setPreviewOpen(true);
      const res = await offersApi.getById(offerId);
      const offer = res.data;
      setPreviewOffer(offer);
      
      // Load customer details if not already loaded
      if (offer.customerId && !customerDetails[offer.customerId]) {
        try {
          const customerRes = await customersApi.getById(offer.customerId);
          const customer = customerRes.data;
          setCustomerDetails(prev => ({ ...prev, [offer.customerId]: customer }));
        } catch (error) {
          console.error('Failed to load customer details:', error);
        }
      }
    } catch (error: any) {
      toast.error(`Failed to load offer preview: ${error.message}`);
      setPreviewOffer(null);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    return statusColors[status] || "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No offers found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Offer Number</TableHead>
            <TableHead>Customer ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Valid Until</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((offer, index) => (
            <TableRow key={offer.id}>
              <TableCell>
                <div className="text-sm text-muted-foreground">{index + 1}</div>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => openPreview(offer.id)}
                  className="text-muted-foreground hover:text-primary underline-offset-4 hover:underline font-mono text-sm"
                >
                  {offer.offerNumber}
                </button>
              </TableCell>
              <TableCell>{customerNameById[offer.customerId] || offer.customerId}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(offer.status)}>
                  {offer.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(offer.issueDate), "MMM dd, yyyy")}</TableCell>
              <TableCell>{format(new Date(offer.validUntil), "MMM dd, yyyy")}</TableCell>
              <TableCell>
                {offer.currency} {typeof offer.grandTotal === 'string' 
                  ? parseFloat(offer.grandTotal).toFixed(2) 
                  : offer.grandTotal.toFixed(2)}
              </TableCell>
              <TableCell>{offer.version}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPreview(offer.id)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent className="w-[45%] sm:max-w-[45%] overflow-y-auto">
          {/* Always render a title for accessibility, even while loading */}
          <SheetHeader className="sr-only">
            <SheetTitle>Offer Preview</SheetTitle>
          </SheetHeader>
          {previewLoading && (
            <div className="flex items-center justify-center py-6">
              <Spinner className="h-6 w-6" />
            </div>
          )}
          {!previewLoading && previewOffer && (
            <div className="max-w-4xl mx-auto bg-white shadow-lg p-8" style={{ minHeight: '297mm' }}>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-3xl font-bold mb-2">Offer</SheetTitle>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>Offer NO: <span className="font-mono">{previewOffer.offerNumber}</span></div>
                  <div>Issue date: {format(new Date(previewOffer.issueDate), "dd/MM/yyyy")}</div>
                </div>
                <div className="flex justify-end text-sm text-muted-foreground mt-2">
                  <div>Valid until: {format(new Date(previewOffer.validUntil), "dd/MM/yyyy")}</div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold mb-2">From</h3>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">Collector Platform Inc.</div>
                    <div>contact@collector.com</div>
                    <div>+1 234 567 890</div>
                    <div>123 Business Street</div>
                    <div>New York, NY 10001</div>
                    <div>VAT ID: US123456789</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">To</h3>
                  {(() => {
                    const customer = customerDetails[previewOffer.customerId];
                    return (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">
                          {customer?.companyName || 
                           (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : '') ||
                           customerNameById[previewOffer.customerId] || 
                           previewOffer.customerId}
                        </div>
                        {customer?.email && <div>{customer.email}</div>}
                        {customer?.phone && <div>{customer.phone}</div>}
                        {customer?.address && (
                          <>
                            <div>{customer.address.street}</div>
                            <div>{customer.address.city}{customer.address.state ? `, ${customer.address.state}` : ''} {customer.address.zipCode}</div>
                            <div>{customer.address.country}</div>
                          </>
                        )}
                        {customer?.taxId && <div>Tax ID: {customer.taxId}</div>}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-4">
                  {previewOffer.lineItems?.length ? (
                    <div>
                      <div className="text-sm font-medium mb-4">Items</div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewOffer.lineItems.map((li) => (
                            <TableRow key={li.id}>
                              <TableCell>{li.description}</TableCell>
                              <TableCell className="text-right">{typeof li.quantity === 'string' ? parseFloat(li.quantity).toFixed(0) : Number(li.quantity).toFixed(0)}</TableCell>
                              <TableCell className="text-right">{typeof li.unitPrice === 'string' ? parseFloat(li.unitPrice).toFixed(2) : Number(li.unitPrice).toFixed(2)}</TableCell>
                              <TableCell className="text-right">{typeof li.totalPrice === 'string' ? parseFloat(li.totalPrice).toFixed(2) : Number(li.totalPrice).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{previewOffer.currency} {typeof previewOffer.subtotal === 'string' ? parseFloat(previewOffer.subtotal).toFixed(2) : previewOffer.subtotal.toFixed(2)}</span>
                    </div>
                    {parseFloat(typeof previewOffer.discountTotal === 'string' ? previewOffer.discountTotal : previewOffer.discountTotal.toString()) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span>{previewOffer.currency} {typeof previewOffer.discountTotal === 'string' ? parseFloat(previewOffer.discountTotal).toFixed(2) : previewOffer.discountTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {parseFloat(typeof previewOffer.taxTotal === 'string' ? previewOffer.taxTotal : previewOffer.taxTotal.toString()) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>VAT:</span>
                        <span>{previewOffer.currency} {typeof previewOffer.taxTotal === 'string' ? parseFloat(previewOffer.taxTotal).toFixed(2) : previewOffer.taxTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>{previewOffer.currency} {typeof previewOffer.grandTotal === 'string' ? parseFloat(previewOffer.grandTotal).toFixed(2) : previewOffer.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-sm font-medium mb-2">Note</div>
                    <div className="border-2 border-dashed rounded">
                      <MinimalTiptapEditor
                        value={previewOffer.notes || ""}
                        onChange={(value) => {
                          // Update notes if editing is needed
                        }}
                        className="w-full"
                        editorContentClassName="p-4"
                        output="html"
                        placeholder="Add a note..."
                        editable={false}
                      />
                    </div>
                  </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

