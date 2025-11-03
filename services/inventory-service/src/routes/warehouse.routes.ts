import express from 'express';
import { WarehouseService } from '../services/warehouse.service';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { warehouseCreateSchema, warehouseUpdateSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const warehouseService = new WarehouseService(prisma);

router.use(tenantMiddleware);

router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = warehouseCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    const warehouse = await warehouseService.create(validatedData);
    res.status(201).json({
      success: true,
      data: warehouse,
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
    const includeStock = req.query.includeStock === 'true';

    const warehouses = await warehouseService.getAll(tenantId, skip, take, includeStock);
    res.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const warehouse = await warehouseService.getById(id, tenantId);
    if (!warehouse) {
      throw new AppError('Warehouse not found', 404);
    }

    res.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = warehouseUpdateSchema.parse(req.body);
    const warehouse = await warehouseService.update(id, tenantId, validatedData);
    res.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await warehouseService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

