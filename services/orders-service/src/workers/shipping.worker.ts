import dotenv from 'dotenv';
import { messageBus } from '../config/message-bus';
import { prisma } from '../config/database';
import { OrderService } from '../services/order.service';

dotenv.config();

/**
 * Background worker for processing shipping events
 * Listens to shipping status updates and updates order status
 */
async function startShippingWorker() {
  try {
    await messageBus.connect();

    const orderService = new OrderService(prisma);

    // Subscribe to shipping events
    await messageBus.subscribe(
      'shipping_events',
      'shipping.*',
      async (message: any) => {
        console.log('Processing shipping event:', message);

        const { orderId, tenantId, status, trackingNumber } = message;

        if (!orderId || !tenantId) {
          console.error('Missing required fields in shipping event');
          return;
        }

        try {
          const order = await orderService.getById(orderId, tenantId);
          if (!order) {
            console.error(`Order ${orderId} not found`);
            return;
          }

          // Update order status based on shipping event
          switch (status) {
            case 'shipped':
              await orderService.updateStatus(
                orderId,
                tenantId,
                'SHIPPED',
                `Order shipped. Tracking: ${trackingNumber || 'N/A'}`
              );
              break;
            case 'out_for_delivery':
              await orderService.updateStatus(
                orderId,
                tenantId,
                'SHIPPED',
                'Out for delivery'
              );
              break;
            case 'delivered':
              await orderService.updateStatus(
                orderId,
                tenantId,
                'DELIVERED',
                'Order delivered'
              );
              break;
            case 'exception':
              await orderService.updateStatus(
                orderId,
                tenantId,
                'SHIPPED',
                'Shipping exception occurred'
              );
              break;
          }

          console.log(`Processed shipping event for order ${orderId}`);
        } catch (error: any) {
          console.error(`Error processing shipping event: ${error.message}`);
          throw error;
        }
      }
    );

    console.log('✅ Shipping worker started');
  } catch (error) {
    console.error('Failed to start shipping worker:', error);
    process.exit(1);
  }
}

// Start worker
startShippingWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down shipping worker...');
  await messageBus.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down shipping worker...');
  await messageBus.close();
  await prisma.$disconnect();
  process.exit(0);
});

