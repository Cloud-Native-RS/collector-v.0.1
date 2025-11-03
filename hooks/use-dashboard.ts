/**
 * React hooks for dashboard data
 */

import { useState, useEffect } from 'react';
import { dashboardApi, DashboardStatistics, RevenueDataPoint, DashboardOrder, BestSellingProduct, OrderStatusCounts } from '@/lib/api/dashboard';

export function useDashboardStatistics(startDate?: string, endDate?: string) {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatistics() {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await dashboardApi.getStatistics(startDate, endDate);
        if (!cancelled) {
          setStatistics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch statistics'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchStatistics();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return { statistics, isLoading, error };
}

export function useRevenueData(startDate?: string, endDate?: string) {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRevenue() {
      setIsLoading(true);
      setError(null);
      
      try {
        const revenueData = await dashboardApi.getRevenueData(startDate, endDate);
        if (!cancelled) {
          setData(revenueData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch revenue data'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRevenue();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return { data, isLoading, error };
}

export function useRecentOrders(limit = 10) {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      
      try {
        const ordersData = await dashboardApi.getRecentOrders(limit);
        if (!cancelled) {
          setOrders(ordersData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { orders, isLoading, error, refetch: () => {
    setIsLoading(true);
    dashboardApi.getRecentOrders(limit).then(setOrders).catch(setError).finally(() => setIsLoading(false));
  }};
}

export function useBestSellingProducts(limit = 5) {
  const [products, setProducts] = useState<BestSellingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);
      
      try {
        const productsData = await dashboardApi.getBestSellingProducts(limit);
        if (!cancelled) {
          setProducts(productsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch products'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { products, isLoading, error };
}

export function useOrderStatusCounts() {
  const [counts, setCounts] = useState<OrderStatusCounts>({
    newOrder: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    return: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      setIsLoading(true);
      setError(null);
      
      try {
        const countsData = await dashboardApi.getOrderStatusCounts();
        if (!cancelled) {
          setCounts(countsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch order counts'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  return { counts, isLoading, error };
}

