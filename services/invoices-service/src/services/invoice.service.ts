import { PrismaClient, Invoice, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../middleware/error-handler';
import { generateSequentialInvoiceNumber } from '../utils/number-generator';
import { calculateLineItemTotal, calculateSubtotal, calculateTaxTotal } from '../utils/calculations';
import axios from 'axios';

export class InvoiceService {
  constructor(private prisma: PrismaClient) {}

  async createFromDeliveryNote(data: any): Promise<Invoice> {
    const { deliveryNoteId, customerId, tenantId, dueDays = 30 } = data;

    // Validate customer exists (call Registry Service) - skip if service unavailable
    if (process.env.REGISTRY_SERVICE_URL) {
      try {
        const customer = await axios.get(
          `${process.env.REGISTRY_SERVICE_URL}/api/customers/${customerId}`,
          { 
            headers: { 'x-tenant-id': tenantId },
            timeout: 2000 // 2 second timeout
          }
        );
        
        if (!customer.data.success) {
          // Customer not found in registry, but continue anyway for development
          console.warn(`Customer ${customerId} not found in registry service, continuing anyway`);
        }
      } catch (error: any) {
        // If registry service is unavailable, continue anyway (for development)
        // In production, you might want to fail here
        if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
          console.warn(`Registry service validation failed for customer ${customerId}, continuing anyway:`, error.message);
        }
      }
    }

    // Generate invoice number
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = generateSequentialInvoiceNumber(count + 1);

    // Calculate due date
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    // Create invoice with line items
    const lineItems = data.lineItems || [];
    
    // Calculate totals
    let subtotal = new Decimal(0);
    let taxTotal = new Decimal(0);

    // Calculate line item totals
    const calculatedLineItems = lineItems.map((item: any) => {
      const totalPrice = calculateLineItemTotal(
        item.quantity,
        item.unitPrice,
        item.discountPercent || 0,
        item.taxPercent || 0
      );
      
      subtotal = subtotal.plus(item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100));
      taxTotal = taxTotal.plus(item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100) * ((item.taxPercent || 0) / 100));
      
      return {
        ...item,
        totalPrice,
      };
    });

    const discountTotal = new Decimal(0); // Can be enhanced
    const grandTotal = subtotal.plus(taxTotal).minus(discountTotal);

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        deliveryNoteId,
        customerId,
        status: 'DRAFT',
        issueDate,
        dueDate,
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        outstandingAmount: grandTotal,
        currency: data.currency || 'USD',
        notes: data.notes,
        tenantId,
        lineItems: {
          create: calculatedLineItems,
        },
      },
      include: {
        lineItems: true,
      },
    });

    return invoice;
  }

  async issue(invoiceId: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status !== 'DRAFT') {
      throw new AppError('Only draft invoices can be issued', 400);
    }

    // Update status to ISSUED
    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'ISSUED' },
      include: { lineItems: true },
    });

    // Emit invoice.issued event
    // TODO: Emit event via NATS

    return updated;
  }

  async getById(id: string, tenantId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        lineItems: true,
        payments: true,
        dunnings: true,
      },
    });
  }

  async getAll(tenantId: string, filters?: any): Promise<Invoice[]> {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.fromDate && filters?.toDate) {
      where.issueDate = {
        gte: new Date(filters.fromDate),
        lte: new Date(filters.toDate),
      };
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        lineItems: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  async updateStatus(invoiceId: string, tenantId: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.getById(invoiceId, tenantId);
    
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: { lineItems: true, payments: true },
    });
  }

  async recordPayment(invoiceId: string, tenantId: string, paymentData: any): Promise<any> {
    const invoice = await this.getById(invoiceId, tenantId);
    
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const paymentAmount = new Decimal(paymentData.amount);
    const newPaidAmount = invoice.paidAmount.plus(paymentAmount);
    const newOutstandingAmount = invoice.outstandingAmount.minus(paymentAmount);

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        provider: paymentData.provider,
        amount: paymentAmount,
        currency: paymentData.currency || invoice.currency,
        status: paymentData.status || 'SUCCEEDED',
        transactionId: paymentData.transactionId,
        paymentMethod: paymentData.paymentMethod,
        processedAt: new Date(),
        notes: paymentData.notes,
        tenantId,
      },
    });

    // Update invoice payment status
    let newStatus: InvoiceStatus = invoice.status;

    if (newOutstandingAmount.lte(0)) {
      newStatus = 'PAID';
    } else if (newPaidAmount.gt(0)) {
      newStatus = 'PARTIALLY_PAID';
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount,
        status: newStatus,
      },
    });

    // Emit invoice.paid event
    // TODO: Emit event via NATS

    return {
      payment,
      invoice: await this.getById(invoiceId, tenantId),
    };
  }

  async checkAndUpdateOverdue(tenantId: string): Promise<void> {
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() },
      },
    });

    for (const invoice of overdueInvoices) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });

      // Emit invoice.overdue event
      // TODO: Emit event via NATS
    }
  }

  async cancel(invoiceId: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.getById(invoiceId, tenantId);
    
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.status === 'PAID') {
      throw new AppError('Cannot cancel a paid invoice', 400);
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELED' },
      include: { lineItems: true },
    });
  }

  /**
   * Calculate payment status based on payments
   */
  async calculatePaymentStatus(invoiceId: string): Promise<InvoiceStatus> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: {
            status: 'SUCCEEDED',
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const totalPaid = invoice.payments.reduce((sum: Decimal, payment: any) => {
      return sum.plus(payment.amount);
    }, new Decimal(0));

    if (totalPaid.gte(invoice.grandTotal)) {
      return InvoiceStatus.PAID;
    } else if (totalPaid.gt(0)) {
      return InvoiceStatus.PARTIALLY_PAID;
    } else {
      return InvoiceStatus.ISSUED;
    }
  }
}
