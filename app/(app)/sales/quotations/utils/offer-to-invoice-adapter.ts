import type { Offer, OfferLineItem } from "@/lib/api/offers";
import type { Invoice, LineItem, EditorDoc, Template } from "../invoice/src/types";

/**
 * Adapter function to convert Offer to Invoice format
 * This allows using existing invoice templates for offer rendering
 */
export function adaptOfferToInvoice(offer: Offer): Invoice {
  // Convert line items
  const lineItems: LineItem[] = offer.lineItems.map((item: OfferLineItem) => ({
    name: item.name || item.description,
    quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
    price: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
    unit: item.unit || undefined,
    productId: item.productId || undefined,
  }));

  // Parse JSON fields to EditorDoc
  const parseEditorDoc = (data: any): EditorDoc | null => {
    if (!data) return null;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return data as EditorDoc;
  };

  // Default template configuration
  const defaultTemplate: Template = {
    customerLabel: "Bill To",
    title: "QUOTATION",
    fromLabel: "From",
    invoiceNoLabel: "Quotation No",
    issueDateLabel: "Issue Date",
    dueDateLabel: "Valid Until",
    descriptionLabel: "Description",
    priceLabel: "Price",
    quantityLabel: "Quantity",
    totalLabel: "Total",
    totalSummaryLabel: "Total",
    vatLabel: "VAT",
    subtotalLabel: "Subtotal",
    taxLabel: "Tax",
    discountLabel: "Discount",
    timezone: offer.timezone || "UTC",
    paymentLabel: "Payment Terms",
    noteLabel: "Notes",
    logoUrl: offer.logoUrl || null,
    currency: offer.currency || "USD",
    paymentDetails: null,
    fromDetails: null,
    noteDetails: null,
    dateFormat: offer.dateFormat || "dd.MM.yyyy",
    includeVat: false,
    includeTax: true,
    includeDiscount: true,
    includeDecimals: offer.includeDecimals ?? true,
    includeUnits: offer.includeUnits ?? false,
    includeQr: false,
    taxRate: 0,
    vatRate: 0,
    size: "a4" as const,
    deliveryType: "create" as const,
    locale: offer.locale || "en-US",
  };

  // Merge with offer template if exists
  const template: Template = offer.template 
    ? { ...defaultTemplate, ...(typeof offer.template === 'string' ? JSON.parse(offer.template) : offer.template) }
    : defaultTemplate;

  // Calculate totals
  const subtotal = typeof offer.subtotal === 'string' ? parseFloat(offer.subtotal) : offer.subtotal || 0;
  const taxTotal = typeof offer.taxTotal === 'string' ? parseFloat(offer.taxTotal) : offer.taxTotal || 0;
  const discountTotal = typeof offer.discountTotal === 'string' ? parseFloat(offer.discountTotal) : offer.discountTotal || 0;
  const grandTotal = typeof offer.grandTotal === 'string' ? parseFloat(offer.grandTotal) : offer.grandTotal || 0;

  // Convert to Invoice type
  const invoice: Invoice = {
    id: offer.id,
    dueDate: offer.validUntil,
    invoiceNumber: offer.offerNumber,
    createdAt: offer.createdAt,
    amount: grandTotal,
    currency: offer.currency || "USD",
    lineItems,
    paymentDetails: parseEditorDoc(offer.paymentDetails),
    customerDetails: parseEditorDoc(offer.customerDetails),
    reminderSentAt: null,
    updatedAt: offer.updatedAt,
    note: offer.notes || null,
    internalNote: null,
    paidAt: null,
    vat: 0, // Offers don't have separate VAT calculation
    tax: taxTotal,
    filePath: null,
    status: mapOfferStatusToInvoiceStatus(offer.status),
    viewedAt: offer.viewedAt || null,
    fromDetails: parseEditorDoc(offer.fromDetails),
    issueDate: offer.issueDate,
    sentAt: offer.createdAt, // Use createdAt as approximation
    template,
    noteDetails: parseEditorDoc(offer.noteDetails),
    customerName: offer.customerName || null,
    token: offer.token || "",
    sentTo: offer.sentTo || null,
    discount: discountTotal,
    topBlock: parseEditorDoc(offer.topBlock),
    bottomBlock: parseEditorDoc(offer.bottomBlock),
    customer: null,
    customerId: offer.customerId,
    team: null,
  };

  return invoice;
}

/**
 * Map offer status to invoice status
 */
function mapOfferStatusToInvoiceStatus(
  status: Offer["status"]
): Invoice["status"] {
  const statusMap: Record<Offer["status"], Invoice["status"]> = {
    DRAFT: "draft",
    SENT: "unpaid",
    APPROVED: "unpaid",
    REJECTED: "canceled",
    EXPIRED: "overdue",
    CANCELLED: "canceled",
  };

  return statusMap[status] || "draft";
}

