"use client";

import * as React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportButton } from "@/components/CardActionMenus";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBestSellingProducts } from "@/hooks/use-dashboard";

export function BestSellingProducts() {
  const { products, isLoading, error } = useBestSellingProducts(6);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Best Selling Product</CardTitle>
        <CardDescription>Top-Selling Products at a Glance</CardDescription>
        <CardAction>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load products: {error.message}
          </div>
        )}
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No products found. Create orders to see best selling products.
          </div>
        ) : (
          products.map((product) => (
            <Link
              href={`/inventory/products-services/${product.id}`}
              key={product.id}
              className="hover:bg-muted flex items-center justify-between rounded-md border px-4 py-3">
              <div className="flex items-center gap-4">
                {product.image ? (
                  <Image
                    src={product.image}
                    width={40}
                    height={40}
                    className="rounded-md!"
                    alt={product.name}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs font-medium">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium">{product.name}</div>
                  {product.sku && (
                    <div className="text-xs text-muted-foreground font-mono">{product.sku}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">{product.quantity} sold</div>
                {product.revenue > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ${product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
