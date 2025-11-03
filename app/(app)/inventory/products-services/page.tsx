import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductList from "./product-list";

export const metadata: Metadata = generateMeta({
  title: "Products & Services",
  description: "Manage products and services in your inventory",
  canonical: "/inventory/products-services"
});

export default function ProductsServicesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and service offerings
          </p>
        </div>
        <Button asChild>
          <Link href="/inventory/products-services/create">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">248</CardTitle>
            <Badge variant="outline" className="mt-2">
              <span className="text-green-600">+12 this month</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Products</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">224</CardTitle>
            <Badge variant="outline" className="mt-2">
              <span className="text-blue-600">90.3% active</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">18</CardTitle>
            <Badge variant="outline" className="mt-2">
              <span className="text-orange-600">Needs attention</span>
            </Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Categories</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">12</CardTitle>
            <Badge variant="outline" className="mt-2">
              <span className="text-purple-600">Organized</span>
            </Badge>
          </CardHeader>
        </Card>
      </div>

      <ProductList />
    </div>
  );
}

