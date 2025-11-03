import dotenv from 'dotenv';
import { messageBus } from '../config/message-bus';
import { prisma } from '../config/database';
import { PaymentService } from '../services/payment.service';
import { OrderService } from '../services/order.service';

dotenv.config();

/**
 * Background worker for processing payment events
 * Listens to payment webhook events and updates order status
 */
async function startPaymentWorker() {
  try {
    await messageBus.connect();

    const paymentService = new PaymentService(prisma);
    const orderService = new OrderService(prisma);

    // Subscribe to payment events
    await messageBus.subscribe(
      'payment_events',
      'payment.*',
      async (message: any) => {
        console.log('Processing payment event:', message);

        const { orderId, tenantId, status, paymentReference } = message;

        if (!orderId || !tenantId) {
          console.error('Missing required fields in payment event');
          return;
        }

        try {
          const order = await orderService.getById(orderId, tenantId);
          if (!order) {
            console.error(`Order ${orderId} not found`);
            return;
          }

          // Update payment status based on event
          if (status === 'succeeded') {
            // Payment succeeded - update order status
            await paymentService.processPayment(
              orderId,
              tenantId,
              'STRIPE', // Default, should come from message
              undefined,
              undefined,
              undefined
            );
          } else if (status === 'failed') {
            // Payment failed - mark order as failed
            await orderService.updateStatus(
              orderId,
              tenantId,
              'CANCELED',
              'Payment failed'
            );
          }

          console.log(`Processed payment event for order ${orderId}`);
        } catch (error: any) {
          console.error(`Error processing payment event: ${error.message}`);
          throw error;
        }
      }
    );

    console.log('✅ Payment worker started');
  } catch (error) {
    console.error('Failed to start payment worker:', error);
    process.exit(1);
  }
}

// Start worker
startPaymentWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down payment worker...');
  await messageBus.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down payment worker...');
  await messageBus.close();
  await prisma.$disconnect();
  process.exit(0);
});

