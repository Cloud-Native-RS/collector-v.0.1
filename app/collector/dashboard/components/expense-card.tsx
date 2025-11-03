"use client";

import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStatistics } from "@/hooks/use-dashboard";

interface ExpenseCardProps {
  startDate?: string;
  endDate?: string;
}

export function ExpenseCard({ startDate, endDate }: ExpenseCardProps) {
  const { statistics, isLoading } = useDashboardStatistics(startDate, endDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardDescription>Total Expense</CardDescription>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
      </Card>
    );
  }

  const expense = statistics?.expense || { total: 0, changePercent: 0, changeDirection: 'up' };
  // For expense, down is good (less spending), up is bad (more spending)
  const isGood = expense.changeDirection === 'down';

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>Total Expense</CardDescription>
        <div className="font-display text-2xl lg:text-3xl">
          ${expense.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center text-xs">
          {isGood ? (
            <ArrowDownIcon className="mr-1 size-3 text-green-500" />
          ) : (
            <ArrowUpIcon className="mr-1 size-3 text-red-500" />
          )}
          <span className={`font-medium ${isGood ? 'text-green-500' : 'text-red-500'}`}>
            {expense.changePercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground ml-1">Compare from last month</span>
        </div>
      </CardHeader>
    </Card>
  );
}
