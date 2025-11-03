import { PrismaClient, Order, OrderStatus, PaymentStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generateOrderNumber } from '../utils/number-generator';
import { CreateOrderInput } from '../utils/validation';
import { OffersService } from '../integrations/offers.service';
import { InventoryService } from '../integrations/inventory.service';
import { ShippingService } from '../integrations/shipping.service';
import { eventBus, EventType, OrderCreatedEvent, OrderConfirmedEvent } from '../utils/event-bus';
import Decimal from 'decimal.js';

export interface OrderWithRelations extends Order {
  lineItems: Array<{
    id: string;
    productId: string;
    description: string;
    quantity: number;
    unitPrice: any;
    discountPercent: any;
    taxPercent: any;
    totalPrice: any;
    sku: string | null;
  }>;
  shippingAddress: {
    id: string;
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    state: string | null;
    phone: string | null;
    email: string | null;
  };
  payments: Array<any>;
}

export class OrderService {
  private offersService: OffersService;
  private inventoryService: InventoryService;
  private shippingService: ShippingService;

  constructor(
    private prisma: PrismaClient,
    offersService?: OffersService,
    inventoryService?: InventoryService,
    shippingService?: ShippingService
  ) {
    this.offersService = offersService || new OffersService();
    this.inventoryService = inventoryService || new InventoryService();
    this.shippingService = shippingService || new ShippingService();
  }

  /**
   * Create order from approved offer or direct order data
   */
  async createFromOffer(
    offerId: string,
    shippingAddress: CreateOrderInput['shippingAddress'],
    tenantId: string,
    notes?: string
  ): Promise<OrderWithRelations> {
    // Fetch and validate offer
    const offer = await this.offersService.getApprovedOffer(offerId, tenantId);

    // Validate inventory
    const inventoryValidation = await this.inventoryService.validateInventory(
      offer.lineItems.map(item => ({
        productId: item.productId,
        sku: item.sku,
        quantity: item.quantity,
      })),
      tenantId
    );

    if (!inventoryValidation.valid) {
      throw new AppError(
        `Insufficient inventory for products: ${inventoryValidation.unavailableItems?.join(', ')}`,
        409
      );
    }

    // Calculate totals
    const { subtotal, taxTotal, shippingCost, grandTotal, lineItems } =
      this.calculateOrderTotals(offer.lineItems, 'USD');

    // Use transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Generate unique order number
      let orderNumber = generateOrderNumber();
      while (await tx.order.findUnique({ where: { orderNumber } })) {
        orderNumber = generateOrderNumber();
      }

      // Create order first (without shipping address)
      const order = await tx.order.create({
        data: {
          orderNumber,
          offerId,
          customerId: offer.customerId,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          subtotal,
          taxTotal,
          shippingCost,
          discountAmount: new Decimal(0),
          grandTotal,
          currency: offer.currency || 'USD',
          paymentReference: null,
          tenantId,
          notes,
        },
      });

      // Create shipping address with orderId
      const address = await tx.shippingAddress.create({
        data: {
          orderId: order.id,
          fullName: shippingAddress.fullName,
          street: shippingAddress.street,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          state: shippingAddress.state,
          phone: shippingAddress.phone,
          email: shippingAddress.email,
          tenantId,
        },
      });

      // Update order with shipping address relation
      await tx.order.update({
        where: { id: order.id },
        data: { shippingAddress: { connect: { id: address.id } } },
      });

      // Create line items
      for (const item of lineItems) {
        await tx.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            taxPercent: item.taxPercent || 0,
            totalPrice: item.totalPrice,
            sku: item.sku,
            tenantId,
          },
        });
      }

      // Reserve inventory
      await this.inventoryService.reserveInventory(
        {
          items: offer.lineItems.map(item => ({
            productId: item.productId,
            sku: item.sku,
            quantity: item.quantity,
          })),
          orderId: order.id,
        },
        tenantId
      );

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          notes: 'Order created from offer',
          tenantId,
        },
      });

      // Mark offer as used
      await this.offersService.markOfferAsUsed(offerId, order.id, tenantId);

      const createdOrder = await this.getById(order.id, tenantId) as OrderWithRelations;

      // Publish order.created event
      await this.publishOrderCreatedEvent(createdOrder, tenantId, offerId);

      // Auto-confirm if configured
      if (process.env.AUTO_CONFIRM_ORDERS === 'true') {
        await this.updateStatus(order.id, tenantId, 'CONFIRMED');
      }

      return createdOrder;
    });
  }

  /**
   * Create order directly (without offer)
   */
  async create(input: CreateOrderInput, tenantId: string): Promise<OrderWithRelations> {
    // Validate inventory
    const inventoryValidation = await this.inventoryService.validateInventory(
      input.lineItems.map(item => ({
        productId: item.productId,
        sku: item.sku,
        quantity: item.quantity,
      })),
      tenantId
    );

    if (!inventoryValidation.valid) {
      throw new AppError(
        `Insufficient inventory for products: ${inventoryValidation.unavailableItems?.join(', ')}`,
        409
      );
    }

    // Calculate totals
    const { subtotal, taxTotal, shippingCost, grandTotal, lineItems } =
      this.calculateOrderTotals(input.lineItems, input.currency);

    // Calculate shipping cost
    const shippingCostData = await this.shippingService.calculateShippingCost(
      {
        orderId: '', // Will be set after order creation
        address: input.shippingAddress,
        items: input.lineItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
      tenantId
    );

    const finalShippingCost = new Decimal(shippingCostData.cost);

    return await this.prisma.$transaction(async (tx) => {
      let orderNumber = generateOrderNumber();
      while (await tx.order.findUnique({ where: { orderNumber } })) {
        orderNumber = generateOrderNumber();
      }

      // Create order first (without shipping address)
      const order = await tx.order.create({
        data: {
          orderNumber,
          offerId: input.offerId,
          customerId: input.customerId,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          subtotal,
          taxTotal,
          shippingCost: finalShippingCost,
          discountAmount: new Decimal(0),
          grandTotal: grandTotal.plus(finalShippingCost),
          currency: input.currency,
          paymentReference: null,
          tenantId,
          notes: input.notes,
        },
      });

      // Create shipping address with orderId
      const address = await tx.shippingAddress.create({
        data: {
          orderId: order.id,
          fullName: input.shippingAddress.fullName,
          street: input.shippingAddress.street,
          city: input.shippingAddress.city,
          postalCode: input.shippingAddress.postalCode,
          country: input.shippingAddress.country,
          state: input.shippingAddress.state,
          phone: input.shippingAddress.phone,
          email: input.shippingAddress.email,
          tenantId,
        },
      });

      // Update order with shipping address relation
      await tx.order.update({
        where: { id: order.id },
        data: { shippingAddress: { connect: { id: address.id } } },
      });

      for (const item of lineItems) {
        await tx.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            taxPercent: item.taxPercent || 0,
            totalPrice: item.totalPrice,
            sku: item.sku,
            tenantId,
          },
        });
      }

      await this.inventoryService.reserveInventory(
        {
          items: input.lineItems.map(item => ({
            productId: item.productId,
            sku: item.sku,
            quantity: item.quantity,
          })),
          orderId: order.id,
        },
        tenantId
      );

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          notes: 'Order created',
          tenantId,
        },
      });

      const createdOrder = await this.getById(order.id, tenantId) as OrderWithRelations;

      // Publish order.created event
      await this.publishOrderCreatedEvent(createdOrder, tenantId, input.offerId);

      // Auto-confirm if configured
      if (process.env.AUTO_CONFIRM_ORDERS === 'true') {
        await this.updateStatus(order.id, tenantId, 'CONFIRMED');
      }

      return createdOrder;
    });
  }

  /**
   * Get order by ID
   */
  async getById(id: string, tenantId: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lineItems: true,
        shippingAddress: true,
        payments: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    }) as Promise<OrderWithRelations | null>;
  }

  /**
   * Get order by order number
   */
  async getByOrderNumber(orderNumber: string, tenantId: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findFirst({
      where: {
        orderNumber,
        tenantId,
      },
      include: {
        lineItems: true,
        shippingAddress: true,
        payments: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    }) as Promise<OrderWithRelations | null>;
  }

  /**
   * Get order by offer ID
   */
  async getByOfferId(offerId: string, tenantId: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findFirst({
      where: {
        offerId,
        tenantId,
      },
      include: {
        lineItems: true,
        shippingAddress: true,
        payments: true,
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    }) as Promise<OrderWithRelations | null>;
  }

  /**
   * List orders with filters
   */
  async list(
    tenantId: string,
    filters: {
      customerId?: string;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<OrderWithRelations[]> {
    const where: any = { tenantId };

    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        lineItems: true,
        shippingAddress: true,
        payments: true,
      },
      skip: filters.skip || 0,
      take: filters.take || 50,
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<OrderWithRelations[]>;
  }

  /**
   * Update order status
   */
  async updateStatus(
    orderId: string,
    tenantId: string,
    status: OrderStatus,
    notes?: string,
    changedBy?: string
  ): Promise<OrderWithRelations> {
    const order = await this.getById(orderId, tenantId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          lineItems: true,
          shippingAddress: true,
          payments: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          paymentStatus: order.paymentStatus,
          notes,
          changedBy,
          tenantId,
        },
      });

      const updatedOrder = updated as OrderWithRelations;

      // Publish order.confirmed event if status changed to CONFIRMED
      if (status === 'CONFIRMED' && order.status !== 'CONFIRMED') {
        await this.publishOrderConfirmedEvent(updatedOrder, tenantId);
      }

      return updatedOrder;
    });
  }

  /**
   * Cancel order
   */
  async cancel(
    orderId: string,
    tenantId: string,
    reason: string,
    changedBy?: string
  ): Promise<OrderWithRelations> {
    const order = await this.getById(orderId, tenantId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'CANCELED') {
      throw new AppError('Order is already canceled', 400);
    }

    if (order.status === 'DELIVERED') {
      throw new AppError('Cannot cancel delivered order', 400);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Release inventory
      await this.inventoryService.releaseInventory(orderId, tenantId);

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELED',
        },
        include: {
          lineItems: true,
          shippingAddress: true,
          payments: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'CANCELED',
          paymentStatus: order.paymentStatus,
          notes: `Order canceled: ${reason}`,
          changedBy,
          tenantId,
        },
      });

      return updated as OrderWithRelations;
    });
  }

  /**
   * Calculate order totals
   */
  private calculateOrderTotals(
    items: Array<{
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
      taxPercent?: number;
    }>,
    currency: string
  ): {
    subtotal: Decimal;
    taxTotal: Decimal;
    shippingCost: Decimal;
    grandTotal: Decimal;
    lineItems: Array<{
      productId: string;
      description: string;
      quantity: number;
      unitPrice: Decimal;
      discountPercent: Decimal;
      taxPercent: Decimal;
      totalPrice: Decimal;
      sku?: string;
    }>;
  } {
    let subtotal = new Decimal(0);
    let taxTotal = new Decimal(0);

    const lineItems = items.map((item) => {
      const unitPrice = new Decimal(item.unitPrice);
      const quantity = new Decimal(item.quantity);
      const discountPercent = new Decimal(item.discountPercent || 0);
      const taxPercent = new Decimal(item.taxPercent || 0);

      const lineSubtotal = unitPrice.mul(quantity);
      const discountAmount = lineSubtotal.mul(discountPercent).div(100);
      const discountedSubtotal = lineSubtotal.minus(discountAmount);
      const taxAmount = discountedSubtotal.mul(taxPercent).div(100);
      const totalPrice = discountedSubtotal.plus(taxAmount);

      subtotal = subtotal.plus(discountedSubtotal);
      taxTotal = taxTotal.plus(taxAmount);

      return {
        ...item,
        productId: (item as any).productId,
        description: (item as any).description,
        unitPrice,
        discountPercent,
        taxPercent,
        totalPrice,
        sku: (item as any).sku,
      };
    });

    const shippingCost = new Decimal(0); // Will be calculated separately
    const grandTotal = subtotal.plus(taxTotal).plus(shippingCost);

    return {
      subtotal,
      taxTotal,
      shippingCost,
      grandTotal,
      lineItems,
    };
  }

  /**
   * Publish order.created event
   */
  private async publishOrderCreatedEvent(
    order: OrderWithRelations,
    tenantId: string,
    offerId?: string
  ): Promise<void> {
    try {
      await eventBus.connect();
      await eventBus.publish({
        type: EventType.ORDER_CREATED,
        timestamp: new Date().toISOString(),
        tenantId,
        source: 'orders-service',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          status: order.status,
          grandTotal: new Decimal(order.grandTotal).toString(),
          ...((offerId || order.offerId) ? { offerId: (offerId || order.offerId) as string } : {}),
          lineItems: order.lineItems.map(item => ({
            productId: item.productId,
            sku: item.sku || undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice).toString(),
            warehouseId: undefined, // Can be added if available
          })),
          currency: order.currency,
        },
      });
    } catch (error) {
      console.error('Failed to publish order.created event:', error);
      // Don't throw - event failures shouldn't break main flow
    }
  }

  /**
   * Publish order.confirmed event
   */
  private async publishOrderConfirmedEvent(
    order: OrderWithRelations,
    tenantId: string
  ): Promise<void> {
    try {
      if (!order.shippingAddress) {
        console.warn('Cannot publish order.confirmed: order missing shipping address');
        return;
      }

      await eventBus.connect();
      await eventBus.publish({
        type: EventType.ORDER_CONFIRMED,
        timestamp: new Date().toISOString(),
        tenantId,
        source: 'orders-service',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          paymentStatus: order.paymentStatus,
          ...(order.shippingAddress ? { shippingAddressId: order.shippingAddress.id } : {}),
          lineItems: order.lineItems.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice).toString(),
          })),
        },
      });
    } catch (error) {
      console.error('Failed to publish order.confirmed event:', error);
      // Don't throw - event failures shouldn't break main flow
    }
  }
}

