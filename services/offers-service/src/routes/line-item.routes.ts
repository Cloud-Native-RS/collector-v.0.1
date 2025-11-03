import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { LineItemService } from '../services/line-item.service';
import { AppError } from '../middleware/error-handler';

const router = Router();

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
 * /api/offers/{offerId}/line-items:
 *   post:
 *     summary: Add line item to offer
 *     tags: [Line Items]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:offerId/line-items',
  [
    param('offerId').isUUID(),
    body('description').isString().notEmpty(),
    body('quantity').isFloat({ min: 0.01 }),
    body('unitPrice').isFloat({ min: 0 }),
    body('productId').optional().isUUID(),
    body('discountPercent').optional().isFloat({ min: 0, max: 100 }),
    body('taxPercent').optional().isFloat({ min: 0, max: 100 }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const lineItem = await LineItemService.addLineItem(req.params.offerId, req.body, tenantId);

      res.status(201).json({
        success: true,
        data: lineItem,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{offerId}/line-items/{id}:
 *   put:
 *     summary: Update line item
 *     tags: [Line Items]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:offerId/line-items/:id',
  [
    param('offerId').isUUID(),
    param('id').isUUID(),
    body('description').optional().isString().notEmpty(),
    body('quantity').optional().isFloat({ min: 0.01 }),
    body('unitPrice').optional().isFloat({ min: 0 }),
    body('productId').optional().isUUID(),
    body('discountPercent').optional().isFloat({ min: 0, max: 100 }),
    body('taxPercent').optional().isFloat({ min: 0, max: 100 }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      const lineItem = await LineItemService.updateLineItem(
        req.params.id,
        req.params.offerId,
        req.body,
        tenantId
      );

      res.json({
        success: true,
        data: lineItem,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/offers/{offerId}/line-items/{id}:
 *   delete:
 *     summary: Delete line item
 *     tags: [Line Items]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:offerId/line-items/:id',
  [param('offerId').isUUID(), param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId!;
      await LineItemService.deleteLineItem(req.params.id, req.params.offerId, tenantId);

      res.json({
        success: true,
        message: 'Line item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

