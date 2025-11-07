import type { Offer as ApiOffer } from "../types";
import type { Offer as TemplateOffer, Template, EditorDoc } from "../templates/types";
import { defaultOfferTemplate } from "../config/default-template";

interface CustomerData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
}

export function transformToEditorDoc(text?: string | null): EditorDoc | null {
  if (!text) return null;

  const lines = text.split('\n').filter(line => line.trim());
  
  return {
    type: "doc",
    content: lines.map(line => ({
      type: "paragraph",
      content: [{ type: "text", text: line }],
    })),
  };
}

export function transformCustomerToEditorDoc(customer?: CustomerData | null): EditorDoc | null {
  if (!customer) return null;

  const content = [];

  if (customer.name) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: customer.name }],
    });
  }

  if (customer.address) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: customer.address }],
    });
  }

  if (customer.zip || customer.city) {
    content.push({
      type: "paragraph",
      content: [{ 
        type: "text", 
        text: `${customer.zip || ""} ${customer.city || ""}`.trim() 
      }],
    });
  }

  if (customer.country) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: customer.country }],
    });
  }

  if (customer.email) {
    content.push({
      type: "paragraph",
      content: [{ 
        type: "text", 
        text: customer.email,
        marks: [{ type: "link", attrs: { href: `mailto:${customer.email}` } }]
      }],
    });
  }

  if (customer.phone) {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text: customer.phone }],
    });
  }

  return content.length > 0 ? { type: "doc", content } : null;
}

export function adaptOfferForTemplate(
  apiOffer: Partial<ApiOffer>,
  template?: Partial<Template>,
  customerData?: CustomerData,
  fromData?: CustomerData,
  paymentDetailsText?: string,
  notesText?: string
): TemplateOffer {
  const mergedTemplate: Template = {
    ...defaultOfferTemplate,
    ...template,
  } as Template;

  return {
    id: apiOffer.id || "",
    invoiceNumber: apiOffer.offerNumber || null,
    issueDate: apiOffer.issueDate || new Date().toISOString(),
    dueDate: apiOffer.validUntil || null,
    currency: apiOffer.currency || "USD",
    amount: typeof apiOffer.grandTotal === 'number' ? apiOffer.grandTotal : 
            typeof apiOffer.grandTotal === 'string' ? parseFloat(apiOffer.grandTotal) : null,
    vat: typeof apiOffer.taxTotal === 'number' ? apiOffer.taxTotal :
         typeof apiOffer.taxTotal === 'string' ? parseFloat(apiOffer.taxTotal) : null,
    tax: 0,
    discount: typeof apiOffer.discountTotal === 'number' ? apiOffer.discountTotal :
              typeof apiOffer.discountTotal === 'string' ? parseFloat(apiOffer.discountTotal) : null,
    lineItems: apiOffer.lineItems?.map(item => ({
      name: item.description || "",
      quantity: typeof item.quantity === 'number' ? item.quantity : 
                typeof item.quantity === 'string' ? parseFloat(item.quantity) : 0,
      price: typeof item.unitPrice === 'number' ? item.unitPrice :
             typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : 0,
      productId: item.productId || undefined,
    })) || [],
    customerDetails: transformCustomerToEditorDoc(customerData),
    fromDetails: transformCustomerToEditorDoc(fromData),
    paymentDetails: transformToEditorDoc(paymentDetailsText),
    noteDetails: transformToEditorDoc(notesText || apiOffer.notes),
    customerName: customerData?.name || null,
    template: mergedTemplate,
    token: apiOffer.approvalToken || "",
    status: apiOffer.status === "DRAFT" ? "draft" : 
            apiOffer.status === "APPROVED" ? "paid" : 
            apiOffer.status === "SENT" ? "unpaid" : "draft",
    createdAt: apiOffer.createdAt || new Date().toISOString(),
    updatedAt: apiOffer.updatedAt || null,
    sentAt: null,
    viewedAt: null,
    reminderSentAt: null,
    paidAt: null,
    note: notesText || apiOffer.notes || null,
    internalNote: null,
    filePath: null,
    sentTo: null,
    topBlock: null,
    bottomBlock: null,
    customer: customerData ? {
      name: customerData.name || null,
      email: customerData.email || null,
      website: null,
    } : null,
    customerId: apiOffer.customerId || null,
    team: null,
  };
}

