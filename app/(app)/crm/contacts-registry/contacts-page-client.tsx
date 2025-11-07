"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ContactsDataTable from "./contacts-data-table";
import AddContactDialog from "./add-contact-dialog";
import { ContactDetailsPanel } from "./ContactDetailsPanel";
import { type Contact } from "./types";
import { ExportButton } from "@/components/ui/export-button";
import { type ExportColumn } from "@/lib/export";
import { AdvancedFilter, type FilterField } from "@/components/ui/advanced-filter";

interface ContactsPageClientProps {
  initialContacts: Contact[];
}

export default function ContactsPageClient({
  initialContacts,
}: ContactsPageClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isNewContactPanelOpen, setIsNewContactPanelOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [advancedFilteredContacts, setAdvancedFilteredContacts] = useState<Contact[]>(initialContacts);

  const handleRefresh = async () => {
    // Refresh data by reloading the page
    setDialogOpen(false);
    setEditingContact(null);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setPanelOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setPanelOpen(false);
    setSelectedContact(null);
    setEditingContact(contact);
    setDialogOpen(true);
  };

  const handleSaveContact = (updatedContact: Contact, notes: string[], linkedIn?: string, tags?: string[]) => {
    // Update the contact in the contacts list
    setContacts(prevContacts => 
      prevContacts.map(c => 
        c.id === updatedContact.id || c.originalId === updatedContact.originalId 
          ? updatedContact 
          : c
      )
    );
    
    // Update selected contact if it's the same one
    if (selectedContact && (selectedContact.id === updatedContact.id || selectedContact.originalId === updatedContact.originalId)) {
      setSelectedContact(updatedContact);
    }
    
    // TODO: Call API to persist changes
    // Example: await updateContact(updatedContact.originalId, updatedContact);
  };

  const handleCreateContact = (newContact: Contact, notes: string[], linkedIn?: string, tags?: string[]) => {
    // Add new contact to the contacts list
    setContacts(prevContacts => [...prevContacts, newContact]);
    
    // TODO: Call API to create contact
    // Example: const created = await createContact(newContact);
    // setContacts(prevContacts => [...prevContacts, created]);
    
    // Refresh page to get updated data from server
    handleRefresh();
  };

  const handleAddContactClick = () => {
    setIsNewContactPanelOpen(true);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = contacts.length;
    const byStatus = contacts.reduce((acc, contact) => {
      acc[contact.status] = (acc[contact.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const withCompany = contacts.filter(c => c.companyName).length;
    const withoutCompany = total - withCompany;

    return {
      total,
      active: byStatus.active || 0,
      inactive: byStatus.inactive || 0,
      pending: byStatus.pending || 0,
      archived: byStatus.archived || 0,
      withCompany,
      withoutCompany,
    };
  }, [contacts]);

  // Get unique companies for filter
  const companies = useMemo(() => {
    const companySet = new Set<string>();
    contacts.forEach(contact => {
      const company = contact.companyLegalName || contact.companyName;
      if (company) {
        companySet.add(company);
      }
    });
    return Array.from(companySet).sort();
  }, [contacts]);

  // Filter contacts based on selected filters (quick filters + advanced filters)
  const filteredContacts = useMemo(() => {
    let filtered = advancedFilteredContacts;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(contact => contact.status === selectedStatus);
    }

    if (selectedCompany !== "all") {
      if (selectedCompany === "none") {
        filtered = filtered.filter(contact => !contact.companyName && !contact.companyLegalName);
      } else {
        filtered = filtered.filter(contact => {
          const company = contact.companyLegalName || contact.companyName;
          return company === selectedCompany;
        });
      }
    }

    return filtered;
  }, [advancedFilteredContacts, selectedStatus, selectedCompany]);

  // Advanced filter fields definition
  const filterFields: FilterField[] = useMemo(() => [
    {
      key: "firstName",
      label: "First Name",
      type: "text",
      placeholder: "Enter first name"
    },
    {
      key: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "Enter last name"
    },
    {
      key: "email",
      label: "Email Address",
      type: "text",
      placeholder: "Enter email"
    },
    {
      key: "phone",
      label: "Phone",
      type: "text",
      placeholder: "Enter phone"
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "pending", label: "Pending" },
        { value: "archived", label: "Archived" },
      ]
    },
    {
      key: "companyName",
      label: "Company",
      type: "text",
      placeholder: "Enter company name"
    },
    {
      key: "title",
      label: "Job Title",
      type: "text",
      placeholder: "Enter job title"
    },
    {
      key: "department",
      label: "Department",
      type: "text",
      placeholder: "Enter department"
    },
    {
      key: "address.city",
      label: "City",
      type: "text",
      placeholder: "Enter city"
    },
    {
      key: "address.country",
      label: "Country",
      type: "text",
      placeholder: "Enter country"
    },
    {
      key: "createdAt",
      label: "Created Date",
      type: "date"
    },
  ], []);

  // Export columns definition
  const exportColumns: ExportColumn<Contact>[] = useMemo(() => [
    { key: "contactNumber", label: "Contact #" },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "title", label: "Title" },
    { key: "department", label: "Department" },
    {
      key: "companyName",
      label: "Company",
      format: (val, row) => row.companyLegalName || row.companyName || "N/A"
    },
    { key: "status", label: "Status" },
    {
      key: "address",
      label: "Address",
      format: (val: any) => val ? `${val.street}, ${val.city}, ${val.state || ""} ${val.zipCode}, ${val.country}`.trim() : "N/A"
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
            <h1 className="text-sm font-medium">Contacts</h1>
            <span className="text-xs text-muted-foreground">
              {stats.total} {stats.total === 1 ? 'contact' : 'contacts'}
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
                Active
              </Button>
              <Button
                variant={selectedStatus === "inactive" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("inactive")}
                className="h-6 px-2 text-xs"
              >
                Inactive
              </Button>
              <Button
                variant={selectedStatus === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("pending")}
                className="h-6 px-2 text-xs"
              >
                Pending
              </Button>
              <Button
                variant={selectedStatus === "archived" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus("archived")}
                className="h-6 px-2 text-xs"
              >
                Archived
              </Button>
            </div>
          </div>
          <div className="col-span-6 flex items-center justify-end gap-2">
            {companies.length > 0 && (
              <>
                <Button
                  variant={selectedCompany === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCompany("all")}
                  className="h-6 px-2 text-xs"
                >
                  All Companies
                </Button>
                <Button
                  variant={selectedCompany === "none" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCompany("none")}
                  className="h-6 px-2 text-xs"
                >
                  No Company
                </Button>
              </>
            )}
            <AdvancedFilter
              fields={filterFields}
              data={contacts}
              onFilterChange={setAdvancedFilteredContacts}
            />
            <ExportButton
              data={filteredContacts}
              columns={exportColumns}
              filename="contacts"
              entityName="Contacts"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
            />
            <Button onClick={handleAddContactClick} size="sm" className="h-7 px-3 text-xs">
              <Plus className="mr-1.5 h-3 w-3" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table Section - Full height, minimal padding */}
      <div className="flex-1 overflow-auto scroll-smooth">
        <ContactsDataTable 
          data={filteredContacts} 
          onContactClick={handleContactClick}
          allContacts={contacts}
        />
      </div>
      
      <AddContactDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingContact(null);
          }
        }}
        onSuccess={handleRefresh}
        contact={editingContact || undefined}
      />
      
      <ContactDetailsPanel
        contact={selectedContact}
        open={panelOpen}
        onClose={(open) => {
          setPanelOpen(open);
          if (!open) {
            setSelectedContact(null);
          }
        }}
        onEdit={handleEditContact}
        onSave={handleSaveContact}
      />

      {/* New Contact Panel */}
      <ContactDetailsPanel
        contact={null}
        open={isNewContactPanelOpen}
        onClose={(open) => {
          setIsNewContactPanelOpen(open);
        }}
        isNewContact={true}
        onCreate={handleCreateContact}
      />
    </div>
  );
}

