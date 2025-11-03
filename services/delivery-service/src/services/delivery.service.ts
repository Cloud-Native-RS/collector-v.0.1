import { PrismaClient, DeliveryNote, DeliveryStatus, DeliveryEventType, DeliveryItem, DeliveryEvent, Carrier } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generateDeliveryNumber } from '../utils/number-generator';
import { EventPublisher } from '../utils/event-publisher';

export type DeliveryNoteWithRelations = DeliveryNote & {
  items: DeliveryItem[];
  events?: DeliveryEvent[];
  carrier?: Carrier | null;
};

export class DeliveryService {
  constructor(
    private prisma: PrismaClient,
    private eventPublisher?: EventPublisher
  ) {}

  async create(data: {
    orderId: string;
    customerId: string;
    deliveryAddressId: string;
    items: Array<{
      productId: string;
      description: string;
      quantity: number;
      unit: string;
    }>;
    tenantId: string;
  }): Promise<DeliveryNoteWithRelations> {
    // Generate unique delivery number
    let deliveryNumber = generateDeliveryNumber();
    while (await this.prisma.deliveryNote.findUnique({ where: { deliveryNumber } })) {
      deliveryNumber = generateDeliveryNumber();
    }

    // Create delivery note with items
    const deliveryNote = await this.prisma.deliveryNote.create({
      data: {
        deliveryNumber,
        orderId: data.orderId,
        customerId: data.customerId,
        deliveryAddressId: data.deliveryAddressId,
        status: 'PENDING',
        tenantId: data.tenantId,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            tenantId: data.tenantId,
          })),
        },
        events: {
          create: {
            eventType: 'CREATED',
            tenantId: data.tenantId,
          },
        },
      },
      include: {
        items: true,
        events: true,
        carrier: true,
      },
    });

    // Emit event
    await this.eventPublisher?.publish('delivery.created', {
      deliveryNoteId: deliveryNote.id,
      orderId: data.orderId,
      customerId: data.customerId,
      tenantId: data.tenantId,
    });

    return deliveryNote;
  }

  async getById(id: string, tenantId: string): Promise<DeliveryNoteWithRelations | null> {
    return this.prisma.deliveryNote.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: true,
        events: {
          orderBy: {
            timestamp: 'desc',
          },
        },
        carrier: true,
      },
    }) as Promise<DeliveryNoteWithRelations | null>;
  }

  async getAll(
    tenantId: string,
    filters?: {
      status?: DeliveryStatus;
      customerId?: string;
      orderId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    skip = 0,
    take = 50
  ): Promise<DeliveryNoteWithRelations[]> {
    const where: any = { tenantId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    return this.prisma.deliveryNote.findMany({
      where,
      skip,
      take,
      include: {
        items: true,
        carrier: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async dispatch(
    id: string,
    tenantId: string,
    carrierId: string
  ): Promise<DeliveryNoteWithRelations> {
    const deliveryNote = await this.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    if (deliveryNote.status !== 'PENDING') {
      throw new AppError(`Cannot dispatch delivery in status: ${deliveryNote.status}`, 400);
    }

    // Update status
    const updated = await this.prisma.deliveryNote.update({
      where: { id },
      data: {
        status: 'DISPATCHED',
        carrierId,
        shippedAt: new Date(),
      },
      include: {
        items: true,
        carrier: true,
        events: true,
      },
    });

    // Create event
    await this.prisma.deliveryEvent.create({
      data: {
        deliveryNoteId: id,
        eventType: 'DISPATCHED',
        tenantId,
      },
    });

    // Emit events
    await this.eventPublisher?.publish('delivery.dispatched', {
      deliveryNoteId: id,
      orderId: deliveryNote.orderId,
      items: deliveryNote.items,
      tenantId,
    });

    return updated;
  }

  async confirm(
    id: string,
    tenantId: string,
    proofOfDeliveryUrl?: string
  ): Promise<DeliveryNoteWithRelations> {
    const deliveryNote = await this.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    if (deliveryNote.status === 'DELIVERED') {
      throw new AppError('Delivery already confirmed', 400);
    }

    // Update status
    const updated = await this.prisma.deliveryNote.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        proofOfDeliveryUrl,
      },
      include: {
        items: true,
        carrier: true,
      },
    });

    // Create event
    await this.prisma.deliveryEvent.create({
      data: {
        deliveryNoteId: id,
        eventType: 'DELIVERED',
        metadata: proofOfDeliveryUrl ? { proofOfDeliveryUrl } : undefined,
        tenantId,
      },
    });

    // Emit event
    await this.eventPublisher?.publish('delivery.confirmed', {
      deliveryNoteId: id,
      orderId: deliveryNote.orderId,
      customerId: deliveryNote.customerId,
      proofOfDeliveryUrl,
      tenantId,
    });

    return updated;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: DeliveryStatus,
    metadata?: any
  ): Promise<DeliveryNoteWithRelations> {
    const deliveryNote = await this.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    // Map status to event type
    const eventTypeMap: Record<DeliveryStatus, DeliveryEventType> = {
      PENDING: 'CREATED',
      DISPATCHED: 'DISPATCHED',
      IN_TRANSIT: 'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
      RETURNED: 'RETURNED',
      CANCELED: 'CANCELED',
    };

    const updated = await this.prisma.deliveryNote.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        carrier: true,
      },
    });

    // Create event
    await this.prisma.deliveryEvent.create({
      data: {
        deliveryNoteId: id,
        eventType: eventTypeMap[status],
        metadata,
        tenantId,
      },
    });

    return updated;
  }

  async updateTrackingNumber(
    id: string,
    tenantId: string,
    trackingNumber: string
  ): Promise<DeliveryNoteWithRelations> {
    const deliveryNote = await this.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    return this.prisma.deliveryNote.update({
      where: { id },
      data: { trackingNumber },
      include: {
        items: true,
        carrier: true,
      },
    });
  }
}

