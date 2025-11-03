import express from 'express';
import { DunningService } from '../services/dunning.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const dunningService = new DunningService(prisma);

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/dunnings:
 *   post:
 *     summary: Create dunning for overdue invoice
 *     tags: [Dunnings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *             properties:
 *               invoiceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dunning created
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const dunning = await dunningService.createDunning(req.body.invoiceId, tenantId);

    res.status(201).json({
      success: true,
      data: dunning,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dunnings/process:
 *   post:
 *     summary: Process all overdue invoices
 *     tags: [Dunnings]
 *     responses:
 *       200:
 *         description: Processed dunnings
 */
router.post('/process', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const dunnings = await dunningService.processOverdueInvoices(tenantId);

    res.json({
      success: true,
      data: dunnings,
      message: `Created ${dunnings.length} dunnings`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dunnings/{id}/send:
 *   post:
 *     summary: Send dunning reminder
 *     tags: [Dunnings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Dunning sent
 */
router.post('/:id/send', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const dunning = await dunningService.sendDunning(req.params.id, tenantId);

    res.json({
      success: true,
      data: dunning,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dunnings:
 *   get:
 *     summary: List dunnings
 *     tags: [Dunnings]
 *     responses:
 *       200:
 *         description: List of dunnings
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const dunnings = await dunningService.getAll(tenantId);

    res.json({
      success: true,
      data: dunnings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
