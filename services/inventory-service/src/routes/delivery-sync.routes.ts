import express from 'express';
import { DeliverySyncService } from '../services/delivery-sync.service';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { deliveryNoteSyncSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const deliverySyncService = new DeliverySyncService(prisma);

router.use(tenantMiddleware);

router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = deliveryNoteSyncSchema.parse({
      ...req.body,
      tenantId,
    });

    const sync = await deliverySyncService.syncDeliveryNote(validatedData);
    res.json({
      success: true,
      data: sync,
    });
  } catch (error: any) {
    next(error);
  }
});

router.get('/note/:deliveryNoteId', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { deliveryNoteId } = req.params;

    const syncs = await deliverySyncService.getDeliverySyncByNoteId(deliveryNoteId, tenantId);
    res.json({
      success: true,
      data: syncs,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/product/:productId', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { productId } = req.params;

    const syncs = await deliverySyncService.getDeliverySyncsByProduct(productId, tenantId);
    res.json({
      success: true,
      data: syncs,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/warehouse/:warehouseId', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { warehouseId } = req.params;

    const syncs = await deliverySyncService.getDeliverySyncsByWarehouse(warehouseId, tenantId);
    res.json({
      success: true,
      data: syncs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

