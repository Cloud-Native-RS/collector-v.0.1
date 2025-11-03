import axios from 'axios';
import { AppError } from '../middleware/error-handler';

interface InventoryDeduction {
  productId: string;
  quantity: number;
  tenantId: string;
}

export class InventorySyncService {
  private inventoryServiceUrl: string;

  constructor() {
    this.inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';
  }

  async deductStock(items: Array<{ productId: string; quantity: number }>, tenantId: string): Promise<void> {
    try {
      const deductions: InventoryDeduction[] = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        tenantId,
      }));

      await axios.post(
        `${this.inventoryServiceUrl}/api/inventory/deduct`,
        { items: deductions },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
          },
          timeout: 10000,
        }
      );
    } catch (error: any) {
      if (error.response) {
        throw new AppError(
          `Inventory service error: ${error.response.data?.message || error.message}`,
          error.response.status || 500
        );
      }
      // If inventory service is unavailable, log but don't fail the dispatch
      console.error('Inventory service unavailable, dispatch continues without deduction:', error.message);
      throw new AppError('Failed to sync with inventory service', 503);
    }
  }

  async reverseDeduction(
    items: Array<{ productId: string; quantity: number }>,
    tenantId: string
  ): Promise<void> {
    try {
      const reversals: InventoryDeduction[] = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        tenantId,
      }));

      await axios.post(
        `${this.inventoryServiceUrl}/api/inventory/restore`,
        { items: reversals },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
          },
          timeout: 10000,
        }
      );
    } catch (error: any) {
      console.error('Failed to reverse inventory deduction:', error.message);
      // Don't throw - reversal failure shouldn't block the operation
    }
  }
}

