import express from 'express';
import { LeadService } from '../services/lead.service';
import { ConversionService } from '../services/conversion.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { leadCreateSchema, leadUpdateSchema, leadQuerySchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const leadService = new LeadService(prisma);
const conversionService = new ConversionService(prisma);

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
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
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               source:
 *                 type: string
 *                 enum: [WEBSITE, SOCIAL, EMAIL, CALL, REFERRAL, OTHER]
 *               status:
 *                 type: string
 *                 enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST]
 *               value:
 *                 type: number
 *     responses:
 *       201:
 *         description: Lead created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = leadCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    const lead = await leadService.create(validatedData);
    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Get all leads
 *     tags: [Leads]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [WEBSITE, SOCIAL, EMAIL, CALL, REFERRAL, OTHER]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of leads
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const queryParams = leadQuerySchema.parse(req.query);

    const { leads, total } = await leadService.getAll(tenantId, queryParams);
    res.json({
      success: true,
      data: leads,
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
 * /api/leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Leads]
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
 *         description: Lead details
 *       404:
 *         description: Lead not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const lead = await leadService.getById(id, tenantId);
    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/leads/{id}:
 *   put:
 *     summary: Update lead
 *     tags: [Leads]
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
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *       404:
 *         description: Lead not found
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = leadUpdateSchema.parse(req.body);
    const lead = await leadService.update(id, tenantId, validatedData);

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/leads/{id}:
 *   delete:
 *     summary: Delete lead
 *     tags: [Leads]
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
 *         description: Lead deleted successfully
 *       404:
 *         description: Lead not found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await leadService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/leads/{id}/convert:
 *   post:
 *     summary: Convert lead to customer
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: object
 *               taxId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead converted successfully
 *       404:
 *         description: Lead not found
 */
router.post('/:id/convert', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const authToken = req.headers.authorization?.substring(7); // Extract token from Bearer

    const result = await conversionService.convertLeadToCustomer(
      id,
      tenantId,
      authToken,
      req.body
    );

    res.json({
      success: true,
      data: {
        lead: result.lead,
        customerId: result.customerId,
        customerNumber: result.customerNumber,
      },
      message: 'Lead converted to customer successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

