import { PrismaClient, Product, ProductCategory, UnitOfMeasure } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generateSKU } from '../utils/number-generator';

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    sku: string;
    name: string;
    description?: string;
    unitOfMeasure: UnitOfMeasure;
    price: number;
    taxPercent: number;
    category: ProductCategory;
    tenantId: string;
  }): Promise<Product> {
    // Check for duplicate SKU
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new AppError('Product with this SKU already exists', 400);
    }

    const product = await this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        unitOfMeasure: data.unitOfMeasure,
        price: data.price,
        taxPercent: data.taxPercent,
        category: data.category,
        tenantId: data.tenantId,
      },
    });

    return product;
  }

  async getById(id: string, tenantId: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        stock: {
          include: {
            warehouse: true,
          },
        },
      },
    });
  }

  async getBySku(sku: string, tenantId: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: {
        sku,
        tenantId,
      },
      include: {
        stock: {
          include: {
            warehouse: true,
          },
        },
      },
    });
  }

  async getAll(tenantId: string, skip = 0, take = 50, filters?: {
    category?: ProductCategory;
    search?: string;
  }): Promise<Product[]> {
    if (!this.prisma) {
      if (process.env.NODE_ENV === "development") {
        console.error('ProductService.getAll: prisma client is not initialized');
      }
      throw new AppError('Database connection not available', 500);
    }

    if (!tenantId) {
      throw new AppError('Tenant ID is required', 400);
    }

    const where: Prisma.ProductWhereInput = { tenantId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    try {
      if (!this.prisma.product) {
        if (process.env.NODE_ENV === "development") {
          console.error('ProductService.getAll: prisma.product is undefined');
        }
        throw new AppError('Product model not available', 500);
      }

      const products = await this.prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          stock: {
            include: {
              warehouse: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return products;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (process.env.NODE_ENV === "development") {
        console.error('ProductService.getAll error:', error);
      }
      throw new AppError(`Failed to fetch products: ${errorMessage}`, 500);
    }
  }

  async update(id: string, tenantId: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        taxPercent: data.taxPercent,
        category: data.category,
      },
      include: {
        stock: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    return product;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // Check if product has stock
    const stockCount = await this.prisma.stock.count({
      where: {
        productId: id,
        tenantId,
        quantityAvailable: { gt: 0 },
      },
    });

    if (stockCount > 0) {
      throw new AppError('Cannot delete product with existing stock', 400);
    }

    await this.prisma.product.delete({
      where: { id },
    });
  }

  async getByCategory(category: ProductCategory, tenantId: string, skip = 0, take = 50): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        category,
        tenantId,
      },
      skip,
      take,
      include: {
        stock: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

