"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const refreshLeads = async () => {
    try {
      setLoading(true);
      const response = await crmApi.getLeads();
      
      // Handle both ApiResponse format and direct array response
      const leadsData = response?.data || response || [];
      
      if (!Array.isArray(leadsData)) {
        console.error('Unexpected response format from getLeads:', response);
        toast.error('Invalid response format from server');
        setLeads([]);
        return;
      }
      
      const mappedLeads = leadsData.map(mapApiLeadToFrontend);
      setLeads(mappedLeads);
      
      if (mappedLeads.length === 0) {
        console.log('No leads found in database');
      }
    } catch (error: any) {
      console.error('Error loading leads:', error);
      toast.error(`Failed to load leads: ${error.message || 'An error occurred'}`);
      setLeads([]);
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

  // Calculate stats for header
  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      new: byStatus.new || 0,
      contacted: byStatus.contacted || 0,
      qualified: byStatus.qualified || 0,
      proposal_sent: byStatus.proposal_sent || 0,
      negotiation: byStatus.negotiation || 0,
      won: byStatus.won || 0,
      lost: byStatus.lost || 0,
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    if (selectedStatus === "all") return leads;
    return leads.filter(lead => lead.status === selectedStatus);
  }, [leads, selectedStatus]);

  return (
    <div className="flex flex-col h-full">
      {/* Header Section - Pipedrive Style */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stats.total} {stats.total === 1 ? 'lead' : 'leads'} total
              </p>
            </div>
            <Button onClick={handleAddLead} size="default" className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </div>

          {/* Status Filter Pills - Pipedrive Style */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("all")}
              className="h-8"
            >
              All ({stats.total})
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={selectedStatus === "new" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("new")}
              className="h-8"
            >
              New ({stats.new})
            </Button>
            <Button
              variant={selectedStatus === "contacted" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("contacted")}
              className="h-8"
            >
              Contacted ({stats.contacted})
            </Button>
            <Button
              variant={selectedStatus === "qualified" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("qualified")}
              className="h-8"
            >
              Qualified ({stats.qualified})
            </Button>
            <Button
              variant={selectedStatus === "proposal_sent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("proposal_sent")}
              className="h-8"
            >
              Proposal ({stats.proposal_sent})
            </Button>
            <Button
              variant={selectedStatus === "negotiation" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("negotiation")}
              className="h-8"
            >
              Negotiation ({stats.negotiation})
            </Button>
            <Button
              variant={selectedStatus === "won" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("won")}
              className="h-8"
            >
              Won ({stats.won})
            </Button>
            <Button
              variant={selectedStatus === "lost" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("lost")}
              className="h-8"
            >
              Lost ({stats.lost})
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <LeadsDataTable 
          data={filteredLeads} 
          onRefresh={refreshLeads} 
          loading={loading}
          selectedStatus={selectedStatus}
        />
      </div>

      <AddLeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleLeadCreated}
      />
    </div>
  );
}

