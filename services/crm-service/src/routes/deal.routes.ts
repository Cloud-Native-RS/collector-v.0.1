import express from 'express';
import { DealService } from '../services/deal.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { dealCreateSchema, dealUpdateSchema, dealStageUpdateSchema, dealQuerySchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const dealService = new DealService(prisma);

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/deals:
 *   post:
 *     summary: Create a new deal
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - value
 *             properties:
 *               title:
 *                 type: string
 *               value:
 *                 type: number
 *               leadId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deal created successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = dealCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    // Convert expectedCloseDate from string to Date if provided
    const dealData: Parameters<typeof dealService.create>[0] = {
      ...validatedData,
      expectedCloseDate: validatedData.expectedCloseDate 
        ? (typeof validatedData.expectedCloseDate === 'string' 
            ? new Date(validatedData.expectedCloseDate) 
            : validatedData.expectedCloseDate) as Date
        : undefined,
    };

    const deal = await dealService.create(dealData);
    res.status(201).json({
      success: true,
      data: deal,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deals:
 *   get:
 *     summary: Get all deals
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of deals
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const queryParams = dealQuerySchema.parse(req.query);

    const { deals, total } = await dealService.getAll(tenantId, queryParams);
    res.json({
      success: true,
      data: deals,
      meta: {
        total,
        skip: queryParams.skip,
        take: queryParams.take,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deals/{id}:
 *   get:
 *     summary: Get deal by ID
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const deal = await dealService.getById(id, tenantId);
    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deals/{id}:
 *   put:
 *     summary: Update deal
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = dealUpdateSchema.parse(req.body);

    // Convert expectedCloseDate from string to Date if provided
    const { expectedCloseDate, ...rest } = validatedData;
    const updateData: Parameters<typeof dealService.update>[2] = {
      ...rest,
      ...(expectedCloseDate !== undefined && {
        expectedCloseDate: (typeof expectedCloseDate === 'string'
          ? new Date(expectedCloseDate)
          : expectedCloseDate) as Date,
      }),
    };

    const deal = await dealService.update(id, tenantId, updateData);
    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deals/{id}:
 *   delete:
 *     summary: Delete deal
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await dealService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Deal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/deals/{id}/stage:
 *   put:
 *     summary: Update deal stage
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/stage', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = dealStageUpdateSchema.parse(req.body);
    const deal = await dealService.updateStage(id, tenantId, validatedData.stage, validatedData.lostReason);

    res.json({
      success: true,
      data: deal,
      message: 'Deal stage updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

