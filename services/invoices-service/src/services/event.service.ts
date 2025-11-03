import { connect, NatsConnection, StringCodec } from 'nats';

let nc: NatsConnection | null = null;
const sc = StringCodec();

/**
 * Initialize NATS connection
 */
export async function initNATS(): Promise<void> {
  try {
    const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    
    nc = await connect({ servers: natsUrl });
    console.log(`📨 Connected to NATS at ${natsUrl}`);

    // Handle connection close
    nc.closed().then(() => {
      console.log('📨 NATS connection closed');
    });
  } catch (error) {
    console.error('Failed to connect to NATS:', error);
  }
}

/**
 * Emit an event
 */
export async function emitEvent(subject: string, data: any): Promise<void> {
  if (!nc) {
    console.warn('NATS not connected, skipping event emission');
    return;
  }

  try {
    const payload = JSON.stringify(data);
    nc.publish(subject, sc.encode(payload));
    console.log(`📨 Event published: ${subject}`);
  } catch (error) {
    console.error(`Failed to emit event ${subject}:`, error);
  }
}

/**
 * Subscribe to an event
 */
export async function subscribeEvent(subject: string, handler: (data: any) => void): Promise<void> {
  if (!nc) {
    console.warn('NATS not connected, cannot subscribe to events');
    return;
  }

  try {
    const sub = nc.subscribe(subject);
    
    (async () => {
      for await (const msg of sub) {
        try {
          const data = JSON.parse(sc.decode(msg.data));
          await handler(data);
        } catch (error) {
          console.error(`Error processing event ${subject}:`, error);
        }
      }
    })();

    console.log(`📨 Subscribed to event: ${subject}`);
  } catch (error) {
    console.error(`Failed to subscribe to event ${subject}:`, error);
  }
}

/**
 * Close NATS connection
 */
export async function closeNATS(): Promise<void> {
  if (nc) {
    await nc.close();
  }
}

// Event subjects
export const Events = {
  INVOICE_ISSUED: 'invoice.issued',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',
  INVOICE_CANCELED: 'invoice.canceled',
  DUNNING_CREATED: 'dunning.created',
  DUNNING_SENT: 'dunning.sent',
};

