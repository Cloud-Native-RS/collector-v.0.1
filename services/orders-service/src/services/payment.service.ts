import { PrismaClient, Payment, PaymentProvider, PaymentTransactionStatus, PaymentStatus, OrderStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { PaymentGatewayService, PaymentRequest, RefundRequest } from '../integrations/payment-gateway.service';
import { OrderService } from './order.service';
import Decimal from 'decimal.js';

export class PaymentService {
  private paymentGateway: PaymentGatewayService;
  private orderService: OrderService;

  constructor(
    private prisma: PrismaClient,
    paymentGateway?: PaymentGatewayService,
    orderService?: OrderService
  ) {
    this.paymentGateway = paymentGateway || new PaymentGatewayService();
    this.orderService = orderService || new OrderService(prisma);
  }

  /**
   * Process payment for an order
   */
  async processPayment(
    orderId: string,
    tenantId: string,
    provider: PaymentProvider,
    amount?: number,
    paymentMethod?: string,
    paymentToken?: string
  ): Promise<Payment> {
    const order = await this.orderService.getById(orderId, tenantId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'CANCELED') {
      throw new AppError('Cannot process payment for canceled order', 400);
    }

    if (order.paymentStatus === 'PAID') {
      throw new AppError('Order is already paid', 400);
    }

    // Determine payment amount
    const paymentAmount = amount || Number(order.grandTotal);

    // Ensure payment doesn't exceed order total
    if (paymentAmount > Number(order.grandTotal)) {
      throw new AppError('Payment amount cannot exceed order total', 400);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId,
          provider,
          status: 'PENDING',
          amount: new Decimal(paymentAmount),
          currency: order.currency,
          paymentMethod,
          tenantId,
        },
      });

      try {
        // Process payment through gateway
        const paymentRequest: PaymentRequest = {
          amount: paymentAmount,
          currency: order.currency,
          orderId,
          customerId: order.customerId,
          paymentMethod,
          paymentToken,
          metadata: {
            orderNumber: order.orderNumber,
            tenantId,
          },
        };

        const gatewayResponse = await this.paymentGateway.processPayment(
          provider,
          paymentRequest
        );

        // Update payment with gateway response
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentReference: gatewayResponse.paymentReference,
            transactionId: gatewayResponse.transactionId,
            status: gatewayResponse.status === 'succeeded' ? 'SUCCEEDED' : 'PENDING',
            last4: gatewayResponse.last4,
            processedAt: gatewayResponse.status === 'succeeded' ? new Date() : null,
            failureReason: gatewayResponse.failureReason,
          },
        });

        // Update order payment status
        let orderPaymentStatus: PaymentStatus = 'UNPAID';
        const totalPaid = await this.calculateTotalPaid(orderId, tx);

        if (totalPaid >= Number(order.grandTotal)) {
          orderPaymentStatus = 'PAID';
        } else if (totalPaid > 0) {
          orderPaymentStatus = 'PARTIALLY_REFUNDED'; // Actually partially paid, but enum doesn't have that
        }

        // Check if payment failed
        if (gatewayResponse.status === 'failed') {
          orderPaymentStatus = 'FAILED';
          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'FAILED' },
          });
        } else if (gatewayResponse.status === 'succeeded') {
          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: orderPaymentStatus,
              paymentReference: gatewayResponse.paymentReference,
            },
          });

          // If order was pending and payment succeeded, confirm order
          if (order.status === 'PENDING' && orderPaymentStatus === 'PAID') {
            await this.orderService.updateStatus(orderId, tenantId, 'CONFIRMED', 'Order confirmed after payment');
          }
        }

        return updatedPayment;
      } catch (error: any) {
        // Update payment status to failed
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: error.message,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'FAILED' },
        });

        throw new AppError(`Payment processing failed: ${error.message}`, 402);
      }
    });
  }

  /**
   * Process refund for an order
   */
  async processRefund(
    orderId: string,
    tenantId: string,
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Payment> {
    const order = await this.orderService.getById(orderId, tenantId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        orderId,
        tenantId,
      },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== 'SUCCEEDED') {
      throw new AppError('Can only refund succeeded payments', 400);
    }

    if (!payment.paymentReference) {
      throw new AppError('Payment reference not found', 400);
    }

    return await this.prisma.$transaction(async (tx) => {
      try {
        // Process refund through gateway
        const refundRequest: RefundRequest = {
          paymentReference: payment.paymentReference || '',
          amount,
          reason,
        };

        const refundResponse = await this.paymentGateway.processRefund(
          payment.provider,
          refundRequest
        );

        // Update payment with refund information
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: refundResponse.status === 'succeeded' ? 'REFUNDED' : 'PENDING',
            refundedAt: refundResponse.status === 'succeeded' ? new Date() : null,
            refundAmount: new Decimal(refundResponse.refundAmount),
          },
        });

        // Update order payment status
        const totalPaid = await this.calculateTotalPaid(orderId, tx);
        const totalRefunded = await this.calculateTotalRefunded(orderId, tx);

        let orderPaymentStatus: PaymentStatus;
        if (totalRefunded >= totalPaid) {
          orderPaymentStatus = 'REFUNDED';
        } else if (totalRefunded > 0) {
          orderPaymentStatus = 'PARTIALLY_REFUNDED';
        } else {
          orderPaymentStatus = 'PAID';
        }

        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: orderPaymentStatus },
        });

        return updatedPayment;
      } catch (error: any) {
        throw new AppError(`Refund processing failed: ${error.message}`, 402);
      }
    });
  }

  /**
   * Calculate total paid amount for an order
   */
  private async calculateTotalPaid(orderId: string, tx?: any): Promise<number> {
    const prisma = tx || this.prisma;
    const payments = await prisma.payment.findMany({
      where: {
        orderId,
        status: 'SUCCEEDED',
      },
    });

    return payments.reduce((sum: number, payment: any) => {
      return sum + Number(payment.amount);
    }, 0);
  }

  /**
   * Calculate total refunded amount for an order
   */
  private async calculateTotalRefunded(orderId: string, tx?: any): Promise<number> {
    const prisma = tx || this.prisma;
    const payments = await prisma.payment.findMany({
      where: {
        orderId,
        status: 'REFUNDED',
      },
    });

    return payments.reduce((sum: number, payment: any) => {
      return sum + Number(payment.refundAmount || 0);
    }, 0);
  }
}

