import express from 'express';
import { CompanyService } from '../services/company.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { companyCreateSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const companyService = new CompanyService(prisma);

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyType
 *               - legalName
 *               - taxId
 *               - registrationNumber
 *             properties:
 *               companyType:
 *                 type: string
 *                 enum: [CORPORATION, LLC, LTD, GMBH, SARL, OTHER]
 *               legalName:
 *                 type: string
 *               tradingName:
 *                 type: string
 *               taxId:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               industry:
 *                 type: string
 *               address:
 *                 type: object
 *               contact:
 *                 type: object
 *               bankAccount:
 *                 type: object
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Validation error or duplicate entry
 */
router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = companyCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    const company = await companyService.create(validatedData);
    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Companies]
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
 *         description: List of companies
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 50;

    const companies = await companyService.getAll(tenantId, skip, take);
    
    // Debug: Check if contacts are included
    if (companies.length > 0) {
      const firstCompany = companies[0];
      console.log(`[CompanyRoutes] First company: ${firstCompany.legalName}`);
      console.log(`[CompanyRoutes] Has contacts property:`, 'contacts' in firstCompany);
      console.log(`[CompanyRoutes] Contacts type:`, typeof firstCompany.contacts);
      console.log(`[CompanyRoutes] Contacts length:`, Array.isArray(firstCompany.contacts) ? firstCompany.contacts.length : 'not an array');
      if (Array.isArray(firstCompany.contacts) && firstCompany.contacts.length > 0) {
        console.log(`[CompanyRoutes] First contact:`, JSON.stringify(firstCompany.contacts[0], null, 2));
      }
    }
    
    res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
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
 *         description: Company details
 *       404:
 *         description: Company not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const company = await companyService.getById(id, tenantId);
    if (!company) {
      throw new AppError('Company not found', 404);
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Update company
 *     tags: [Companies]
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
 *         description: Company updated successfully
 *       404:
 *         description: Company not found
 */
router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const company = await companyService.update(id, tenantId, req.body);
    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Delete company
 *     tags: [Companies]
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
 *         description: Company deleted successfully
 *       404:
 *         description: Company not found
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await companyService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

