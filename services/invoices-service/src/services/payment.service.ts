import { PrismaClient, Payment, PaymentStatus, PaymentProvider, InvoiceStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { emitInvoicePaid, emitInvoiceOverdue } from '../utils/event-emitter';
import { InvoiceService } from './invoice.service';

export class PaymentService {
  constructor(
    private prisma: PrismaClient,
    private invoiceService: InvoiceService
  ) {}

  /**
   * Record payment received
   */
  async recordPayment(
    invoiceId: string,
    tenantId: string,
    data: {
      provider: PaymentProvider;
      amount: number;
      currency: string;
      transactionId?: string;
      notes?: string;
    }
  ): Promise<Payment> {
    // Verify invoice exists
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        provider: data.provider,
        amount: data.amount,
        currency: data.currency || invoice.currency,
        status: PaymentStatus.SUCCEEDED,
        transactionId: data.transactionId,
        processedAt: new Date(),
        notes: data.notes,
        tenantId,
      },
    });

    // Update invoice payment status
    const newStatus = await this.invoiceService.calculatePaymentStatus(invoiceId);
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    // Emit event if fully paid
    if (newStatus === InvoiceStatus.PAID) {
      await emitInvoicePaid(invoiceId, invoice.customerId, tenantId, data.amount);
    }

    return payment;
  }

  /**
   * Record payment failure
   */
  async recordPaymentFailure(
    invoiceId: string,
    tenantId: string,
    data: {
      provider: PaymentProvider;
      amount: number;
      transactionId?: string;
      notes?: string;
    }
  ): Promise<Payment> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return this.prisma.payment.create({
      data: {
        invoiceId,
        provider: data.provider,
        amount: data.amount,
        currency: invoice.currency,
        status: PaymentStatus.FAILED,
        transactionId: data.transactionId,
        notes: data.notes,
        tenantId,
      },
    });
  }

  /**
   * Get payments for invoice
   */
  async getPaymentsByInvoice(invoiceId: string, tenantId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        invoiceId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get payment by ID
   */
  async getById(id: string, tenantId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        invoice: true,
      },
    });
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, tenantId: string, notes?: string): Promise<Payment> {
    const payment = await this.getById(paymentId, tenantId);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new AppError('Only succeeded payments can be refunded', 400);
    }

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        notes: notes || payment.notes,
      },
    });
  }
}

