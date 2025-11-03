import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { ShoppingCart, DollarSign, Clock, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PurchaseOrderList from "./purchase-order-list";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = generateMeta({
  title: "Purchase Orders",
  description: "Manage purchase orders and suppliers",
  canonical: "/inventory/purchase-orders"
});

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage purchase orders and track supplier deliveries
          </p>
        </div>
        <Button asChild>
          <Link href="/inventory/purchase-orders/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">48</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <ShoppingCart className="mr-1 h-3 w-3 text-blue-600" />
              <span className="text-blue-600">This month</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Value</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">$125,450</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <DollarSign className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">Pending delivery</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">12</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Clock className="mr-1 h-3 w-3 text-orange-600" />
              <span className="text-orange-600">Awaiting</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">36</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">This month</span>
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <PurchaseOrderList />
    </div>
  );
}

