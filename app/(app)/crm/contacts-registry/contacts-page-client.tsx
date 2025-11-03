"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactsDataTable from "./contacts-data-table";
import AddContactDialog from "./add-contact-dialog";
import ViewContactDialog from "./view-contact-dialog";
import { type Contact } from "./types";

interface ContactsPageClientProps {
  initialContacts: Contact[];
}

export default function ContactsPageClient({
  initialContacts,
}: ContactsPageClientProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewContactDialogOpen, setViewContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

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
    setViewContactDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    // Close view dialog
    setViewContactDialogOpen(false);
    // Set contact for editing and open edit dialog
    setEditingContact(contact);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts Registry</h1>
          <p className="text-muted-foreground">
            Central address book of contacts - multiple people per company supported
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Contact
        </Button>
      </div>
      <ContactsDataTable data={contacts} onContactClick={handleContactClick} />
      
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
      
      <ViewContactDialog
        open={viewContactDialogOpen}
        onOpenChange={setViewContactDialogOpen}
        contact={selectedContact}
        onEdit={handleEditContact}
      />
    </div>
  );
}

