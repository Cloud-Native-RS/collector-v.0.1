import express from 'express';
import { ProductService } from '../services/product.service';
import { prisma } from '../index';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { productCreateSchema, productUpdateSchema } from '../utils/validation';
import { AppError } from '../middleware/error-handler';

const router = express.Router();

// Lazy initialization of ProductService to ensure prisma is initialized
let productService: ProductService | null = null;
const getProductService = () => {
  if (!productService) {
    if (!prisma) {
      throw new Error('Prisma client is not initialized');
    }
    productService = new ProductService(prisma);
  }
  return productService;
};

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

router.post('/', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const productService = getProductService();
    const validatedData = productCreateSchema.parse({
      ...req.body,
      tenantId,
    });

    const product = await productService.create(validatedData);
    res.status(201).json({
      success: true,
      data: product,
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
    const category = req.query.category as any;
    const search = req.query.search as string;

    const productService = getProductService();
    const products = await productService.getAll(tenantId, skip, take, { category, search });
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const productService = getProductService();
    const product = await productService.getById(id, tenantId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sku/:sku', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { sku } = req.params;

    const productService = getProductService();
    const product = await productService.getBySku(sku, tenantId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const productService = getProductService();
    const validatedData = productUpdateSchema.parse(req.body);
    const product = await productService.update(id, tenantId, validatedData);
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const productService = getProductService();
    await productService.delete(id, tenantId);
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

