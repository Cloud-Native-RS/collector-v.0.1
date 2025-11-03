/**
 * Event-Driven Integration Types
 * Centralized event type definitions for all microservices
 */

export enum EventType {
  // Offers → Orders
  OFFER_APPROVED = 'offer.approved',
  
  // Orders → Inventory & Delivery
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  
  // Delivery → Inventory & Invoices
  DELIVERY_DISPATCHED = 'delivery.dispatched',
  DELIVERY_CONFIRMED = 'delivery.confirmed',
  
  // Invoices → Accounting & Payment
  INVOICE_ISSUED = 'invoice.issued',
  INVOICE_PAID = 'invoice.paid',
  
  // Inventory → Procurement
  STOCK_LOW = 'stock.low',
  
  // Project Management → HR/Payroll
  TASK_COMPLETED = 'task.completed',
  
  // HR → Project Management & Accounting
  EMPLOYEE_HIRED = 'employee.hired',
  PAYROLL_PROCESSED = 'payroll.processed',
}

/**
 * Base event structure
 */
export interface BaseEvent {
  type: EventType;
  timestamp: string;
  tenantId: string;
  source: string; // Service name that produced the event
  correlationId?: string; // For tracking related events
}

/**
 * Event: offer.approved
 * Producer: Offers Service
 * Consumer: Orders Service
 */
export interface OfferApprovedEvent extends BaseEvent {
  type: EventType.OFFER_APPROVED;
  data: {
    offerId: string;
    offerNumber: string;
    customerId: string;
    validUntil: string;
    currency: string;
    grandTotal: string;
    lineItems: Array<{
      productId?: string;
      description: string;
      quantity: string;
      unitPrice: string;
      discountPercent?: string;
      taxPercent?: string;
    }>;
  };
}

/**
 * Event: order.created
 * Producer: Orders Service
 * Consumer: Inventory Service
 */
export interface OrderCreatedEvent extends BaseEvent {
  type: EventType.ORDER_CREATED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    offerId?: string;
    lineItems: Array<{
      productId: string;
      sku?: string;
      description: string;
      quantity: number;
      unitPrice: string;
      warehouseId?: string; // Preferred warehouse
    }>;
    currency: string;
    grandTotal: string;
  };
}

/**
 * Event: order.confirmed
 * Producer: Orders Service
 * Consumer: Delivery Notes Service
 */
export interface OrderConfirmedEvent extends BaseEvent {
  type: EventType.ORDER_CONFIRMED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    shippingAddressId: string;
    lineItems: Array<{
      productId: string;
      description: string;
      quantity: number;
      unit: string;
    }>;
  };
}

/**
 * Event: delivery.dispatched
 * Producer: Delivery Notes Service
 * Consumer: Inventory Service
 */
export interface DeliveryDispatchedEvent extends BaseEvent {
  type: EventType.DELIVERY_DISPATCHED;
  data: {
    deliveryNoteId: string;
    deliveryNumber: string;
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
      warehouseId: string;
    }>;
    trackingNumber?: string;
    carrierId?: string;
  };
}

/**
 * Event: delivery.confirmed
 * Producer: Delivery Notes Service
 * Consumer: Invoices Service
 */
export interface DeliveryConfirmedEvent extends BaseEvent {
  type: EventType.DELIVERY_CONFIRMED;
  data: {
    deliveryNoteId: string;
    deliveryNumber: string;
    orderId: string;
    customerId: string;
    proofOfDeliveryUrl?: string;
  };
}

/**
 * Event: invoice.issued
 * Producer: Invoices Service
 * Consumer: Accounting Service
 */
export interface InvoiceIssuedEvent extends BaseEvent {
  type: EventType.INVOICE_ISSUED;
  data: {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    orderId?: string;
    deliveryNoteId?: string;
    currency: string;
    subtotal: string;
    taxTotal: string;
    grandTotal: string;
    dueDate: string;
    lineItems: Array<{
      description: string;
      quantity: string;
      unitPrice: string;
      total: string;
    }>;
  };
}

/**
 * Event: invoice.paid
 * Producer: Payment/Invoices Service
 * Consumer: CRM Service
 */
export interface InvoicePaidEvent extends BaseEvent {
  type: EventType.INVOICE_PAID;
  data: {
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    amount: string;
    paymentMethod?: string;
    paymentDate: string;
    currency: string;
  };
}

/**
 * Event: stock.low
 * Producer: Inventory Service
 * Consumer: Procurement Service
 */
export interface StockLowEvent extends BaseEvent {
  type: EventType.STOCK_LOW;
  data: {
    productId: string;
    productName: string;
    sku: string;
    warehouseId: string;
    warehouseName: string;
    currentQuantity: number;
    minimumThreshold: number;
    reorderLevel: number;
  };
}

/**
 * Event: task.completed
 * Producer: Project Management Service
 * Consumer: HR/Payroll Service (optional reporting)
 */
export interface TaskCompletedEvent extends BaseEvent {
  type: EventType.TASK_COMPLETED;
  data: {
    taskId: string;
    taskName: string;
    projectId: string;
    projectName: string;
    assignedResourceId?: string;
    estimatedHours?: number;
    actualHours?: number;
    completedAt: string;
  };
}

/**
 * Event: employee.hired
 * Producer: HR Service
 * Consumer: Project Management Service
 */
export interface EmployeeHiredEvent extends BaseEvent {
  type: EventType.EMPLOYEE_HIRED;
  data: {
    employeeId: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department?: string;
    hireDate: string;
  };
}

/**
 * Event: payroll.processed
 * Producer: HR Service
 * Consumer: Accounting Service
 */
export interface PayrollProcessedEvent extends BaseEvent {
  type: EventType.PAYROLL_PROCESSED;
  data: {
    payrollId: string;
    payrollPeriod: string; // e.g., "2024-01"
    totalAmount: string;
    currency: string;
    employeeCount: number;
    processedAt: string;
  };
}

/**
 * Union type for all events
 */
export type SystemEvent =
  | OfferApprovedEvent
  | OrderCreatedEvent
  | OrderConfirmedEvent
  | DeliveryDispatchedEvent
  | DeliveryConfirmedEvent
  | InvoiceIssuedEvent
  | InvoicePaidEvent
  | StockLowEvent
  | TaskCompletedEvent
  | EmployeeHiredEvent
  | PayrollProcessedEvent;

