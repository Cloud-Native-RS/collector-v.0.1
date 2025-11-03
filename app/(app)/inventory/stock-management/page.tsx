import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, Package, AlertTriangle, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StockTable from "./stock-table";

export const metadata: Metadata = generateMeta({
  title: "Stock Management",
  description: "Manage stock levels across all warehouses",
  canonical: "/inventory/stock-management"
});

export default function StockManagementPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground">
            Real-time inventory tracking across all warehouses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button asChild>
            <Link href="/inventory/stock-management/adjust">
              Adjust Stock
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Stock Value</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">$485,230</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">+5.2% this month</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">1,247</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Package className="mr-1 h-3 w-3 text-blue-600" />
              <span className="text-blue-600">Across 2 warehouses</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">18</CardTitle>
            <Badge variant="destructive" className="mt-2 w-fit">
              <AlertTriangle className="mr-1 h-3 w-3" />
              <span>Needs attention</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Recent Movements</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">342</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Activity className="mr-1 h-3 w-3 text-purple-600" />
              <span className="text-purple-600">This week</span>
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <StockTable />
    </div>
  );
}

