"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { crmApi } from "@/lib/api/crm";
import { type DealStage } from "@/lib/api/crm";

type PipelineStage = {
  id: string;
  name: string;
  count: number;
  value: number;
  color: string;
};

const stageColors: Record<DealStage, string> = {
  LEAD: "bg-[var(--chart-1)]",
  QUALIFIED: "bg-[var(--chart-2)]",
  PROPOSAL: "bg-[var(--chart-3)]",
  NEGOTIATION: "bg-[var(--chart-4)]",
  CLOSED_WON: "bg-[var(--chart-5)]",
  CLOSED_LOST: "bg-gray-400",
};

const stageNames: Record<DealStage, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

export function SalesPipeline() {
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPipelineStats = async () => {
      try {
        setLoading(true);
        const stats = await crmApi.getPipelineStats();
        
        const mappedStages: PipelineStage[] = stats.stages.map((stage) => ({
          id: stage.stage.toLowerCase().replace('_', '-'),
          name: stageNames[stage.stage],
          count: stage.count,
          value: stage.value,
          color: stageColors[stage.stage],
        }));

        setPipelineData(mappedStages);
      } catch (error) {
        console.error('Failed to load pipeline stats:', error);
        // Fallback to empty data
        setPipelineData([]);
      } finally {
        setLoading(false);
      }
    };

    loadPipelineStats();
  }, []);

  const totalValue = pipelineData.reduce((sum, stage) => sum + stage.value, 0);
  const totalCount = pipelineData.reduce((sum, stage) => sum + stage.count, 0);
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>Loading pipeline statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Pipeline</CardTitle>
        <CardDescription>Current deals in your sales pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="mb-6 flex h-4 w-full overflow-hidden rounded-full">
            {pipelineData.map((stage) => (
              <Tooltip key={stage.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`${stage.color} h-full`}
                    style={{ width: `${(stage.value / totalValue) * 100}%` }}></div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">{stage.name}</p>
                    <p className="text-muted-foreground text-xs">{stage.count} deals</p>
                    <p className="text-muted-foreground text-xs">${stage.value.toLocaleString()}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        <div className="space-y-4">
          {pipelineData.map((stage) => (
            <div key={stage.id} className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${stage.color}`}></div>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{stage.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {stage.count} deals · ${stage.value.toLocaleString()}
                  </p>
                </div>
                <div className="flex w-24 items-center gap-2">
                  <Progress
                    value={(stage.count / totalCount) * 100}
                    className="h-2"
                    indicatorColor={stage.color}
                  />
                  <span className="text-muted-foreground w-10 text-right text-xs">
                    {Math.round((stage.value / totalValue) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
