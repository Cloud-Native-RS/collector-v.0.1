"use client";

import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStatistics } from "@/hooks/use-dashboard";

interface TaxCardProps {
  startDate?: string;
  endDate?: string;
}

export function TaxCard({ startDate, endDate }: TaxCardProps) {
  const { statistics, isLoading } = useDashboardStatistics(startDate, endDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardDescription>Total Sales Tax</CardDescription>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
      </Card>
    );
  }

  const tax = statistics?.tax || { total: 0, changePercent: 0, changeDirection: 'up' };
  const isPositive = tax.changeDirection === 'up';

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>Total Sales Tax</CardDescription>
        <div className="font-display text-2xl lg:text-3xl">
          ${tax.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center text-xs">
          {isPositive ? (
            <ArrowUpIcon className="mr-1 size-3 text-green-500" />
          ) : (
            <ArrowDownIcon className="mr-1 size-3 text-red-500" />
          )}
          <span className={`font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {tax.changePercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground ml-1">Compare from last month</span>
        </div>
      </CardHeader>
    </Card>
  );
}
