import express from 'express';
import { CustomerService } from '../services/customer.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { customerCreateSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const customerService = new CustomerService(prisma);

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
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
 *               - email
 *               - taxId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INDIVIDUAL, COMPANY]
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               taxId:
 *                 type: string
 *               address:
 *                 type: object
 *               contact:
 *                 type: object
 *               bankAccount:
 *                 type: object
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error or duplicate entry
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = customerCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    const customer = await customerService.create(validatedData);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
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
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 50;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;

    const customers = await customerService.getAll(tenantId, skip, take, type, status);
    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const customer = await customerService.getById(id, tenantId);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const customer = await customerService.update(id, tenantId, req.body);
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
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
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await customerService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

