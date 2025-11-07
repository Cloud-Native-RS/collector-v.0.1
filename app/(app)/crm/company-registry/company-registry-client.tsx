"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CompanyDataTable from "./company-data-table";
import AddCompanyDialog from "./add-company-dialog";
import { CompanyDetailsPanel } from "./CompanyDetailsPanel";
import { type Company } from "./types";
import { ExportButton } from "@/components/ui/export-button";
import { type ExportColumn } from "@/lib/export";

interface CompanyRegistryClientProps {
  initialCompanies: Company[];
}

export default function CompanyRegistryClient({
  initialCompanies,
}: CompanyRegistryClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isNewCompanyPanelOpen, setIsNewCompanyPanelOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const handleRefresh = async () => {
    // Refresh data by calling parent component's refresh
    // This will be handled by the parent page component
    setIsDialogOpen(false);
    setEditingCompany(null);
    // Trigger a page reload or parent refresh if available
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setPanelOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setPanelOpen(false);
    setSelectedCompany(null);
    setEditingCompany(company);
    setIsDialogOpen(true);
  };

  const handleSaveCompany = (updatedCompany: Company) => {
    // Update the company in the companies list
    setCompanies(prevCompanies => 
      prevCompanies.map(c => 
        c.id === updatedCompany.id || c.originalId === updatedCompany.originalId 
          ? updatedCompany 
          : c
      )
    );
    
    // Update selected company if it's the same one
    if (selectedCompany && (selectedCompany.id === updatedCompany.id || selectedCompany.originalId === updatedCompany.originalId)) {
      setSelectedCompany(updatedCompany);
    }
    
    // TODO: Call API to persist changes
    console.log("Company saved:", updatedCompany);
  };

  const handleCreateCompany = (newCompany: Company) => {
    // Add new company to the companies list
    setCompanies(prevCompanies => [...prevCompanies, newCompany]);
    
    // TODO: Call API to create company
    console.log("Company created:", newCompany);
    
    // Refresh page to get updated data from server
    handleRefresh();
  };

  const handleAddCompanyClick = () => {
    setIsNewCompanyPanelOpen(true);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = companies.length;
    const byStatus = companies.reduce((acc, company) => {
      acc[company.status] = (acc[company.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active: byStatus.active || 0,
      inactive: byStatus.inactive || 0,
      pending: byStatus.pending || 0,
      liquidated: byStatus.liquidated || 0,
    };
  }, [companies]);

  // Filter companies based on selected filters
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(company => company.status === selectedStatus);
    }

    return filtered;
  }, [companies, selectedStatus]);

  // Export columns definition
  const exportColumns: ExportColumn<Company>[] = useMemo(() => [
    { key: "companyNumber", label: "Company #" },
    { key: "legalName", label: "Legal Name" },
    { key: "tradingName", label: "Trading Name" },
    { key: "companyType", label: "Type" },
    { key: "taxId", label: "Tax ID" },
    { key: "registrationNumber", label: "Registration #" },
    { key: "status", label: "Status" },
    { key: "industry", label: "Industry" },
    {
      key: "contactInfo",
      label: "Email",
      format: (val: any) => val?.email || "N/A"
    },
    {
      key: "contactInfo",
      label: "Phone",
      format: (val: any) => val?.phone || "N/A"
    },
    {
      key: "contactInfo",
      label: "Website",
      format: (val: any) => val?.website || "N/A"
    },
    {
      key: "address",
      label: "Address",
      format: (val: any) => val ? `${val.street}, ${val.city}, ${val.state || ""} ${val.zipCode}, ${val.country}`.trim() : "N/A"
    },
    {
      key: "legalRepresentative",
      label: "Legal Rep",
      format: (val: any) => val?.name || "N/A"
    },
    {
      key: "createdAt",
      label: "Created",
      format: (val) => new Date(val as string).toLocaleDateString()
    },
  ], []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Compact Header - Max 56px */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center h-14 max-h-14">
          <div className="col-span-6 flex items-center gap-3">
            <h1 className="text-sm font-medium">Companies</h1>
            <span className="text-xs text-muted-foreground">
              {stats.total} {stats.total === 1 ? 'company' : 'companies'}
            </span>
            <Separator orientation="vertical" className="h-4" />
            {/* Compact Filter Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant={selectedStatus === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("all")}
                className="h-6 px-2 text-xs"
              >
                All
              </Button>
              <Button
                variant={selectedStatus === "active" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("active")}
                className="h-6 px-2 text-xs"
              >
                Active ({stats.active})
              </Button>
              <Button
                variant={selectedStatus === "inactive" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("inactive")}
                className="h-6 px-2 text-xs"
              >
                Inactive ({stats.inactive})
              </Button>
              <Button
                variant={selectedStatus === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("pending")}
                className="h-6 px-2 text-xs"
              >
                Pending ({stats.pending})
              </Button>
              <Button
                variant={selectedStatus === "liquidated" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("liquidated")}
                className="h-6 px-2 text-xs"
              >
                Liquidated ({stats.liquidated})
              </Button>
            </div>
          </div>
          <div className="col-span-6 flex items-center justify-end gap-2">
            <ExportButton
              data={filteredCompanies}
              columns={exportColumns}
              filename="companies"
              entityName="Companies"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
            />
            <Button onClick={handleAddCompanyClick} size="sm" className="h-7 px-3 text-xs">
              <Plus className="mr-1.5 h-3 w-3" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table Section - Full height, minimal padding */}
      <div className="flex-1 overflow-auto scroll-smooth">
        <CompanyDataTable data={filteredCompanies} onCompanyClick={handleCompanyClick} />
      </div>
      
      <AddCompanyDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCompany(null);
          }
        }}
        onSuccess={handleRefresh}
        company={editingCompany || undefined}
      />
      
      <CompanyDetailsPanel
        company={selectedCompany}
        open={panelOpen}
        onClose={(open) => {
          setPanelOpen(open);
          if (!open) {
            setSelectedCompany(null);
          }
        }}
        onEdit={handleEditCompany}
        onSave={handleSaveCompany}
      />

      {/* New Company Panel */}
      <CompanyDetailsPanel
        company={null}
        open={isNewCompanyPanelOpen}
        onClose={(open) => {
          setIsNewCompanyPanelOpen(open);
        }}
        isNewCompany={true}
        onCreate={handleCreateCompany}
      />
    </div>
  );
}

