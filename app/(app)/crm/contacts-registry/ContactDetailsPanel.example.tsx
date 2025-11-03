/**
 * Example usage of ContactDetailsPanel component
 * 
 * This file demonstrates how to use the ContactDetailsPanel in your CRM dashboard.
 */

"use client";

import { useState } from "react";
import { ContactDetailsPanel } from "./ContactDetailsPanel";
import { Button } from "@/components/ui/button";
import { type Contact } from "./types";

export function ContactDetailsPanelExample() {
  const [open, setOpen] = useState(false);
  
  // Example contact data
  const exampleContact: Contact = {
    id: 1,
    contactNumber: "CUST-001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    title: "Senior Sales Manager",
    department: "Sales",
    companyId: 123,
    companyName: "Acme Corporation",
    companyLegalName: "Acme Corporation Inc.",
    status: "active",
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
    },
    tenantId: "tenant-123",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
  };

  // Example notes
  const exampleNotes = [
    "Met at conference in San Francisco. Interested in enterprise solutions.",
    "Follow-up scheduled for next week.",
    "Prefers email communication.",
  ];

  // Example tags
  const exampleTags = ["Customer", "Lead", "VIP"];

  const handleEdit = (contact: Contact) => {
    console.log("Edit contact:", contact);
    // Add your edit logic here
    // For example, open an edit dialog or navigate to edit page
  };

  return (
    <div className="p-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Contact Details Panel Example</h1>
        <p className="text-muted-foreground">
          Click the button below to open the contact details side panel.
        </p>
        
        <Button onClick={() => setOpen(true)}>
          Open Contact Details
        </Button>

        {/* Contact Details Panel */}
        <ContactDetailsPanel
          contact={exampleContact}
          open={open}
          onClose={setOpen}
          notes={exampleNotes}
          tags={exampleTags}
          linkedIn="https://linkedin.com/in/johndoe"
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}

/**
 * Alternative usage: Basic example without optional props
 */
export function ContactDetailsPanelBasicExample() {
  const [open, setOpen] = useState(false);
  
  const basicContact: Contact = {
    id: 2,
    contactNumber: "CUST-002",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+1 (555) 987-6543",
    title: null,
    department: "Marketing",
    companyId: null,
    companyName: null,
    companyLegalName: null,
    status: "pending",
    address: {
      street: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "United States",
    },
    tenantId: "tenant-123",
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-01T09:00:00Z",
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        View Contact
      </Button>
      
      <ContactDetailsPanel
        contact={basicContact}
        open={open}
        onClose={setOpen}
      />
    </>
  );
}

/**
 * Usage in a table row click handler
 */
export function ContactTableRowExample() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // This would typically be in your data table component
  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setPanelOpen(true);
  };

  const handleClosePanel = (open: boolean) => {
    setPanelOpen(open);
    if (!open) {
      setSelectedContact(null);
    }
  };

  return (
    <>
      {/* Your table component here */}
      {/* When row is clicked: handleRowClick(contact) */}
      
      <ContactDetailsPanel
        contact={selectedContact}
        open={panelOpen}
        onClose={handleClosePanel}
        notes={["Note 1", "Note 2"]}
        tags={["Lead"]}
        onEdit={(contact) => {
          console.log("Edit:", contact);
          // Handle edit action
        }}
      />
    </>
  );
}

