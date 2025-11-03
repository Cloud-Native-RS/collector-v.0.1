import express from 'express';
import { ActivityService } from '../services/activity.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { activityCreateSchema, activityUpdateSchema, activityQuerySchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const activityService = new ActivityService(prisma);

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Create a new activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CALL, EMAIL, MEETING, NOTE]
 *               leadId:
 *                 type: string
 *               dealId:
 *                 type: string
 *               taskId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Activity created successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.userId; // From auth middleware if available

    const validatedData = activityCreateSchema.parse({
      ...req.body,
      userId: userId || req.body.userId,
      tenantId,
    });

    const activity = await activityService.create(validatedData);
    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get all activities
 *     tags: [Activities]
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
 *         name: leadId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dealId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const queryParams = activityQuerySchema.parse(req.query);

    const { activities, total } = await activityService.getAll(tenantId, queryParams);
    res.json({
      success: true,
      data: activities,
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
 * /api/activities/{id}:
 *   get:
 *     summary: Get activity by ID
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const activity = await activityService.getById(id, tenantId);
    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Update activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = activityUpdateSchema.parse(req.body);
    const activity = await activityService.update(id, tenantId, validatedData);

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: Delete activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await activityService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

