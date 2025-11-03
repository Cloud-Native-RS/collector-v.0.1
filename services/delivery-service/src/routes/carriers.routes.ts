import express from 'express';
import { CarrierService } from '../services/carrier.service';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { createCarrierSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const carrierService = new CarrierService(prisma);

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/carriers:
 *   post:
 *     summary: Create a new carrier
 *     tags: [Carriers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - apiEndpoint
 *               - trackingUrlTemplate
 *             properties:
 *               name:
 *                 type: string
 *               apiEndpoint:
 *                 type: string
 *                 format: uri
 *               trackingUrlTemplate:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               apiSecret:
 *                 type: string
 *     responses:
 *       201:
 *         description: Carrier created successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = createCarrierSchema.parse({
      ...req.body,
      tenantId,
    });

    const carrier = await carrierService.create(validatedData);
    res.status(201).json({
      success: true,
      data: carrier,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/carriers:
 *   get:
 *     summary: List all carriers
 *     tags: [Carriers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of carriers
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const activeOnly = req.query.activeOnly === 'true';

    const carriers = await carrierService.getAll(tenantId, activeOnly);
    res.json({
      success: true,
      data: carriers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/carriers/{id}:
 *   get:
 *     summary: Get carrier by ID
 *     tags: [Carriers]
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
 *         description: Carrier details
 *       404:
 *         description: Carrier not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const carrier = await carrierService.getById(id, tenantId);
    if (!carrier) {
      throw new AppError('Carrier not found', 404);
    }

    res.json({
      success: true,
      data: carrier,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/carriers/{id}:
 *   put:
 *     summary: Update carrier
 *     tags: [Carriers]
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
 *         description: Carrier updated successfully
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const carrier = await carrierService.update(id, tenantId, req.body);
    res.json({
      success: true,
      data: carrier,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/carriers/{id}:
 *   delete:
 *     summary: Delete carrier
 *     tags: [Carriers]
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
 *         description: Carrier deleted successfully
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await carrierService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Carrier deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

