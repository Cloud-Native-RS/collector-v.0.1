"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import LeadsDataTable from "./leads-data-table";
import AddLeadDialog from "./add-lead-dialog";
import { type Lead } from "./types";
import { crmApi, type Lead as ApiLead } from "@/lib/api/crm";
import { toast } from "sonner";

interface LeadsPageClientProps {
  initialLeads: Lead[];
}

function mapApiLeadToFrontend(apiLead: ApiLead): Lead {
  return {
    ...apiLead,
    source: apiLead.source.toLowerCase() as any,
    status: apiLead.status.toLowerCase().replace('_', '_') as any,
  };
}

export default function LeadsPageClient({
  initialLeads,
}: LeadsPageClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refreshLeads = async () => {
    try {
      setLoading(true);
      const response = await crmApi.getLeads();
      // Handle both ApiResponse format and direct array response
      const leadsData = response?.data || response || [];
      const mappedLeads = Array.isArray(leadsData) ? leadsData.map(mapApiLeadToFrontend) : [];
      setLeads(mappedLeads);
    } catch (error: any) {
      toast.error(`Failed to load leads: ${error.message || 'An error occurred'}`);
      setLeads([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh leads on mount if initialLeads is empty (from mock data)
    if (initialLeads.length === 0 || initialLeads[0]?.id?.startsWith('mock-')) {
      refreshLeads();
    }
  }, []);

  const handleAddLead = () => {
    setDialogOpen(true);
  };

  const handleLeadCreated = () => {
    refreshLeads();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Track and manage all your sales leads and opportunities
          </p>
        </div>
        <Button onClick={handleAddLead}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </div>
      <LeadsDataTable data={leads} onRefresh={refreshLeads} loading={loading} />
      <AddLeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleLeadCreated}
      />
    </div>
  );
}

