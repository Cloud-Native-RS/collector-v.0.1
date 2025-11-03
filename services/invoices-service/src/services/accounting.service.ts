import axios from 'axios';

/**
 * Integration with external accounting systems
 */
export class AccountingService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.ACCOUNTING_API_URL || '';
    this.apiKey = process.env.ACCOUNTING_API_KEY || '';
  }

  /**
   * Push invoice to accounting system
   */
  async pushInvoice(invoice: any): Promise<any> {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error('Accounting API credentials not configured');
    }

    try {
      const payload = this.transformInvoiceForAccounting(invoice);

      const response = await axios.post(
        `${this.apiUrl}/api/invoices`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to push invoice to accounting: ${error.message}`);
    }
  }

  /**
   * Transform invoice to accounting system format
   */
  private transformInvoiceForAccounting(invoice: any): any {
    return {
      externalId: invoice.id,
      number: invoice.invoiceNumber,
      customer: {
        id: invoice.customerId,
      },
      date: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status.toLowerCase(),
      currency: invoice.currency,
      items: invoice.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discountPercent,
        taxRate: item.taxPercent,
        total: item.totalPrice,
      })),
      subtotal: invoice.subtotal.toString(),
      tax: invoice.taxTotal.toString(),
      total: invoice.grandTotal.toString(),
      paid: invoice.paidAmount.toString(),
    };
  }

  /**
   * Sync payment to accounting system
   */
  async syncPayment(payment: any): Promise<any> {
    if (!this.apiUrl || !this.apiKey) {
      return; // Skip if not configured
    }

    try {
      const payload = {
        invoiceId: payment.invoiceId,
        amount: payment.amount.toString(),
        currency: payment.currency,
        date: payment.processedAt || new Date(),
        method: payment.paymentMethod,
        reference: payment.transactionId,
      };

      await axios.post(
        `${this.apiUrl}/api/payments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to sync payment to accounting:', error);
      // Don't throw - payment should not fail if accounting sync fails
    }
  }
}
