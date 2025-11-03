import * as cron from 'node-cron';
import { PrismaClient, OfferStatus } from '@prisma/client';
import { OfferService } from './offer.service';
import { IntegrationService } from './integration.service';

const prisma = new PrismaClient();
const integrationService = new IntegrationService();

/**
 * Background Job Service
 * Handles scheduled tasks like expiration checks and notifications
 */
export class JobService {
  private expirationTask: cron.ScheduledTask | null = null;

  /**
   * Start all background jobs
   */
  start(): void {
    // Check for expired offers every hour
    this.expirationTask = cron.schedule('0 * * * *', async () => {
      console.log('[Job] Running expiration check...');
      await this.checkExpiredOffers();
    });

    console.log('[Job] Background jobs started');
  }

  /**
   * Stop all background jobs
   */
  stop(): void {
    if (this.expirationTask) {
      this.expirationTask.stop();
      this.expirationTask = null;
    }
    console.log('[Job] Background jobs stopped');
  }

  /**
   * Check for and mark expired offers
   */
  private async checkExpiredOffers(): Promise<void> {
    try {
      const expiredOffers = await prisma.offer.findMany({
        where: {
          status: OfferStatus.SENT,
          validUntil: {
            lt: new Date(),
          },
        },
        include: {
          lineItems: true,
        },
      });

      for (const offer of expiredOffers) {
        await OfferService.markOfferAsExpired(offer.id, offer.tenantId);
        
        // Notify CRM
        await integrationService.publishOfferEvent('offer.expired', offer as any);
        
        console.log(`[Job] Marked offer ${offer.offerNumber} as expired`);
      }

      if (expiredOffers.length > 0) {
        console.log(`[Job] Processed ${expiredOffers.length} expired offers`);
      }
    } catch (error) {
      console.error('[Job] Error checking expired offers:', error);
    }
  }

  /**
   * Manually trigger expiration check (useful for testing)
   */
  async triggerExpirationCheck(): Promise<void> {
    await this.checkExpiredOffers();
  }
}

