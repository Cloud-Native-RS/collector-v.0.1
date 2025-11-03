"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // TODO: Fetch product details from API
    // Mock data for now
    setTimeout(() => {
      setProduct({
        id: params.id,
        sku: "LAPTOP-001",
        name: "Dell Laptop XPS 13",
        description: "High-performance laptop for professionals",
        category: "ELECTRONICS",
        unitOfMeasure: "PIECE",
        price: 1299.99,
        taxPercent: 20,
        stockLevels: [
          { warehouse: "Main Warehouse", quantity: 50, reserved: 5, available: 45 },
          { warehouse: "Secondary Warehouse", quantity: 25, reserved: 2, available: 23 }
        ]
      });
      setLoading(false);
    }, 500);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/inventory/products-services")}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const totalStock = product.stockLevels.reduce((sum: number, level: any) => sum + level.quantity, 0);
  const totalAvailable = product.stockLevels.reduce((sum: number, level: any) => sum + level.available, 0);
  const lowStock = totalAvailable < 20;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/inventory/products-services">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total Stock</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">{totalStock}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Available for Order</CardDescription>
            <CardTitle className="font-display text-2xl lg:text-3xl">{totalAvailable}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Stock Status</CardDescription>
            <CardTitle className="font-display text-lg">
              {lowStock ? (
                <Badge variant="destructive" className="mt-2">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Low Stock
                </Badge>
              ) : (
                <Badge variant="default" className="mt-2">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  In Stock
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">SKU</h3>
              <p className="font-mono">{product.sku}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
              <Badge variant="outline">{product.category}</Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Unit of Measure</h3>
              <p>{product.unitOfMeasure}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Price</h3>
              <p className="text-lg font-semibold">${product.price.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Tax</h3>
              <p>{product.taxPercent}%</p>
            </div>
            {product.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock by Warehouse</CardTitle>
            <CardDescription>Current inventory levels across warehouses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.stockLevels.map((level: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{level.warehouse}</TableCell>
                    <TableCell>{level.quantity}</TableCell>
                    <TableCell className="text-orange-600">{level.reserved}</TableCell>
                    <TableCell className="font-medium">{level.available}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

