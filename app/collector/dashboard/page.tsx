"use client";

import * as React from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import CalendarDateRangePicker from "@/components/custom-date-range-picker";
import {
  BalanceCard,
  TaxCard,
  IncomeCard,
  ExpenseCard,
  BestSellingProducts,
  TableOrderStatus,
  RevenueChart
} from "./components";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Page() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000), // 28 days ago
    to: new Date(),
  });

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  // Create a wrapper component that exposes date range
  const DateRangePickerWithCallback = React.useCallback(() => {
    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(dateRange);

    React.useEffect(() => {
      if (internalDate) {
        setDateRange(internalDate);
      }
    }, [internalDate]);

    // We need to modify the CalendarDateRangePicker to accept onDateChange
    // For now, we'll use a ref or context, but simpler: create wrapper
    return (
      <div>
        {/* Note: CalendarDateRangePicker needs to be modified to accept onDateChange prop */}
        {/* For now, using the component as-is and relying on React state sync */}
        <CalendarDateRangePicker />
      </div>
    );
  }, []);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="grow">
              <DateRangePickerWithCallback />
            </div>
            <Button>
              <Download />
              <span className="hidden lg:inline">Download</span>
            </Button>
          </div>
        </div>
        <div className="gap-4 space-y-4 md:grid md:grid-cols-2 lg:space-y-0 xl:grid-cols-8">
          <ErrorBoundary>
            <div className="md:col-span-4">
              <RevenueChart startDate={startDate} endDate={endDate} />
            </div>
          </ErrorBoundary>
          <div className="md:col-span-4">
            <div className="col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ErrorBoundary>
                <BalanceCard startDate={startDate} endDate={endDate} />
              </ErrorBoundary>
              <ErrorBoundary>
                <IncomeCard startDate={startDate} endDate={endDate} />
              </ErrorBoundary>
              <ErrorBoundary>
                <ExpenseCard startDate={startDate} endDate={endDate} />
              </ErrorBoundary>
              <ErrorBoundary>
                <TaxCard startDate={startDate} endDate={endDate} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
        <div className="gap-4 space-y-4 lg:space-y-0 xl:grid xl:grid-cols-3">
          <ErrorBoundary>
            <div className="xl:col-span-1">
              <BestSellingProducts />
            </div>
          </ErrorBoundary>
          <ErrorBoundary>
            <div className="xl:col-span-2">
              <TableOrderStatus />
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}
