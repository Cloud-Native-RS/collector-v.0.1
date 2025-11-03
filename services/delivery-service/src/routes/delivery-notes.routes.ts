import express from 'express';
import multer from 'multer';
import { DeliveryService } from '../services/delivery.service';
import { CarrierService } from '../services/carrier.service';
import { InventorySyncService } from '../services/inventory-sync.service';
import { CarrierFactory } from '../integrations/carrier-factory';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { createDeliveryNoteSchema, updateDeliveryNoteSchema, confirmDeliverySchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';
import { generatePdf } from '../utils/pdf-generator';

const router = express.Router();
const deliveryService = new DeliveryService(prisma);
const carrierService = new CarrierService(prisma);
const inventorySyncService = new InventorySyncService();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/delivery-notes:
 *   post:
 *     summary: Create a new delivery note from a fulfilled order
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - customerId
 *               - deliveryAddressId
 *               - items
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               deliveryAddressId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     unit:
 *                       type: string
 *     responses:
 *       201:
 *         description: Delivery note created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = createDeliveryNoteSchema.parse({
      ...req.body,
      tenantId,
    });

    const deliveryNote = await deliveryService.create(validatedData);
    res.status(201).json({
      success: true,
      data: deliveryNote,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/delivery-notes:
 *   get:
 *     summary: List delivery notes with filters
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, DISPATCHED, IN_TRANSIT, DELIVERED, RETURNED, CANCELED]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: List of delivery notes
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 50;

    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.customerId) filters.customerId = req.query.customerId;
    if (req.query.orderId) filters.orderId = req.query.orderId;
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const deliveryNotes = await deliveryService.getAll(tenantId, filters, skip, take);
    res.json({
      success: true,
      data: deliveryNotes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/delivery-notes/{id}:
 *   get:
 *     summary: Get delivery note by ID
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Delivery note details
 *       404:
 *         description: Delivery note not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const deliveryNote = await deliveryService.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    res.json({
      success: true,
      data: deliveryNote,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/delivery-notes/{id}/dispatch:
 *   put:
 *     summary: Dispatch a delivery note (trigger carrier API and inventory deduction)
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - carrierId
 *             properties:
 *               carrierId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Delivery dispatched successfully
 *       404:
 *         description: Delivery note or carrier not found
 */
router.put('/:id/dispatch', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { carrierId } = req.body;

    if (!carrierId) {
      throw new AppError('Carrier ID is required', 400);
    }

    // Get delivery note
    const deliveryNote = await deliveryService.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    // Get carrier
    const carrier = await carrierService.getById(carrierId, tenantId);
    if (!carrier || !carrier.active) {
      throw new AppError('Carrier not found or inactive', 404);
    }

    // Create shipment via carrier API
    const carrierIntegration = CarrierFactory.create(carrier);
    
    // TODO: Get recipient address from registry service
    const shipmentData = {
      recipientName: 'Customer Name', // Fetch from registry
      recipientAddress: 'Address Line 1', // Fetch from registry
      recipientCity: 'City', // Fetch from registry
      recipientZipCode: '12345', // Fetch from registry
      recipientCountry: 'Country', // Fetch from registry
      items: deliveryNote.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
      })),
    };

    const shipmentResult = await carrierIntegration.createShipment(shipmentData);

    // Update delivery note with tracking number
    await deliveryService.updateTrackingNumber(id, tenantId, shipmentResult.trackingNumber);

    // Deduct inventory
    try {
      await inventorySyncService.deductStock(deliveryNote.items, tenantId);
    } catch (error: any) {
      console.error('Inventory deduction failed:', error);
      // Continue with dispatch even if inventory fails
    }

    // Mark as dispatched
    const dispatched = await deliveryService.dispatch(id, tenantId, carrierId);

    res.json({
      success: true,
      data: dispatched,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/delivery-notes/{id}/confirm:
 *   post:
 *     summary: Confirm delivery with optional proof of delivery
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               proofOfDelivery:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Delivery confirmed successfully
 *       404:
 *         description: Delivery note not found
 */
router.post('/:id/confirm', upload.single('proofOfDelivery'), async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    // Handle file upload
    let proofOfDeliveryUrl: string | undefined;
    if (req.file) {
      // In production, upload to S3 or similar storage
      proofOfDeliveryUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.proofOfDeliveryUrl) {
      proofOfDeliveryUrl = req.body.proofOfDeliveryUrl;
    }

    const confirmed = await deliveryService.confirm(id, tenantId, proofOfDeliveryUrl);

    res.json({
      success: true,
      data: confirmed,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/delivery-notes/{id}/tracking:
 *   get:
 *     summary: Get current tracking information from carrier API
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tracking information
 *       404:
 *         description: Delivery note not found
 */
router.get('/:id/tracking', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const deliveryNote = await deliveryService.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    if (!deliveryNote.trackingNumber || !deliveryNote.carrierId) {
      throw new AppError('Delivery note has no tracking number or carrier', 400);
    }

    const carrier = await carrierService.getById(deliveryNote.carrierId, tenantId);
    if (!carrier) {
      throw new AppError('Carrier not found', 404);
    }

    const carrierIntegration = CarrierFactory.create(carrier);
    const trackingInfo = await carrierIntegration.getTrackingInfo(deliveryNote.trackingNumber);

    res.json({
      success: true,
      data: trackingInfo,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/delivery-notes/{id}/pdf:
 *   get:
 *     summary: Generate and download delivery note PDF
 *     tags: [Delivery Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Delivery note not found
 */
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const deliveryNote = await deliveryService.getById(id, tenantId);
    if (!deliveryNote) {
      throw new AppError('Delivery note not found', 404);
    }

    const pdf = await generatePdf(deliveryNote);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="delivery-note-${deliveryNote.deliveryNumber}.pdf"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

export default router;

