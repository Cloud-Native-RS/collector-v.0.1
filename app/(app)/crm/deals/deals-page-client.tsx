"use client";

import React, { useState, useEffect, useMemo, type ErrorInfo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DealsDataTable from "./deals-data-table";
import { type Deal } from "./types";
import { crmApi, type Deal as ApiDeal } from "@/lib/api/crm";
import { toast } from "sonner";
import { ExportButton } from "@/components/ui/export-button";
import { type ExportColumn } from "@/lib/export";

// Lazy load heavy Kanban component
const DealsKanbanBoard = dynamic(() => import("./deals-kanban-board"), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading kanban board...</div>
    </div>
  ),
  ssr: false
});

class KanbanErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Kanban board error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Error loading kanban board. Please refresh the page.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface DealsPageClientProps {
  initialDeals: Deal[];
}

function mapApiDealToFrontend(apiDeal: ApiDeal): Deal {
  // Map API stage (e.g., "CLOSED_WON") to frontend stage (e.g., "closed_won")
  const stageMap: Record<string, Deal['stage']> = {
    'LEAD': 'lead',
    'QUALIFIED': 'qualified',
    'PROPOSAL': 'proposal',
    'NEGOTIATION': 'negotiation',
    'CLOSED_WON': 'closed_won',
    'CLOSED_LOST': 'closed_lost',
  };
  
  const frontendStage = stageMap[apiDeal.stage] || apiDeal.stage.toLowerCase() as Deal['stage'];
  
  return {
    ...apiDeal,
    stage: frontendStage,
  };
}

export default function DealsPageClient({
  initialDeals,
}: DealsPageClientProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("kanban");

  useEffect(() => {
    console.log("Current view:", view);
    console.log("Deals count:", deals.length);
  }, [view, deals]);

  const refreshDeals = async () => {
    try {
      setLoading(true);
      const response = await crmApi.getDeals();
      // Handle both ApiResponse format and direct array response
      const dealsData = response?.data || response || [];
      const mappedDeals = Array.isArray(dealsData) ? dealsData.map(mapApiDealToFrontend) : [];
      setDeals(mappedDeals);
    } catch (error: any) {
      toast.error(`Failed to load deals: ${error.message || 'An error occurred'}`);
      setDeals([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh deals on mount if initialDeals is empty (from mock data)
    if (initialDeals.length === 0 || initialDeals[0]?.id?.startsWith('mock-')) {
      refreshDeals();
    }
  }, []);

  const handleAddDeal = () => {
    // TODO: Implement add deal functionality
    console.log("Add deal clicked");
  };

  // Export columns definition
  const exportColumns: ExportColumn<Deal>[] = useMemo(() => [
    { key: "dealNumber", label: "Deal #" },
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    {
      key: "value",
      label: "Value",
      format: (val) => `$${Number(val).toLocaleString()}`
    },
    {
      key: "probability",
      label: "Probability",
      format: (val) => `${val}%`
    },
    { key: "stage", label: "Stage" },
    {
      key: "expectedCloseDate",
      label: "Expected Close",
      format: (val) => val ? new Date(val as string).toLocaleDateString() : "N/A"
    },
    {
      key: "actualCloseDate",
      label: "Actual Close",
      format: (val) => val ? new Date(val as string).toLocaleDateString() : "N/A"
    },
    { key: "lostReason", label: "Lost Reason" },
    { key: "customerId", label: "Customer ID" },
    { key: "leadId", label: "Lead ID" },
    { key: "assignedTo", label: "Assigned To" },
    {
      key: "createdAt",
      label: "Created",
      format: (val) => new Date(val as string).toLocaleDateString()
    },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track deal progress
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={deals}
            columns={exportColumns}
            filename="deals"
            entityName="Deals"
            variant="outline"
          />
          <Button onClick={handleAddDeal}>
            <Plus /> Add New Deal
          </Button>
        </div>
      </div>

      <Tabs value={view} defaultValue="kanban" onValueChange={(v) => {
        console.log("Tab changed to:", v);
        setView(v as "table" | "kanban");
      }}>
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="mt-4">
          <DealsDataTable data={deals} onRefresh={refreshDeals} loading={loading} />
        </TabsContent>
        
        <TabsContent value="kanban" className="mt-4">
          <KanbanErrorBoundary>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">Loading deals...</p>
              </div>
            ) : (
              <DealsKanbanBoard deals={deals} onRefresh={refreshDeals} />
            )}
          </KanbanErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

