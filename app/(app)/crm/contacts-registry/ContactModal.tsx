"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, Edit, Calendar } from "lucide-react"
import type { Contact } from "./types"
import { cn } from "@/lib/utils"

interface ContactDetailDialogProps {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
  onEdit?: (contact: Contact) => void;
}

export function ContactDetailDialog({ 
  contact, 
  open, 
  onClose,
  onEdit 
}: ContactDetailDialogProps) {
  if (!contact) return null

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const location = `${contact.address.city}, ${contact.address.country}`;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'archived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-600 border-emerald-600';
      case 'inactive':
        return 'text-gray-600 border-gray-600';
      case 'pending':
        return 'text-amber-600 border-amber-600';
      case 'archived':
        return 'text-red-600 border-red-600';
      default:
        return 'text-gray-600 border-gray-600';
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-[620px] rounded-xl shadow-lg p-6 bg-background border border-border/60 overflow-hidden mx-auto"
        )}
      >
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {fullName}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {contact.title ? `${contact.title}${contact.department ? `, ${contact.department}` : ''}` : contact.department || ''}
              </DialogDescription>
            </div>
            <Badge
              variant={getStatusVariant(contact.status)}
              className={cn("capitalize", getStatusColor(contact.status))}
            >
              {contact.status}
            </Badge>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleEmailClick}
            >
              <Mail className="h-4 w-4 mr-1.5" /> Email
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handlePhoneClick}
            >
              <Phone className="h-4 w-4 mr-1.5" /> Call
            </Button>
            <Button size="sm" variant="outline">
              <Calendar className="h-4 w-4 mr-1.5" /> Activity
            </Button>
            {onEdit && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onEdit(contact)}
              >
                <Edit className="h-4 w-4 mr-1.5" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        {/* Scrollable content area */}
        <div
          className="
            max-h-[70vh]
            overflow-y-auto
            pr-2
            space-y-6
          "
        >
          {/* Company */}
          {contact.companyName && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Company
              </h3>
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-base font-medium">{contact.companyLegalName || contact.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-base font-medium">{location}</p>
                </div>
              </div>
            </section>
          )}

          <Separator />

          {/* Contact Info */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Contact Info
            </h3>
            <div className="grid grid-cols-2 gap-y-2">
              {contact.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-base font-medium text-primary hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-base font-medium text-primary hover:underline truncate"
                    title={contact.email}
                  >
                    {contact.email}
                  </a>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Personal Info */}
          {(contact.department || contact.title) && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-y-2">
                {contact.department && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="text-base font-medium">{contact.department}</p>
                  </div>
                )}
                {contact.title && (
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="text-base font-medium">{contact.title}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <Separator />

          {/* Address */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Address
            </h3>
            <div className="grid grid-cols-2 gap-y-2">
              {contact.address.street && (
                <div>
                  <p className="text-sm text-muted-foreground">Street</p>
                  <p className="text-base font-medium">{contact.address.street}</p>
                </div>
              )}
              {contact.address.city && (
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="text-base font-medium">{contact.address.city}</p>
                </div>
              )}
              {contact.address.state && (
                <div>
                  <p className="text-sm text-muted-foreground">State/Province</p>
                  <p className="text-base font-medium">{contact.address.state}</p>
                </div>
              )}
              {contact.address.zipCode && (
                <div>
                  <p className="text-sm text-muted-foreground">ZIP Code</p>
                  <p className="text-base font-medium font-mono">{contact.address.zipCode}</p>
                </div>
              )}
              {contact.address.country && (
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="text-base font-medium">{contact.address.country}</p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Meta */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Meta
            </h3>
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <div>
                <p className="text-muted-foreground">Contact ID</p>
                <p className="font-mono">{contact.contactNumber || contact.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{formatDate(contact.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p>{formatDate(contact.updatedAt)}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 flex justify-end">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ContactDetailDialog
