import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { Warehouse, Package, MapPin, Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WarehouseList from "./warehouse-list";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = generateMeta({
  title: "Warehouses",
  description: "Manage warehouse locations and capacity",
  canonical: "/inventory/warehouses"
});

export default function WarehousesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">
            Manage your warehouse locations and capacity
          </p>
        </div>
        <Button asChild>
          <Link href="/inventory/warehouses/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Warehouse
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Warehouses</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">2</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Warehouse className="mr-1 h-3 w-3 text-blue-600" />
              <span className="text-blue-600">Active locations</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Capacity</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">15,000</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Package className="mr-1 h-3 w-3 text-green-600" />
              <span className="text-green-600">units</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Items Stored</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">1,247</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <Activity className="mr-1 h-3 w-3 text-purple-600" />
              <span className="text-purple-600">83% capacity</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Locations</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">4</CardTitle>
            <Badge variant="outline" className="mt-2 w-fit">
              <MapPin className="mr-1 h-3 w-3 text-orange-600" />
              <span className="text-orange-600">cities</span>
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <WarehouseList />
    </div>
  );
}

