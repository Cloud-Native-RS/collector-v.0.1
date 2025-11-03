import express from 'express';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { purchaseOrderCreateSchema, purchaseOrderUpdateSchema, purchaseOrderReceiveSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const purchaseOrderService = new PurchaseOrderService(prisma);

router.use(tenantMiddleware);

router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = purchaseOrderCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    // Convert expectedDate string to Date if provided
    const createData = {
      ...validatedData,
      expectedDate: validatedData.expectedDate ? new Date(validatedData.expectedDate) : undefined,
    };

    const po = await purchaseOrderService.create(createData);
    res.status(201).json({
      success: true,
      data: po,
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
    const supplierId = req.query.supplierId as string;
    const status = req.query.status as any;

    const pos = await purchaseOrderService.getAll(tenantId, skip, take, { supplierId, status });
    res.json({
      success: true,
      data: pos,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const po = await purchaseOrderService.getById(id, tenantId);
    if (!po) {
      throw new AppError('Purchase order not found', 404);
    }

    res.json({
      success: true,
      data: po,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = purchaseOrderUpdateSchema.parse(req.body);
    const po = await purchaseOrderService.update(id, tenantId, validatedData);
    res.json({
      success: true,
      data: po,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/receive', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const validatedData = purchaseOrderReceiveSchema.parse({
      ...req.body,
      tenantId,
    });

    const po = await purchaseOrderService.receive(id, tenantId, validatedData);
    res.json({
      success: true,
      data: po,
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const po = await purchaseOrderService.cancel(id, tenantId);
    res.json({
      success: true,
      data: po,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

