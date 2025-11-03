"use client";

import { User, Mail, MapPin, Phone, Building2, Calendar, X, Pencil } from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Contact } from "./types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface ViewContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onEdit?: (contact: Contact) => void;
}

export default function ViewContactDialog({
  open,
  onOpenChange,
  contact,
  onEdit,
}: ViewContactDialogProps) {
  if (!contact) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[25.92vw] h-[85vh] max-w-[432px] translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg flex flex-col overflow-hidden"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {fullName} - Contact Details
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            View contact information and details
          </DialogPrimitive.Description>
          <div className="relative flex flex-col flex-1 min-h-0">
            {/* Action buttons - absolute positioned in top right */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
              {onEdit && contact && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(contact)}
                  className="h-9 w-9"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit contact</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            {/* Header */}
            <div className="flex items-center px-8 pt-8 pb-4 border-b shrink-0 pr-24">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold">{fullName}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 pt-5 space-y-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      First Name
                    </div>
                    <p className="text-sm font-semibold">{contact.firstName}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Last Name
                    </div>
                    <p className="text-sm font-semibold">{contact.lastName}</p>
                  </div>
                  {contact.title && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        Title
                      </div>
                      <p className="text-sm">{contact.title}</p>
                    </div>
                  )}
                  {contact.department && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        Department
                      </div>
                      <p className="text-sm">{contact.department}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <Separator className="my-3" />
              <div>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </div>
                    <p className="text-sm break-all">{contact.email}</p>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        Phone
                      </div>
                      <p className="text-sm">{contact.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              {contact.companyName && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      Company
                    </h3>
                    <p className="text-sm">{contact.companyLegalName || contact.companyName}</p>
                  </div>
                </>
              )}

              {/* Address */}
              <Separator className="my-3" />
              <div>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Address
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Street
                    </div>
                    <p className="text-sm">{contact.address.street}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      City
                    </div>
                    <p className="text-sm">{contact.address.city}</p>
                  </div>
                  {contact.address.state && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        State/Province
                      </div>
                      <p className="text-sm">{contact.address.state}</p>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      ZIP Code
                    </div>
                    <p className="text-sm font-mono">{contact.address.zipCode}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Country
                    </div>
                    <p className="text-sm">{contact.address.country}</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <Separator className="my-3" />
              <div>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Metadata
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Created At
                    </div>
                    <p className="text-sm">{formatDate(contact.createdAt)}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Last Updated
                    </div>
                    <p className="text-sm">{formatDate(contact.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

