import express from 'express';
import { StockService } from '../services/stock.service';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { stockAdjustmentSchema, stockReservationSchema, stockCheckSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();
const stockService = new StockService(prisma);

router.use(tenantMiddleware);

router.post('/adjust', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = stockAdjustmentSchema.parse({
      ...req.body,
      tenantId,
    });

    const stock = await stockService.adjust(validatedData);
    res.json({
      success: true,
      data: stock,
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/reserve', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = stockReservationSchema.parse({
      ...req.body,
      tenantId,
    });

    const stock = await stockService.reserve(validatedData);
    res.json({
      success: true,
      data: stock,
    });
  } catch (error: any) {
    next(error);
  }
});

router.post('/unreserve', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = stockReservationSchema.parse({
      ...req.body,
      tenantId,
    });

    const stock = await stockService.unreserve(validatedData);
    res.json({
      success: true,
      data: stock,
    });
  } catch (error: any) {
    next(error);
  }
});

router.get('/check', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const validatedData = stockCheckSchema.parse({
      ...req.query,
      tenantId,
    });

    const availability = await stockService.checkAvailability(
      validatedData.productId,
      validatedData.warehouseId || '',
      tenantId
    );

    if (!availability) {
      throw new AppError('Stock not found', 404);
    }

    res.json({
      success: true,
      data: availability,
    });
  } catch (error: any) {
    next(error);
  }
});

router.get('/product/:productId', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { productId } = req.params;

    const stock = await stockService.getStockByProduct(productId, tenantId);
    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/warehouse/:warehouseId', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { warehouseId } = req.params;

    const stock = await stockService.getStockByWarehouse(warehouseId, tenantId);
    res.json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/low-stock', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const items = await stockService.getLowStockItems(tenantId);
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

