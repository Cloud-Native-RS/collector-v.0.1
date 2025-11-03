"use client";

import { useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import CompanyDataTable from "./company-data-table";
import AddCompanyDialog from "./add-company-dialog";
import ViewCompanyDialog from "./view-company-dialog";
import { type Company } from "./types";

interface CompanyRegistryClientProps {
  initialCompanies: Company[];
}

export default function CompanyRegistryClient({
  initialCompanies,
}: CompanyRegistryClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewCompanyDialogOpen, setViewCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

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
    setViewCompanyDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    // Close view dialog
    setViewCompanyDialogOpen(false);
    // Set company for editing and open edit dialog
    setEditingCompany(company);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Registry</h1>
          <p className="text-muted-foreground">
            Central database of all legal entities with validation and tenant isolation
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusIcon /> Add New Company
        </Button>
      </div>
      <CompanyDataTable data={companies} onCompanyClick={handleCompanyClick} />
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
      <ViewCompanyDialog
        open={viewCompanyDialogOpen}
        onOpenChange={setViewCompanyDialogOpen}
        company={selectedCompany}
        onEdit={handleEditCompany}
      />
    </div>
  );
}

