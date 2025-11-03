"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DealsDataTable from "./deals-data-table";
import DealsKanbanBoard from "./deals-kanban-board";
import { type Deal } from "./types";
import { crmApi, type Deal as ApiDeal } from "@/lib/api/crm";
import { toast } from "sonner";

interface DealsPageClientProps {
  initialDeals: Deal[];
}

function mapApiDealToFrontend(apiDeal: ApiDeal): Deal {
  return {
    ...apiDeal,
    stage: apiDeal.stage.toLowerCase().replace('_', '_') as any,
  };
}

export default function DealsPageClient({
  initialDeals,
}: DealsPageClientProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track deal progress
          </p>
        </div>
        <Button onClick={handleAddDeal}>
          <PlusIcon /> Add New Deal
        </Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="mt-4">
          <DealsDataTable data={deals} onRefresh={refreshDeals} loading={loading} />
        </TabsContent>
        
        <TabsContent value="kanban" className="mt-4">
          <DealsKanbanBoard deals={deals} onRefresh={refreshDeals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

