"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { crmApi, type DealStage } from "@/lib/api/crm";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { SalesPipeline } from "../components/sales-pipeline";

interface PipelineStats {
  stages: Array<{
    stage: DealStage;
    count: number;
    value: number;
  }>;
  totalValue: number;
  weightedValue: number;
}

interface ConversionRate {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  byStatus: Record<string, number>;
}

const stageNames: Record<DealStage, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

const stageColors: Record<DealStage, string> = {
  LEAD: "hsl(var(--chart-1))",
  QUALIFIED: "hsl(var(--chart-2))",
  PROPOSAL: "hsl(var(--chart-3))",
  NEGOTIATION: "hsl(var(--chart-4))",
  CLOSED_WON: "hsl(var(--chart-5))",
  CLOSED_LOST: "hsl(0 0% 60%)",
};

export default function PipelinesPageClient() {
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [conversionRate, setConversionRate] = useState<ConversionRate | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, conversion] = await Promise.all([
        crmApi.getPipelineStats(),
        crmApi.getConversionRate(),
      ]);
      
      setPipelineStats(stats);
      setConversionRate(conversion);
    } catch (error: any) {
      toast.error(`Failed to load pipeline data: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Sales Pipelines</h1>
        <div className="text-center py-8 text-muted-foreground">Loading pipeline data...</div>
      </div>
    );
  }

  const chartData = pipelineStats?.stages.map((stage) => ({
    stage: stageNames[stage.stage],
    count: stage.count,
    value: stage.value,
    weightedValue: stage.value * 0.5, // Simplified calculation
  })) || [];

  const valueChartConfig: ChartConfig = {
    value: {
      label: "Deal Value",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const countChartConfig: ChartConfig = {
    count: {
      label: "Deal Count",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  const funnelData = pipelineStats?.stages.map((stage, index) => ({
    name: stageNames[stage.stage],
    value: stage.count,
    percentage: pipelineStats
      ? Math.round((stage.count / pipelineStats.stages.reduce((sum, s) => sum + s.count, 0)) * 100)
      : 0,
  })) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Pipelines</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your sales pipeline
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Pipeline Value</CardDescription>
            <CardTitle className="text-2xl">
              ${pipelineStats?.totalValue.toLocaleString() || "0"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Combined value of all active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Weighted Pipeline Value</CardDescription>
            <CardTitle className="text-2xl">
              ${pipelineStats?.weightedValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "0"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Probability-adjusted pipeline value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-2xl">
              {conversionRate?.conversionRate.toFixed(1) || "0"}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {conversionRate?.convertedLeads || 0} of {conversionRate?.totalLeads || 0} leads converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Active Deals</CardDescription>
            <CardTitle className="text-2xl">
              {pipelineStats?.stages.reduce((sum, stage) => sum + stage.count, 0) || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Deals currently in pipeline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Visual breakdown of your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesPipeline />
        </CardContent>
      </Card>

      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">Stage Analysis</TabsTrigger>
          <TabsTrigger value="funnel">Pipeline Funnel</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Deal Count by Stage */}
            <Card>
              <CardHeader>
                <CardTitle>Deals by Stage</CardTitle>
                <CardDescription>Number of deals in each pipeline stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={countChartConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Deal Value by Stage */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Value by Stage</CardTitle>
                <CardDescription>Total value of deals in each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={valueChartConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Stage Details */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Breakdown</CardTitle>
              <CardDescription>Detailed metrics for each pipeline stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStats?.stages.map((stage) => {
                  const totalDeals = pipelineStats.stages.reduce((sum, s) => sum + s.count, 0);
                  const totalValue = pipelineStats.totalValue;
                  const countPercentage = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
                  const valuePercentage = totalValue > 0 ? (stage.value / totalValue) * 100 : 0;

                  return (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: stageColors[stage.stage] }}
                          />
                          <span className="font-medium">{stageNames[stage.stage]}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-right">
                            <div className="font-medium">{stage.count} deals</div>
                            <div className="text-muted-foreground text-xs">
                              {countPercentage.toFixed(1)}% of total
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${stage.value.toLocaleString()}</div>
                            <div className="text-muted-foreground text-xs">
                              {valuePercentage.toFixed(1)}% of value
                            </div>
                          </div>
                        </div>
                      </div>
                      <Progress value={countPercentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Funnel</CardTitle>
              <CardDescription>Visual representation of deals moving through pipeline stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((item, index) => {
                  const prevValue = index > 0 ? funnelData[index - 1].value : item.value;
                  const conversion = prevValue > 0 ? (item.value / prevValue) * 100 : 100;
                  
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.name}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.value} deals ({item.percentage}%)
                          </span>
                        </div>
                        {index > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {conversion.toFixed(1)}% conversion
                          </span>
                        )}
                      </div>
                      <div className="relative h-12 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Conversion</CardTitle>
                <CardDescription>Lead to customer conversion metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Leads</span>
                    <span className="font-medium">{conversionRate?.totalLeads || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Converted Leads</span>
                    <span className="font-medium text-green-600">
                      {conversionRate?.convertedLeads || 0}
                    </span>
                  </div>
                  <Progress
                    value={conversionRate?.conversionRate || 0}
                    className="h-3"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {conversionRate?.conversionRate.toFixed(2) || 0}% conversion rate
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline Health</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Deal Value</span>
                    <span className="font-medium">
                      $
                      {pipelineStats && pipelineStats.stages.reduce((sum, s) => sum + s.count, 0) > 0
                        ? (
                            pipelineStats.totalValue /
                            pipelineStats.stages.reduce((sum, s) => sum + s.count, 0)
                          ).toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pipeline Efficiency</span>
                    <span className="font-medium">
                      {pipelineStats && pipelineStats.totalValue > 0
                        ? (
                            (pipelineStats.weightedValue / pipelineStats.totalValue) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Win Rate</span>
                    <span className="font-medium">
                      {pipelineStats
                        ? pipelineStats.stages.find((s) => s.stage === "CLOSED_WON")?.count || 0
                        : 0}{" "}
                      deals won
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

