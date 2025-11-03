import express from 'express';
import { CustomerService } from '../services/customer.service';
import { CompanyService } from '../services/company.service';
import { prisma } from '../config/database';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const customerService = new CustomerService(prisma);
const companyService = new CompanyService(prisma);

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/lookup/customer:
 *   get:
 *     summary: Lookup customer by tax ID or email
 *     tags: [Lookup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taxId
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer found
 *       404:
 *         description: Customer not found
 */
router.get('/customer', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { taxId, email } = req.query;

    if (!taxId && !email) {
      throw new AppError('Either taxId or email must be provided', 400);
    }

    let customer = null;
    if (taxId) {
      customer = await customerService.lookupByTaxId(taxId as string, tenantId);
    } else if (email) {
      customer = await customerService.lookupByEmail(email as string, tenantId);
    }

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
 * /api/lookup/company:
 *   get:
 *     summary: Lookup company by tax ID or registration number
 *     tags: [Lookup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: taxId
 *         schema:
 *           type: string
 *       - in: query
 *         name: registrationNumber
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company found
 *       404:
 *         description: Company not found
 */
router.get('/company', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { taxId, registrationNumber } = req.query;

    if (!taxId && !registrationNumber) {
      throw new AppError('Either taxId or registrationNumber must be provided', 400);
    }

    let company = null;
    if (taxId) {
      company = await companyService.lookupByTaxId(taxId as string, tenantId);
    } else if (registrationNumber) {
      company = await companyService.lookupByRegistrationNumber(
        registrationNumber as string,
        tenantId
      );
    }

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

export default router;

