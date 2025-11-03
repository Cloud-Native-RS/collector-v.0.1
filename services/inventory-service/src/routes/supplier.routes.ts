import express from 'express';
import { SupplierService } from '../services/supplier.service';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { supplierCreateSchema, supplierUpdateSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const supplierService = new SupplierService(prisma);

router.use(tenantMiddleware);

router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = supplierCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    const supplier = await supplierService.create(validatedData);
    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error: any) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 50;

    const suppliers = await supplierService.getAll(tenantId, skip, take);
    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const supplier = await supplierService.getById(id, tenantId);
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = supplierUpdateSchema.parse(req.body);
    const supplier = await supplierService.update(id, tenantId, validatedData);
    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await supplierService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

