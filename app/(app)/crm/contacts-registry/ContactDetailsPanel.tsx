"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Linkedin, Edit, Building2, MapPin, Hash, Calendar, Globe, Briefcase, Save, X as XIcon } from "lucide-react";
import type { Contact } from "./types";
import { cn } from "@/lib/utils";

interface ContactDetailsPanelProps {
  contact: Contact | null;
  open: boolean;
  onClose: (open: boolean) => void;
  notes?: string[]; // Optional notes array
  tags?: string[]; // Optional tags like "Lead", "Customer", "Partner"
  linkedIn?: string; // Optional LinkedIn URL
  onEdit?: (contact: Contact) => void; // Optional edit handler
  onSave?: (contact: Contact, notes: string[], linkedIn?: string, tags?: string[]) => void; // Optional save handler to update contact
  isNewContact?: boolean; // If true, panel is in "create new contact" mode
  onCreate?: (contact: Contact, notes: string[], linkedIn?: string, tags?: string[]) => void; // Handler for creating new contact
}

export function ContactDetailsPanel({
  contact,
  open,
  onClose,
  notes: propNotes = [],
  tags = [],
  linkedIn,
  onEdit,
  onSave,
  isNewContact = false,
  onCreate,
}: ContactDetailsPanelProps) {
  // For new contact, create a default empty contact
  const defaultNewContact: Contact = {
    id: 0,
    originalId: undefined,
    contactNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: null,
    department: null,
    companyId: null,
    companyName: null,
    companyLegalName: null,
    status: "pending",
    address: {
      street: "",
      city: "",
      state: null,
      zipCode: "",
      country: "",
    },
    tenantId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [isEditMode, setIsEditMode] = useState(isNewContact); // Start in edit mode if new contact
  const [editedContact, setEditedContact] = useState<Contact | null>(isNewContact ? defaultNewContact : null);
  const [editedNotes, setEditedNotes] = useState<string[]>(propNotes);
  const [editedLinkedIn, setEditedLinkedIn] = useState<string>(linkedIn || "");
  const [editedTags, setEditedTags] = useState<string[]>(tags);
  const [notes, setNotes] = useState<string[]>(propNotes);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const lastFetchedContactIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Initialize edit state when contact changes
  useEffect(() => {
    if (isNewContact) {
      setEditedContact(defaultNewContact);
      setIsEditMode(true);
    } else if (contact) {
      setEditedContact({ ...contact });
      setIsEditMode(false);
    }
  }, [contact, isNewContact]);

  // Fetch notes from database when contact changes
  useEffect(() => {
    // Reset when panel closes
    if (!open) {
      setLoadingNotes(false);
      lastFetchedContactIdRef.current = null;
      isFetchingRef.current = false;
      if (!isNewContact) {
        setIsEditMode(false);
      }
      return;
    }

    // Skip fetching notes for new contacts
    if (isNewContact) {
      return;
    }

    // Skip if already fetching or if contact ID hasn't changed
    if (isFetchingRef.current || (contact?.originalId && contact.originalId === lastFetchedContactIdRef.current)) {
      return;
    }

    // Fetch notes when panel opens and contact is available
    if (contact?.originalId && open) {
      isFetchingRef.current = true;
      lastFetchedContactIdRef.current = contact.originalId;
      setLoadingNotes(true);
      
      // Fetch notes from API
      fetch(`/api/crm/contacts/${contact.originalId}/notes`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return { notes: [] };
        })
        .then((data) => {
          // If API returns notes, use them; otherwise fallback to propNotes
          if (data.notes && Array.isArray(data.notes) && data.notes.length > 0) {
            setNotes(data.notes);
          } else {
            setNotes(propNotes.length > 0 ? propNotes : []);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch notes:", error);
          // Fallback to prop notes on error
          setNotes(propNotes.length > 0 ? propNotes : []);
        })
        .finally(() => {
          setLoadingNotes(false);
          isFetchingRef.current = false;
        });
    } else if (open && !contact?.originalId && propNotes.length > 0) {
      // If panel is open but no contact ID, use propNotes
      setNotes(propNotes);
    }
  }, [contact?.originalId, open]);

  // Don't show placeholder if it's a new contact or if we have a contact
  if (!isNewContact && !contact && !editedContact) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className={cn("w-[400px] sm:w-[500px]")}>
          <SheetHeader>
            <SheetTitle>Contact Details</SheetTitle>
            <SheetDescription>No contact selected</SheetDescription>
          </SheetHeader>
          <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
            <p>Select a contact to view details</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Use edited contact in edit mode, original contact in view mode
  const displayContact = isEditMode && editedContact ? editedContact : (contact || editedContact);
  const currentContact = displayContact || (isNewContact ? editedContact : null);
  if (!currentContact && !isNewContact) return null;

  const fullName = `${currentContact.firstName} ${currentContact.lastName}`.trim();
  const initials = `${currentContact.firstName?.[0] || ''}${currentContact.lastName?.[0] || ''}`.toUpperCase();
  const role = currentContact.title ? `${currentContact.title}${currentContact.department ? `, ${currentContact.department}` : ''}` : currentContact.department || '';

  // Determine tags from status if no tags provided
  const displayTags = isEditMode ? editedTags : (tags.length > 0 ? tags : [currentContact.status]);

  const getStatusVariant = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'active':
      case 'customer':
        return 'default';
      case 'inactive':
        return 'destructive';
      case 'pending':
      case 'lead':
        return 'secondary';
      case 'archived':
      case 'partner':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleEmailClick = () => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  const handlePhoneClick = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleLinkedInClick = () => {
    if (linkedIn) {
      window.open(linkedIn, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEditClick = () => {
    // Always use inline edit mode
    setIsEditMode(true);
    if (contact) {
      setEditedContact({ ...contact });
      setEditedNotes([...notes]);
      setEditedLinkedIn(linkedIn || "");
      setEditedTags([...tags]);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (contact) {
      setEditedContact({ ...contact });
      setEditedNotes([...notes]);
      setEditedLinkedIn(linkedIn || "");
      setEditedTags([...tags]);
    }
  };

  const handleSave = () => {
    if (editedContact) {
      // Update notes state
      setNotes([...editedNotes]);
      
      // Call onSave callback if provided to update the contact in parent component
      if (onSave) {
        onSave(editedContact, editedNotes, editedLinkedIn || undefined, editedTags.length > 0 ? editedTags : undefined);
      } else {
        // Fallback: just log if no callback provided
        console.log("Saving contact:", editedContact);
        console.log("Saving notes:", editedNotes);
        console.log("Saving LinkedIn:", editedLinkedIn);
        console.log("Saving tags:", editedTags);
      }
      
      // Exit edit mode
      setIsEditMode(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(contact);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className={cn("w-[400px] sm:w-[500px] flex flex-col p-0 h-[calc(100vh-30px)] mt-[15px] mb-[15px] mr-[15px]")}>
        {/* Scrollable Content - Everything scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-0">
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              {/* Hidden title for accessibility - required by DialogContent */}
              <SheetTitle className="sr-only">
                {isNewContact ? "New Contact" : (currentContact ? `${currentContact.firstName} ${currentContact.lastName}` : "Contact Details")}
              </SheetTitle>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarImage src={undefined} alt={fullName || "Contact"} />
                  <AvatarFallback className="text-lg font-semibold">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <h2 className="text-xl font-semibold mb-1">
                        {isNewContact ? "New Contact" : "Edit Contact"}
                      </h2>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">First Name</label>
                        <Input
                          value={editedContact?.firstName || ""}
                          onChange={(e) => setEditedContact({ ...editedContact!, firstName: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Last Name</label>
                        <Input
                          value={editedContact?.lastName || ""}
                          onChange={(e) => setEditedContact({ ...editedContact!, lastName: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Title</label>
                        <Input
                          value={editedContact?.title || ""}
                          onChange={(e) => setEditedContact({ ...editedContact!, title: e.target.value || null })}
                          className="h-9"
                          placeholder="Title"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Department</label>
                        <Input
                          value={editedContact?.department || ""}
                          onChange={(e) => setEditedContact({ ...editedContact!, department: e.target.value || null })}
                          className="h-9"
                          placeholder="Department"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Status</label>
                        <Select
                          value={editedContact?.status || "pending"}
                          onValueChange={(value) => setEditedContact({ ...editedContact!, status: value as Contact["status"] })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold mb-1">
                        {isNewContact ? "New Contact" : fullName}
                      </h2>
                      {role && (
                        <SheetDescription className="text-sm text-muted-foreground mb-2">
                          {role}
                        </SheetDescription>
                      )}
                      {displayTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {displayTags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant={getStatusVariant(tag)}
                              className="capitalize"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
            {/* Contact Information */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-0.5">Email</p>
                    {isEditMode ? (
                      <Input
                        type="email"
                        value={editedContact?.email || ""}
                        onChange={(e) => setEditedContact({ ...editedContact!, email: e.target.value })}
                        className="h-9"
                      />
                    ) : currentContact.email ? (
                      <a
                        href={`mailto:${currentContact.email}`}
                        onClick={handleEmailClick}
                        className="text-sm font-medium text-primary hover:underline truncate block"
                        title={currentContact.email}
                      >
                        {currentContact.email}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-0.5">Phone</p>
                    {isEditMode ? (
                      <Input
                        type="tel"
                        value={editedContact?.phone || ""}
                        onChange={(e) => setEditedContact({ ...editedContact!, phone: e.target.value })}
                        className="h-9"
                      />
                    ) : currentContact.phone ? (
                      <a
                        href={`tel:${currentContact.phone}`}
                        onClick={handlePhoneClick}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {currentContact.phone}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-0.5">LinkedIn</p>
                    {isEditMode ? (
                      <Input
                        type="url"
                        value={editedLinkedIn}
                        onChange={(e) => setEditedLinkedIn(e.target.value)}
                        className="h-9"
                        placeholder="https://linkedin.com/in/..."
                      />
                    ) : editedLinkedIn || linkedIn ? (
                      <a
                        href={editedLinkedIn || linkedIn}
                        onClick={handleLinkedInClick}
                        className="text-sm font-medium text-primary hover:underline truncate block"
                        title={editedLinkedIn || linkedIn}
                      >
                        View Profile
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Company Information */}
            {(currentContact.companyName || currentContact.companyLegalName || isEditMode) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Company Information
                </h3>
                <div className="space-y-3 text-sm">
                  {(currentContact.companyLegalName || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Legal Name</p>
                        {isEditMode ? (
                          <Input
                            value={editedContact?.companyLegalName || ""}
                            onChange={(e) => setEditedContact({ ...editedContact!, companyLegalName: e.target.value || null })}
                            className="h-9"
                            placeholder="Legal Name"
                          />
                        ) : currentContact.companyLegalName ? (
                          <p className="text-foreground font-medium">{currentContact.companyLegalName}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(currentContact.companyName && currentContact.companyName !== currentContact.companyLegalName || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Trading Name</p>
                        {isEditMode ? (
                          <Input
                            value={editedContact?.companyName || ""}
                            onChange={(e) => setEditedContact({ ...editedContact!, companyName: e.target.value || null })}
                            className="h-9"
                            placeholder="Trading Name"
                          />
                        ) : currentContact.companyName && currentContact.companyName !== currentContact.companyLegalName ? (
                          <p className="text-foreground font-medium">{currentContact.companyName}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(currentContact.address.street || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Street</p>
                        {isEditMode ? (
                          <Input
                            value={editedContact?.address.street || ""}
                            onChange={(e) => setEditedContact({ 
                              ...editedContact!, 
                              address: { ...editedContact!.address, street: e.target.value }
                            })}
                            className="h-9"
                            placeholder="Street Address"
                          />
                        ) : currentContact.address.street ? (
                          <p className="text-foreground font-medium">{currentContact.address.street}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-0.5">City</p>
                        {isEditMode ? (
                          <Input
                            value={editedContact?.address.city || ""}
                            onChange={(e) => setEditedContact({ 
                              ...editedContact!, 
                              address: { ...editedContact!.address, city: e.target.value }
                            })}
                            className="h-9"
                            placeholder="City"
                          />
                        ) : currentContact.address.city ? (
                          <p className="text-foreground font-medium text-sm">{currentContact.address.city}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0.5">State</p>
                        {isEditMode ? (
                          <Input
                            value={editedContact?.address.state || ""}
                            onChange={(e) => setEditedContact({ 
                              ...editedContact!, 
                              address: { ...editedContact!.address, state: e.target.value || null }
                            })}
                            className="h-9"
                            placeholder="State"
                          />
                        ) : currentContact.address.state ? (
                          <p className="text-foreground font-medium text-sm">{currentContact.address.state}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0.5">ZIP</p>
                        {isEditMode ? (
                          <Input
                            value={editedContact?.address.zipCode || ""}
                            onChange={(e) => setEditedContact({ 
                              ...editedContact!, 
                              address: { ...editedContact!.address, zipCode: e.target.value }
                            })}
                            className="h-9"
                            placeholder="ZIP"
                          />
                        ) : currentContact.address.zipCode ? (
                          <p className="text-foreground font-medium text-sm">{currentContact.address.zipCode}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {(currentContact.address.country || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Country</p>
                        {isEditMode ? (
                          <Input
                            value={editedContact?.address.country || ""}
                            onChange={(e) => setEditedContact({ 
                              ...editedContact!, 
                              address: { ...editedContact!.address, country: e.target.value }
                            })}
                            className="h-9"
                            placeholder="Country"
                          />
                        ) : currentContact.address.country ? (
                          <p className="text-foreground font-medium">{currentContact.address.country}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Additional Info */}
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Additional Information
              </h3>
              <div className="space-y-3 text-sm">
                {currentContact.contactNumber && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground mb-0.5">Contact ID</p>
                      <p className="text-foreground font-mono">{currentContact.contactNumber}</p>
                    </div>
                  </div>
                )}
                {currentContact.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground mb-0.5">Created</p>
                      <p className="text-foreground">
                        {new Date(currentContact.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Notes */}
            <Separator />
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Notes
              </h3>
              {isEditMode ? (
                <div className="space-y-2">
                  {editedNotes.map((note, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={note}
                        onChange={(e) => {
                          const updated = [...editedNotes];
                          updated[index] = e.target.value;
                          setEditedNotes(updated);
                        }}
                        className="min-h-16 text-sm"
                        placeholder="Add a note..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = editedNotes.filter((_, i) => i !== index);
                          setEditedNotes(updated);
                        }}
                        className="shrink-0 h-8 w-8 p-0"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditedNotes([...editedNotes, ""])}
                    className="w-full"
                  >
                    Add Note
                  </Button>
                </div>
              ) : loadingNotes ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Loading notes...
                </div>
              ) : notes.length > 0 ? (
                <ul className="space-y-2">
                  {notes.map((note, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3"
                    >
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No notes available
                </div>
              )}
            </section>
            </div>

            {/* Footer */}
            <SheetFooter className="px-6 py-4 border-t gap-2">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={handleCancel} className="flex-1">
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {isNewContact ? "Create" : "Save"}
              </Button>
                </>
              ) : !isNewContact && onEdit ? (
                <Button onClick={handleEditClick} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Contact
                </Button>
              ) : null}
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ContactDetailsPanel;

