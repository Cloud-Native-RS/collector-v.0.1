import axios, { AxiosInstance } from 'axios';
import { AppError } from '../middleware/error-handler';
import { retry, withTimeout } from '../utils/retry';

export interface InventoryItem {
  productId: string;
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
}

export interface ReserveInventoryRequest {
  items: Array<{
    productId: string;
    sku?: string;
    quantity: number;
  }>;
  orderId: string;
}

export interface ReserveInventoryResponse {
  success: boolean;
  reservedItems: Array<{
    productId: string;
    sku: string;
    quantity: number;
    reservationId: string;
  }>;
}

export class InventoryService {
  private client: AxiosInstance;
  private apiTimeout: number;

  constructor() {
    const baseURL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004';
    this.apiTimeout = parseInt(process.env.API_TIMEOUT || '10000');

    this.client = axios.create({
      baseURL,
      timeout: this.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Validate inventory availability for order items
   */
  async validateInventory(
    items: Array<{ productId: string; sku?: string; quantity: number }>,
    tenantId: string
  ): Promise<{ valid: boolean; unavailableItems?: string[] }> {
    try {
      const response = await retry(
        () => withTimeout(
          this.client.post(
            '/api/inventory/validate',
            { items },
            {
              headers: {
                'x-tenant-id': tenantId,
              },
            }
          ),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Inventory unavailable
        return {
          valid: false,
          unavailableItems: error.response.data.unavailableItems || [],
        };
      }

      throw new AppError(
        `Failed to validate inventory: ${error.message}`,
        503
      );
    }
  }

  /**
   * Reserve inventory for an order
   */
  async reserveInventory(
    request: ReserveInventoryRequest,
    tenantId: string
  ): Promise<ReserveInventoryResponse> {
    try {
      const response = await retry(
        () => withTimeout(
          this.client.post(
            '/api/inventory/reserve',
            request,
            {
              headers: {
                'x-tenant-id': tenantId,
              },
            }
          ),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new AppError(
          `Insufficient inventory: ${error.response.data.message}`,
          409
        );
      }

      throw new AppError(
        `Failed to reserve inventory: ${error.message}`,
        503
      );
    }
  }

  /**
   * Release reserved inventory (e.g., on order cancellation)
   */
  async releaseInventory(orderId: string, tenantId: string): Promise<void> {
    try {
      await retry(
        () => withTimeout(
          this.client.post(
            `/api/inventory/release`,
            { orderId },
            {
              headers: {
                'x-tenant-id': tenantId,
              },
            }
          ),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );
    } catch (error: any) {
      // Log but don't fail cancellation if release fails
      console.error(`Failed to release inventory for order ${orderId}:`, error.message);
    }
  }
}

