/**
 * Event emitter for async communication with other services
 * In production, this would integrate with Kafka/RabbitMQ/NATS
 */

export enum InvoiceEventType {
  INVOICE_ISSUED = 'invoice.issued',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_OVERDUE = 'invoice.overdue',
  INVOICE_CANCELED = 'invoice.canceled',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',
  DUNNING_TRIGGERED = 'dunning.triggered',
}

export interface InvoiceEvent {
  type: InvoiceEventType;
  invoiceId: string;
  customerId: string;
  tenantId: string;
  data: Record<string, any>;
  timestamp: string;
}

class EventEmitter {
  private handlers: Map<string, Array<(event: InvoiceEvent) => Promise<void>>> = new Map();

  /**
   * Register event handler
   */
  on(eventType: InvoiceEventType, handler: (event: InvoiceEvent) => Promise<void>) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Emit event
   */
  async emit(event: InvoiceEvent): Promise<void> {
    console.log(`[Event] ${event.type}`, event);

    // In production, publish to message queue (Kafka/RabbitMQ/NATS)
    if (process.env.MESSAGE_BROKER_URL) {
      // await publishToMessageQueue(event);
    }

    // Call local handlers
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map((handler) => handler(event).catch(console.error)));
  }
}

export const eventEmitter = new EventEmitter();

/**
 * Emit invoice issued event
 */
export async function emitInvoiceIssued(invoiceId: string, customerId: string, tenantId: string, data: Record<string, any>) {
  await eventEmitter.emit({
    type: InvoiceEventType.INVOICE_ISSUED,
    invoiceId,
    customerId,
    tenantId,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit invoice paid event
 */
export async function emitInvoicePaid(invoiceId: string, customerId: string, tenantId: string, amount: number) {
  await eventEmitter.emit({
    type: InvoiceEventType.INVOICE_PAID,
    invoiceId,
    customerId,
    tenantId,
    data: { amount },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit invoice overdue event
 */
export async function emitInvoiceOverdue(invoiceId: string, customerId: string, tenantId: string) {
  await eventEmitter.emit({
    type: InvoiceEventType.INVOICE_OVERDUE,
    invoiceId,
    customerId,
    tenantId,
    data: {},
    timestamp: new Date().toISOString(),
  });
}

