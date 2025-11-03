"use client";

import Link from "next/link";
import { PlusIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrdersDataTable from "./data-table";
import { ordersApi, Order } from "@/lib/api/orders";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const statusFilterMap: Record<string, string | undefined> = {
    overview: undefined,
    completed: "DELIVERED",
    processed: "CONFIRMED",
    returned: undefined, // Not implemented in backend yet
    canceled: "CANCELED",
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const status = statusFilterMap[activeTab];
      const response = await ordersApi.list({
        status,
        take: 100,
      });
      setOrders(response.data || []);
    } catch (error: any) {
      toast.error(`Failed to load orders: ${error.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Orders</h1>
        <Button asChild>
          <Link href="/pages/orders/create">
            <PlusIcon /> Create Order
          </Link>
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
          <TabsTrigger value="returned">Returned</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
        </TabsList>
        <OrdersDataTable data={orders} loading={loading} onRefresh={loadOrders} />
      </Tabs>
    </div>
  );
}
