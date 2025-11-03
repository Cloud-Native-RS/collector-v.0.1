import express from 'express';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { hybridIdentityMiddleware, identityMiddleware } from '../middleware/identity.middleware';
import { createOrderSchema, updateOrderStatusSchema, processPaymentSchema, cancelOrderSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';
import { ShippingService } from '../integrations/shipping.service';

const router = express.Router();
const orderService = new OrderService(prisma);
const paymentService = new PaymentService(prisma);
const shippingService = new ShippingService();

// Feature toggle: Use centralized auth from Kong Gateway
// Set USE_KONG_AUTH=true to enable header-based identity (requires Kong Gateway)
// Set USE_KONG_AUTH=false to use legacy JWT verification per service
const USE_KONG_AUTH = process.env.USE_KONG_AUTH === 'true';

if (USE_KONG_AUTH) {
  // New: Use identity from Kong Gateway headers
  // Kong verifies JWT/OIDC and injects X-User-Id, X-Tenant-Id, etc.
  router.use(identityMiddleware({ enabled: true }));
  // Tenant ID comes from identity middleware, but ensure it's set
  router.use((req, res, next) => {
    if (!req.tenantId && req.user?.tenantId) {
      req.tenantId = req.user.tenantId;
    }
    next();
  });
} else {
  // Legacy: Hybrid mode - supports both Kong headers and direct JWT
  // This allows gradual migration: requests via Kong use headers, direct requests use JWT
  router.use(hybridIdentityMiddleware(authMiddleware));
  router.use(tenantMiddleware);
}

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - shippingAddress
 *               - lineItems
 *             properties:
 *               offerId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional offer ID to create order from
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               shippingAddress:
 *                 type: object
 *               lineItems:
 *                 type: array
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or insufficient inventory
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = createOrderSchema.parse(req.body);

    let order;
    if (validatedData.offerId) {
      // Create from offer
      order = await orderService.createFromOffer(
        validatedData.offerId,
        validatedData.shippingAddress,
        tenantId,
        validatedData.notes
      );
    } else {
      // Create directly
      order = await orderService.create(validatedData, tenantId);
    }

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List orders with filters
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELED]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [UNPAID, PAID, REFUNDED, FAILED, PARTIALLY_REFUNDED]
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const filters: any = {
      skip: parseInt(req.query.skip as string) || 0,
      take: parseInt(req.query.take as string) || 50,
    };

    if (req.query.customerId) filters.customerId = req.query.customerId;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const orders = await orderService.list(tenantId, filters);

    res.json({
      success: true,
      data: orders,
      pagination: {
        skip: filters.skip,
        take: filters.take,
        total: orders.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const order = await orderService.getById(id, tenantId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/lookup:
 *   get:
 *     summary: Lookup order by offer ID or order number
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderNumber
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 */
router.get('/lookup', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { offerId, orderNumber } = req.query;

    let order = null;
    if (offerId) {
      order = await orderService.getByOfferId(offerId as string, tenantId);
    } else if (orderNumber) {
      order = await orderService.getByOrderNumber(orderNumber as string, tenantId);
    } else {
      throw new AppError('Either offerId or orderNumber must be provided', 400);
    }

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put('/:id/status', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await orderService.updateStatus(
      id,
      tenantId,
      validatedData.status as any,
      validatedData.notes,
      req.user?.id
    );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order canceled
 */
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const validatedData = cancelOrderSchema.parse(req.body);

    const order = await orderService.cancel(
      id,
      tenantId,
      validatedData.reason,
      req.user?.id
    );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/payment:
 *   post:
 *     summary: Process payment for an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, PAYPAL, MANUAL, BANK_TRANSFER, OTHER]
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               paymentToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/:id/payment', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const validatedData = processPaymentSchema.parse(req.body);

    const payment = await paymentService.processPayment(
      id,
      tenantId,
      validatedData.provider as any,
      validatedData.amount,
      validatedData.paymentMethod,
      validatedData.paymentToken
    );

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}/tracking:
 *   get:
 *     summary: Get order tracking information
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking information
 *       404:
 *         description: Order not found or not shipped
 */
router.get('/:id/tracking', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const order = await orderService.getById(id, tenantId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'SHIPPED' && order.status !== 'DELIVERED') {
      throw new AppError('Order has not been shipped yet', 400);
    }

    // In a real implementation, you'd store tracking numbers in the order
    // For now, this is a placeholder that would integrate with shipping service
    res.json({
      success: true,
      message: 'Tracking information retrieval not yet fully implemented',
      orderId: id,
      status: order.status,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

