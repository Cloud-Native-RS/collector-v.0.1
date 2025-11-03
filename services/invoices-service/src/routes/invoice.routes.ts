import express from 'express';
import { InvoiceService } from '../services/invoice.service';
import { AccountingService } from '../services/accounting.service';
import { PDFService } from '../services/pdf.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const invoiceService = new InvoiceService(prisma);
const accountingService = new AccountingService();
const pdfService = new PDFService();

router.use(tenantMiddleware);

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     summary: Create invoice from delivery note
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryNoteId
 *               - customerId
 *               - lineItems
 *             properties:
 *               deliveryNoteId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               companyId:
 *                 type: string
 *               lineItems:
 *                 type: array
 *               dueDays:
 *                 type: number
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await invoiceService.createFromDeliveryNote({
      ...req.body,
      tenantId,
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: List invoices
 *     tags: [Invoices]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const invoices = await invoiceService.getAll(tenantId, req.query);

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await invoiceService.getById(req.params.id, tenantId);

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/invoices/{id}/issue:
 *   post:
 *     summary: Issue invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Invoice issued
 */
router.post('/:id/issue', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await invoiceService.issue(req.params.id, tenantId);

    // Push to accounting system
    try {
      await accountingService.pushInvoice(invoice);
    } catch (error) {
      console.error('Failed to push to accounting:', error);
      // Don't fail the request
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/invoices/{id}/pdf:
 *   get:
 *     summary: Generate PDF invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: PDF invoice
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await invoiceService.getById(req.params.id, tenantId);

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const pdf = await pdfService.generateInvoicePDF(invoice);

    res.contentType('application/pdf');
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/invoices/{id}/accounting:
 *   post:
 *     summary: Push invoice to accounting system
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Pushed to accounting
 */
router.post('/:id/accounting', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await invoiceService.getById(req.params.id, tenantId);

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const result = await accountingService.pushInvoice(invoice);

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
 * /api/invoices/{id}/cancel:
 *   post:
 *     summary: Cancel invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Invoice canceled
 */
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await invoiceService.cancel(req.params.id, tenantId);

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
