import axios, { AxiosInstance } from 'axios';
import { AppError } from '../middleware/error-handler';
import { retry, withTimeout } from '../utils/retry';
import { PaymentProvider } from '@prisma/client';

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  paymentMethod?: string;
  paymentToken?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  paymentId: string;
  status: 'succeeded' | 'pending' | 'failed';
  transactionId?: string;
  paymentReference: string;
  last4?: string;
  failureReason?: string;
}

export interface RefundRequest {
  paymentReference: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'succeeded' | 'pending' | 'failed';
  refundAmount: number;
  failureReason?: string;
}

export class PaymentGatewayService {
  private stripeClient: AxiosInstance | null = null;
  private apiTimeout: number;

  constructor() {
    const apiKey = process.env.PAYMENT_GATEWAY_API_KEY;
    const baseURL = process.env.PAYMENT_GATEWAY_URL || 'https://api.stripe.com/v1';
    this.apiTimeout = parseInt(process.env.API_TIMEOUT || '10000');

    if (apiKey) {
      this.stripeClient = axios.create({
        baseURL,
        timeout: this.apiTimeout,
        auth: {
          username: apiKey,
          password: '',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    }
  }

  /**
   * Process payment through payment gateway
   */
  async processPayment(
    provider: PaymentProvider,
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    switch (provider) {
      case 'STRIPE':
        return this.processStripePayment(request);
      case 'PAYPAL':
        return this.processPayPalPayment(request);
      case 'MANUAL':
      case 'BANK_TRANSFER':
        return this.processManualPayment(request);
      default:
        throw new AppError(`Unsupported payment provider: ${provider}`, 400);
    }
  }

  /**
   * Process payment via Stripe
   */
  private async processStripePayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.stripeClient) {
      throw new AppError('Stripe API key not configured', 500);
    }

    try {
      // Create payment intent
      const response = await retry(
        () => withTimeout(
          this.stripeClient!.post('/payment_intents', {
            amount: Math.round(request.amount * 100), // Convert to cents
            currency: request.currency.toLowerCase(),
            payment_method: request.paymentToken,
            confirm: true,
            metadata: {
              orderId: request.orderId,
              customerId: request.customerId,
              ...request.metadata,
            },
          }),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );

      const paymentIntent = response.data;

      return {
        paymentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
        transactionId: paymentIntent.id,
        paymentReference: paymentIntent.id,
        last4: paymentIntent.payment_method?.card?.last4,
        failureReason: paymentIntent.last_payment_error?.message,
      };
    } catch (error: any) {
      throw new AppError(
        `Payment processing failed: ${error.response?.data?.error?.message || error.message}`,
        402
      );
    }
  }

  /**
   * Process payment via PayPal (placeholder - implement actual PayPal integration)
   */
  private async processPayPalPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Placeholder implementation
    // In production, integrate with PayPal SDK
    throw new AppError('PayPal payment processing not yet implemented', 501);
  }

  /**
   * Process manual payment (e.g., bank transfer, cash on delivery)
   */
  private async processManualPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Manual payments are marked as pending
    return {
      paymentId: `manual-${Date.now()}`,
      status: 'pending',
      paymentReference: `MANUAL-${request.orderId}`,
    };
  }

  /**
   * Process refund
   */
  async processRefund(
    provider: PaymentProvider,
    request: RefundRequest
  ): Promise<RefundResponse> {
    switch (provider) {
      case 'STRIPE':
        return this.processStripeRefund(request);
      case 'PAYPAL':
      default:
        throw new AppError(`Refund not supported for provider: ${provider}`, 400);
    }
  }

  /**
   * Process refund via Stripe
   */
  private async processStripeRefund(request: RefundRequest): Promise<RefundResponse> {
    if (!this.stripeClient) {
      throw new AppError('Stripe API key not configured', 500);
    }

    try {
      const refundData: any = {
        payment_intent: request.paymentReference,
      };

      if (request.amount) {
        refundData.amount = Math.round(request.amount * 100); // Convert to cents
      }

      const response = await retry(
        () => withTimeout(
          this.stripeClient!.post('/refunds', refundData),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );

      const refund = response.data;

      return {
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        refundAmount: refund.amount / 100, // Convert from cents
        failureReason: refund.failure_reason,
      };
    } catch (error: any) {
      throw new AppError(
        `Refund processing failed: ${error.response?.data?.error?.message || error.message}`,
        402
      );
    }
  }
}

