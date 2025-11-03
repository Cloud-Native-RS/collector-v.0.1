import express from 'express';
import { InvoiceService } from '../services/invoice.service';
import { AccountingService } from '../services/accounting.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const invoiceService = new InvoiceService(prisma);
const accountingService = new AccountingService();

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Record payment for invoice
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *               - provider
 *             properties:
 *               invoiceId:
 *                 type: string
 *               amount:
 *                 type: number
 *               provider:
 *                 type: string
 *                 enum: [STRIPE, PAYPAL, BANK_TRANSFER, MANUAL]
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment recorded
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const result = await invoiceService.recordPayment(
      req.body.invoiceId,
      tenantId,
      req.body
    );

    // Sync to accounting
    await accountingService.syncPayment(result.payment);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: List payments
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const payments = await prisma.payment.findMany({
      where: { tenantId },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
