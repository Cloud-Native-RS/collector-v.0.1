"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueData } from "@/hooks/use-dashboard";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)"
  },
  orders: {
    label: "Orders",
    color: "var(--chart-2)"
  }
} satisfies ChartConfig;

interface RevenueChartProps {
  startDate?: string;
  endDate?: string;
}

export function RevenueChart({ startDate, endDate }: RevenueChartProps) {
  const { data: revenueData, isLoading } = useRevenueData(startDate, endDate);
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("revenue");

  // Transform data for chart
  const chartData = React.useMemo(() => {
    return revenueData.map((point) => ({
      date: point.date,
      revenue: point.revenue,
      orders: point.orders,
    }));
  }, [revenueData]);

  const total = React.useMemo(
    () => ({
      revenue: chartData.reduce((acc, curr) => acc + curr.revenue, 0),
      orders: chartData.reduce((acc, curr) => acc + curr.orders, 0)
    }),
    [chartData]
  );

  if (isLoading) {
    return (
      <Card className="relative h-full overflow-hidden">
        <CardHeader>
          <CardTitle>Revenue Chart</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[186px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative h-full overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue Chart</CardTitle>
        <CardDescription>
          {startDate && endDate 
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : 'Last 28 days'}
        </CardDescription>
        <CardAction className="col-start-auto row-start-auto justify-self-start md:col-start-2 md:row-start-1 md:justify-self-end">
          <div className="end-0 top-0 flex divide-x rounded-md border-s border-e border-t border-b md:absolute md:rounded-none md:rounded-bl-md md:border-e-transparent md:border-t-transparent">
            {(["revenue", "orders"] as const).map((key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="data-[active=true]:bg-muted relative flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left"
                  onClick={() => setActiveChart(chart)}>
                  <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                  <span className="font-display text-lg leading-none sm:text-2xl">
                    {chart === 'revenue' 
                      ? `$${total[chart].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : total[chart].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[186px] items-center justify-center text-muted-foreground">
            No revenue data available for the selected period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[186px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 0,
                right: 0,
                bottom: 0
              }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey={activeChart}
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      });
                    }}
                    formatter={(value: any) => {
                      return activeChart === 'revenue' 
                        ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : value.toString();
                    }}
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={5} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
