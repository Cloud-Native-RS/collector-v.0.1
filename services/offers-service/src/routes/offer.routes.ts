import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { OfferService } from '../services/offer.service';
import { LineItemService } from '../services/line-item.service';
import { WorkflowService } from '../services/workflow.service';
import { IntegrationService } from '../services/integration.service';
import { AppError } from '../middleware/error-handler';
import { createOfferSchema, updateOfferSchema, addLineItemSchema, approvalSchema } from '../utils/validation';

const router = Router();
const integrationService = new IntegrationService();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * /api/offers:
 *   post:
 *     summary: Create a new offer
 *     tags: [Offers]
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
 *               - validUntil
 *               - currency
 *               - lineItems
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, RSD, OTHER]
 *               notes:
 *                 type: string
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                       minimum: 0.01
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                     discountPercent:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                     taxPercent:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *     responses:
 *       201:
 *         description: Offer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  [
    body('customerId').isUUID().withMessage('customerId must be a valid UUID'),
    body('validUntil').isISO8601().withMessage('validUntil must be a valid ISO 8601 date'),
    body('currency').isIn(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'RSD', 'OTHER']),
    body('notes').optional().isString(),
    body('lineItems').isArray({ min: 1 }).withMessage('At least one line item is required'),
    body('lineItems.*.description').isString().notEmpty(),
    body('lineItems.*.quantity').isFloat({ min: 0.01 }),
    body('lineItems.*.unitPrice').isFloat({ min: 0 }),
    body('lineItems.*.discountPercent').optional().isFloat({ min: 0, max: 100 }),
    body('lineItems.*.taxPercent').optional().isFloat({ min: 0, max: 100 }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const offer = await OfferService.createOffer(req.body, tenantId);
      
      // Push to CRM (async, non-blocking)
      integrationService.pushOfferToCRM(offer).catch(console.error);

      res.status(201).json({
        success: true,
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{id}:
 *   get:
 *     summary: Get offer by ID
 *     tags: [Offers]
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
 *         description: Offer retrieved successfully
 *       404:
 *         description: Offer not found
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const offer = await OfferService.getOfferById(req.params.id, tenantId);

      if (!offer) {
        return next(new AppError('Offer not found', 404));
      }

      res.json({
        success: true,
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers:
 *   get:
 *     summary: List offers with filters
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CANCELLED]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of offers
 */
router.get(
  '/',
  [
    query('customerId').optional().isUUID(),
    query('status').optional().isIn(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const filters = {
        customerId: req.query.customerId as string | undefined,
        status: req.query.status as any,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await OfferService.listOffers(tenantId, filters);

      res.json({
        success: true,
        data: result.offers,
        meta: {
          total: result.total,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{id}:
 *   put:
 *     summary: Update offer
 *     tags: [Offers]
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
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, RSD, OTHER]
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SENT, APPROVED, REJECTED, EXPIRED, CANCELLED]
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *       404:
 *         description: Offer not found
 */
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('customerId').optional().isUUID(),
    body('validUntil').optional().isISO8601(),
    body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'RSD', 'OTHER']),
    body('notes').optional().isString(),
    body('status').optional().isIn(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED']),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const offer = await OfferService.updateOffer(req.params.id, req.body, tenantId);
      
      // Push to CRM
      integrationService.pushOfferToCRM(offer).catch(console.error);

      res.json({
        success: true,
        data: offer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{id}/send:
 *   post:
 *     summary: Send offer (transition to SENT status)
 *     tags: [Offers]
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
 *         description: Offer sent successfully
 */
router.post(
  '/:id/send',
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      await WorkflowService.sendOffer(req.params.id, tenantId);
      
      const offer = await OfferService.getOfferById(req.params.id, tenantId);
      if (offer) {
        integrationService.pushOfferToCRM(offer).catch(console.error);
        integrationService.publishOfferEvent('offer.sent', offer).catch(console.error);
      }

      res.json({
        success: true,
        message: 'Offer sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{id}/approve:
 *   post:
 *     summary: Approve offer
 *     tags: [Offers]
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
 *               - approverEmail
 *             properties:
 *               approverEmail:
 *                 type: string
 *                 format: email
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer approved successfully
 */
router.post(
  '/:id/approve',
  [
    param('id').isUUID(),
    body('approverEmail').isEmail(),
    body('comments').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      await WorkflowService.approveOffer(req.params.id, req.body, tenantId);
      
      const offer = await OfferService.getOfferById(req.params.id, tenantId);
      if (offer) {
        integrationService.pushOfferToCRM(offer).catch(console.error);
        integrationService.publishOfferEvent('offer.approved', offer).catch(console.error);
      }

      res.json({
        success: true,
        message: 'Offer approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{id}/reject:
 *   post:
 *     summary: Reject offer
 *     tags: [Offers]
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
 *               - approverEmail
 *             properties:
 *               approverEmail:
 *                 type: string
 *                 format: email
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer rejected successfully
 */
router.post(
  '/:id/reject',
  [
    param('id').isUUID(),
    body('approverEmail').isEmail(),
    body('comments').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      await WorkflowService.rejectOffer(req.params.id, req.body, tenantId);
      
      const offer = await OfferService.getOfferById(req.params.id, tenantId);
      if (offer) {
        integrationService.pushOfferToCRM(offer).catch(console.error);
        integrationService.publishOfferEvent('offer.rejected', offer).catch(console.error);
      }

      res.json({
        success: true,
        message: 'Offer rejected successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{id}/clone:
 *   post:
 *     summary: Clone offer into new revision
 *     tags: [Offers]
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
 *       201:
 *         description: Offer cloned successfully
 */
router.post(
  '/:id/clone',
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const newOffer = await OfferService.cloneOffer(req.params.id, tenantId);

      res.status(201).json({
        success: true,
        data: newOffer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/lookup:
 *   get:
 *     summary: Lookup active offers for customer
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: List of offers for customer
 */
router.get(
  '/lookup',
  [
    query('customerId').isUUID(),
    query('activeOnly').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const customerId = req.query.customerId as string;
      const activeOnly = req.query.activeOnly === 'true';

      const offers = await OfferService.getOffersByCustomer(customerId, tenantId, activeOnly);

      res.json({
        success: true,
        data: offers,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

