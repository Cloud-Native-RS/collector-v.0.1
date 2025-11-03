/**
 * Dashboard API Client
 * Provides aggregated statistics and data for the collector dashboard
 */

import { createApiClient } from './client';

// Use empty base URL for relative paths - requests will go through Next.js API routes
// This allows the client-side code to make requests that are proxied to the services
const ORDERS_API_URL = '';
const INVOICES_API_URL = '';

const ordersClient = createApiClient(ORDERS_API_URL);
const invoicesClient = createApiClient(INVOICES_API_URL);

export interface DashboardStatistics {
  balance: {
    total: number;
    changePercent: number;
    changeDirection: 'up' | 'down';
  };
  income: {
    total: number;
    changePercent: number;
    changeDirection: 'up' | 'down';
  };
  expense: {
    total: number;
    changePercent: number;
    changeDirection: 'up' | 'down';
  };
  tax: {
    total: number;
    changePercent: number;
    changeDirection: 'up' | 'down';
  };
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusCounts {
  newOrder: number;
  inProgress: number;
  completed: number;
  onHold: number;
  return: number;
}

export interface DashboardOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: number;
  amount: number;
  paymentMethod: string;
  status: 'new-order' | 'in-progress' | 'completed' | 'return' | 'on-hold';
  createdAt: string;
}

export interface BestSellingProduct {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  revenue: number;
  image?: string;
}

/**
 * Calculate statistics from invoices and orders
 */
async function calculateStatistics(
  startDate?: string,
  endDate?: string
): Promise<DashboardStatistics> {
  try {
    // Get invoices for the period
    const invoicesParams = new URLSearchParams();
    if (startDate) invoicesParams.append('fromDate', startDate);
    if (endDate) invoicesParams.append('toDate', endDate);

    // Wrap in try-catch to handle 404 or other API errors gracefully
    let invoices: any[] = [];
    try {
      const response = await invoicesClient.get<any[]>(
        `/api/invoices?${invoicesParams.toString()}`
      );
      invoices = Array.isArray(response) ? response : [];
    } catch (error: any) {
      // If API returns 404 or other error, just use empty array
      // This prevents dashboard from crashing when invoices service is unavailable
      console.warn('Failed to fetch invoices for statistics (this is okay):', error?.message || error);
      invoices = [];
    }

    // Calculate totals
    const currentPeriod = invoices.reduce(
      (acc, inv) => {
        const grandTotal = typeof inv.grandTotal === 'string' ? parseFloat(inv.grandTotal) : inv.grandTotal;
        const taxTotal = typeof inv.taxTotal === 'string' ? parseFloat(inv.taxTotal) : inv.taxTotal;
        const paidAmount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount || 0;

        return {
          income: acc.income + grandTotal,
          expense: acc.expense + (grandTotal - paidAmount),
          tax: acc.tax + (typeof taxTotal === 'string' ? parseFloat(taxTotal) : taxTotal),
        };
      },
      { income: 0, expense: 0, tax: 0 }
    );

    // Get previous period for comparison
    const previousStartDate = startDate 
      ? new Date(new Date(startDate).getTime() - (new Date(endDate || Date.now()).getTime() - new Date(startDate).getTime()))
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousEndDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const prevParams = new URLSearchParams();
    prevParams.append('fromDate', previousStartDate.toISOString().split('T')[0]);
    prevParams.append('toDate', previousEndDate.toISOString().split('T')[0]);

    // Fetch previous period invoices - also handle errors gracefully
    let prevInvoices: any[] = [];
    try {
      const response = await invoicesClient.get<any[]>(
        `/api/invoices?${prevParams.toString()}`
      );
      prevInvoices = Array.isArray(response) ? response : [];
    } catch (error: any) {
      console.warn('Failed to fetch previous period invoices (this is okay):', error?.message || error);
      prevInvoices = [];
    }

    const previousPeriod = prevInvoices.reduce(
      (acc, inv) => {
        const grandTotal = typeof inv.grandTotal === 'string' ? parseFloat(inv.grandTotal) : inv.grandTotal;
        const taxTotal = typeof inv.taxTotal === 'string' ? parseFloat(inv.taxTotal) : inv.taxTotal;
        const paidAmount = typeof inv.paidAmount === 'string' ? parseFloat(inv.paidAmount) : inv.paidAmount || 0;

        return {
          income: acc.income + grandTotal,
          expense: acc.expense + (grandTotal - paidAmount),
          tax: acc.tax + (typeof taxTotal === 'string' ? parseFloat(taxTotal) : taxTotal),
        };
      },
      { income: 0, expense: 0, tax: 0 }
    );

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const incomeChange = calculateChange(currentPeriod.income, previousPeriod.income);
    const expenseChange = calculateChange(currentPeriod.expense, previousPeriod.expense);
    const taxChange = calculateChange(currentPeriod.tax, previousPeriod.tax);

    const balance = currentPeriod.income - currentPeriod.expense;
    const prevBalance = previousPeriod.income - previousPeriod.expense;
    const balanceChange = calculateChange(balance, prevBalance);

    return {
      balance: {
        total: balance,
        changePercent: Math.abs(balanceChange),
        changeDirection: balanceChange >= 0 ? 'up' : 'down',
      },
      income: {
        total: currentPeriod.income,
        changePercent: Math.abs(incomeChange),
        changeDirection: incomeChange >= 0 ? 'up' : 'down',
      },
      expense: {
        total: currentPeriod.expense,
        changePercent: Math.abs(expenseChange),
        changeDirection: expenseChange >= 0 ? 'up' : 'down',
      },
      tax: {
        total: currentPeriod.tax,
        changePercent: Math.abs(taxChange),
        changeDirection: taxChange >= 0 ? 'up' : 'down',
      },
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    // Return default values on error - don't throw, just return empty stats
    // This prevents the dashboard from crashing if invoices API is not available
    return {
      balance: { total: 0, changePercent: 0, changeDirection: 'up' },
      income: { total: 0, changePercent: 0, changeDirection: 'up' },
      expense: { total: 0, changePercent: 0, changeDirection: 'up' },
      tax: { total: 0, changePercent: 0, changeDirection: 'up' },
    };
  }
}

export const dashboardApi = {
  /**
   * Get dashboard statistics (balance, income, expense, tax)
   */
  async getStatistics(startDate?: string, endDate?: string): Promise<DashboardStatistics> {
    return calculateStatistics(startDate, endDate);
  },

  /**
   * Get revenue chart data
   */
  async getRevenueData(startDate?: string, endDate?: string): Promise<RevenueDataPoint[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const orders = await ordersClient.get<any[]>(
        `/api/orders?${params.toString()}`
      ).catch(() => []);

      // Group by date
      const revenueByDate = new Map<string, { revenue: number; orders: number }>();

      orders.forEach((order) => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        const total = typeof order.grandTotal === 'string' 
          ? parseFloat(order.grandTotal) 
          : order.grandTotal || 0;

        const existing = revenueByDate.get(date) || { revenue: 0, orders: 0 };
        revenueByDate.set(date, {
          revenue: existing.revenue + total,
          orders: existing.orders + 1,
        });
      });

      // Convert to array and sort by date
      return Array.from(revenueByDate.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  },

  /**
   * Get order status counts
   */
  async getOrderStatusCounts(): Promise<OrderStatusCounts> {
    try {
      const orders = await ordersClient.get<any[]>(
        '/api/orders'
      ).catch(() => []);

      const counts = {
        newOrder: 0,
        inProgress: 0,
        completed: 0,
        onHold: 0,
        return: 0,
      };

      orders.forEach((order) => {
        const status = order.status?.toLowerCase();
        if (status === 'pending') counts.newOrder++;
        else if (status === 'confirmed' || status === 'processing') counts.inProgress++;
        else if (status === 'delivered') counts.completed++;
        else if (status === 'canceled') counts.onHold++;
      });

      return counts;
    } catch (error) {
      console.error('Error fetching order status counts:', error);
      return {
        newOrder: 0,
        inProgress: 0,
        completed: 0,
        onHold: 0,
        return: 0,
      };
    }
  },

  /**
   * Batch fetch customer names from registry service
   */
  async batchGetCustomerNames(customerIds: string[]): Promise<Map<string, string>> {
    const customerNameMap = new Map<string, string>();
    
    if (customerIds.length === 0) return customerNameMap;

    try {
      // Use empty base URL to go through Next.js API routes
      const REGISTRY_API_URL = '';
      const registryClient = createApiClient(REGISTRY_API_URL);

      // Try batch endpoint first (if available)
      try {
        const customers = await registryClient.post<any[]>('/api/customers/batch', { ids: customerIds });
        customers.forEach((customer) => {
          const name = customer.type === 'INDIVIDUAL'
            ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Unknown'
            : customer.tradingName || customer.legalName || customer.email || 'Company';
          customerNameMap.set(customer.id, name);
        });
      } catch {
        // Fallback to individual requests in parallel (better than sequential)
        const customerPromises = customerIds.map(async (customerId) => {
          try {
            const customer = await registryClient.get<any>(`/api/customers/${customerId}`);
            const name = customer.type === 'INDIVIDUAL'
              ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Unknown'
              : customer.tradingName || customer.legalName || customer.email || 'Company';
            return { id: customerId, name };
          } catch {
            return { id: customerId, name: `Customer ${customerId.slice(0, 8)}` };
          }
        });

        const results = await Promise.all(customerPromises);
        results.forEach(({ id, name }) => {
          customerNameMap.set(id, name);
        });
      }
    } catch (error) {
      console.error('Error batch fetching customer names:', error);
      // Set fallback names for all customers
      customerIds.forEach((id) => {
        customerNameMap.set(id, `Customer ${id.slice(0, 8)}`);
      });
    }

    return customerNameMap;
  },

  /**
   * Get recent orders for dashboard table
   */
  async getRecentOrders(limit = 10): Promise<DashboardOrder[]> {
    try {
      const orders = await ordersClient.get<any[]>(
        `/api/orders?take=${limit}&skip=0`
      ).catch(() => []);

      // Collect unique customer IDs
      const customerIds = [...new Set(
        orders
          .map((order) => order.customerId)
          .filter((id): id is string => !!id)
      )];

      // Batch fetch all customer names at once
      const customerNameMap = customerIds.length > 0
        ? await this.batchGetCustomerNames(customerIds)
        : new Map<string, string>();

      // Map orders to dashboard format
      return orders.slice(0, limit).map((order) => {
        // Map order status to dashboard status
        const statusMap: Record<string, 'new-order' | 'in-progress' | 'completed' | 'return' | 'on-hold'> = {
          'PENDING': 'new-order',
          'CONFIRMED': 'in-progress',
          'PROCESSING': 'in-progress',
          'SHIPPED': 'in-progress',
          'DELIVERED': 'completed',
          'CANCELED': 'on-hold',
        };

        const dashboardStatus = statusMap[order.status] || 'new-order';

        // Get customer name from map
        const customerName = order.customerId
          ? customerNameMap.get(order.customerId) || `Customer ${order.customerId.slice(0, 8)}`
          : 'Unknown Customer';

        return {
          id: order.id,
          orderNumber: order.orderNumber || order.id,
          customerName,
          items: order.lineItems?.length || 0,
          amount: typeof order.grandTotal === 'string' 
            ? parseFloat(order.grandTotal) 
            : order.grandTotal || 0,
          paymentMethod: order.payments?.[0]?.provider || 'Unknown',
          status: dashboardStatus,
          createdAt: order.createdAt,
        };
      });
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  },

  /**
   * Get best selling products
   */
  async getBestSellingProducts(limit = 5): Promise<BestSellingProduct[]> {
    try {
      const orders = await ordersClient.get<any[]>(
        '/api/orders'
      ).catch(() => []);

      // Aggregate product sales
      const productMap = new Map<string, { name: string; quantity: number; revenue: number; sku?: string }>();

      orders.forEach((order) => {
        order.lineItems?.forEach((item: any) => {
          const productId = item.productId || item.id;
          const existing = productMap.get(productId) || {
            name: item.description || 'Unknown Product',
            quantity: 0,
            revenue: 0,
            sku: item.sku,
          };

          productMap.set(productId, {
            ...existing,
            quantity: existing.quantity + (item.quantity || 0),
            revenue: existing.revenue + (typeof item.totalPrice === 'string' 
              ? parseFloat(item.totalPrice) 
              : item.totalPrice || 0),
          });
        });
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
        .map((product, index) => ({
          id: `product-${index}`,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          revenue: product.revenue,
        }));
    } catch (error) {
      console.error('Error fetching best selling products:', error);
      return [];
    }
  },
};

