import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { CarrierService } from '../services/carrier.service';
import { DeliveryService } from '../services/delivery.service';
import { CarrierFactory } from '../integrations/carrier-factory';

const prisma = new PrismaClient();
const carrierService = new CarrierService(prisma);
const deliveryService = new DeliveryService(prisma);

/**
 * Polls carrier APIs for tracking updates
 * Runs every 30 minutes
 */
async function pollTrackingUpdates(): Promise<void> {
  console.log('🔄 Polling carrier tracking updates...');

  try {
    // Get all dispatched/in-transit delivery notes
    const deliveryNotes = await prisma.deliveryNote.findMany({
      where: {
        status: {
          in: ['DISPATCHED', 'IN_TRANSIT'],
        },
        trackingNumber: {
          not: null,
        },
        carrierId: {
          not: null,
        },
      },
      include: {
        carrier: true,
        items: true,
      },
      take: 100, // Process in batches
    });

    for (const deliveryNote of deliveryNotes) {
      if (!deliveryNote.carrier || !deliveryNote.trackingNumber) continue;

      try {
        const carrierIntegration = CarrierFactory.create(deliveryNote.carrier);
        const trackingInfo = await carrierIntegration.getTrackingInfo(deliveryNote.trackingNumber);

        // Update status based on carrier tracking
        if (trackingInfo.status.toLowerCase().includes('delivered')) {
          await deliveryService.updateStatus(
            deliveryNote.id,
            deliveryNote.tenantId,
            'DELIVERED',
            trackingInfo
          );
        } else if (trackingInfo.status.toLowerCase().includes('in transit')) {
          await deliveryService.updateStatus(
            deliveryNote.id,
            deliveryNote.tenantId,
            'IN_TRANSIT',
            trackingInfo
          );
        } else if (trackingInfo.status.toLowerCase().includes('returned')) {
          await deliveryService.updateStatus(
            deliveryNote.id,
            deliveryNote.tenantId,
            'RETURNED',
            trackingInfo
          );
        }

        // Store tracking event
        await prisma.deliveryEvent.create({
          data: {
            deliveryNoteId: deliveryNote.id,
            eventType: 'IN_TRANSIT',
            metadata: JSON.parse(JSON.stringify(trackingInfo)) as any,
            tenantId: deliveryNote.tenantId,
          },
        });
      } catch (error) {
        console.error(`Failed to update tracking for ${deliveryNote.trackingNumber}:`, error);
      }
    }

    console.log(`✅ Processed ${deliveryNotes.length} delivery notes`);
  } catch (error) {
    console.error('❌ Error polling tracking updates:', error);
  }
}

// Schedule cron job to run every 30 minutes
cron.schedule('*/30 * * * *', pollTrackingUpdates);

console.log('🚀 Tracking worker started (runs every 30 minutes)');

// Run immediately on startup
pollTrackingUpdates().catch(console.error);

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('Shutting down tracking worker...');
  await prisma.$disconnect();
  process.exit(0);
});

