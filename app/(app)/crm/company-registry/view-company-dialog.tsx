"use client";

import { Building2, Globe, Mail, MapPin, Phone, User, Briefcase, CreditCard, Calendar, X, Pencil } from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Company } from "./types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface ViewCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onEdit?: (company: Company) => void;
}

export default function ViewCompanyDialog({
  open,
  onOpenChange,
  company,
  onEdit,
}: ViewCompanyDialogProps) {
  if (!company) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[34.56vw] h-[85vh] max-w-[576px] translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg flex flex-col overflow-hidden"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {company.legalName} - Company Details
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            View company information and details
          </DialogPrimitive.Description>
          <div className="relative flex flex-col flex-1 min-h-0">
            {/* Action buttons - absolute positioned in top right */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
              {onEdit && company && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(company)}
                  className="h-9 w-9"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit company</span>
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
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">{company.legalName}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-8 pt-5 space-y-4">
            {/* Basic Information */}
            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Legal Name
                  </div>
                  <p className="text-sm font-semibold">{company.legalName}</p>
                </div>
                {company.industry && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      Industry
                    </div>
                    <p className="text-sm">{company.industry}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Tax ID
                  </div>
                  <p className="text-sm font-mono">{company.taxId}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Registration Number
                  </div>
                  <p className="text-sm font-mono">{company.registrationNumber}</p>
                </div>
              </div>
            </div>

            {/* Contact Information - Only show if no Contact Persons exist */}
            {(!company.contactPersons || company.contactPersons.length === 0) && (
              <>
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
                      <p className="text-sm">{company.contactInfo.email}</p>
                    </div>
                    {company.contactInfo.phone && (
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Phone
                        </div>
                        <p className="text-sm">{company.contactInfo.phone}</p>
                      </div>
                    )}
                    {company.contactInfo.website && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </div>
                        <a 
                          href={company.contactInfo.website.startsWith('http') ? company.contactInfo.website : `https://${company.contactInfo.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {company.contactInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Website - Show separately if Contact Persons exist */}
            {company.contactPersons && company.contactPersons.length > 0 && company.contactInfo.website && (
              <>
                <Separator className="my-3" />
                <div>
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    Website
                  </h3>
                  <a 
                    href={company.contactInfo.website.startsWith('http') ? company.contactInfo.website : `https://${company.contactInfo.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {company.contactInfo.website}
                  </a>
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
                  <p className="text-sm">{company.address.street}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    City
                  </div>
                  <p className="text-sm">{company.address.city}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    ZIP Code
                  </div>
                  <p className="text-sm font-mono">{company.address.zipCode}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Country
                  </div>
                  <p className="text-sm">{company.address.country}</p>
                </div>
              </div>
            </div>

            {/* Legal Representative */}
            {(company.legalRepresentative.name || company.legalRepresentative.email) && (
              <>
                <Separator className="my-3" />
                <div>
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    Legal Representative
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {company.legalRepresentative.name && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Name
                        </div>
                        <p className="text-sm">{company.legalRepresentative.name}</p>
                      </div>
                    )}
                    {company.legalRepresentative.email && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </div>
                        <p className="text-sm break-all">{company.legalRepresentative.email}</p>
                      </div>
                    )}
                    {company.legalRepresentative.title && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Title
                        </div>
                        <p className="text-sm">{company.legalRepresentative.title}</p>
                      </div>
                    )}
                    {company.legalRepresentative.phone && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Phone
                        </div>
                        <p className="text-sm">{company.legalRepresentative.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Bank Account */}
            {company.bankAccount && (company.bankAccount.bankName || company.bankAccount.accountNumber) && (
              <>
                <Separator className="my-3" />
                <div>
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    Bank Account
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    {company.bankAccount.bankName && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Bank Name
                        </div>
                        <p className="text-sm">{company.bankAccount.bankName}</p>
                      </div>
                    )}
                    {company.bankAccount.accountNumber && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Account Number
                        </div>
                        <p className="text-sm font-mono break-all">{company.bankAccount.accountNumber}</p>
                      </div>
                    )}
                    {company.bankAccount.routingNumber && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          Routing Number
                        </div>
                        <p className="text-sm font-mono">{company.bankAccount.routingNumber}</p>
                      </div>
                    )}
                    {company.bankAccount.iban && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          IBAN
                        </div>
                        <p className="text-sm font-mono break-all">{company.bankAccount.iban}</p>
                      </div>
                    )}
                    {company.bankAccount.swift && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          SWIFT
                        </div>
                        <p className="text-sm font-mono">{company.bankAccount.swift}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

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
                  <p className="text-sm">{formatDate(company.createdAt)}</p>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Last Updated
                  </div>
                  <p className="text-sm">{formatDate(company.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Contact Persons - Accordion at the end */}
            {company.contactPersons && company.contactPersons.length > 0 && (
              <>
                <Separator className="my-3" />
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="contact-persons">
                    <AccordionTrigger>
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        <span className="text-base font-semibold">Contact Persons ({company.contactPersons.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-y-4">
                        {company.contactPersons.map((contact, index) => (
                          <div 
                            key={contact.id || index} 
                            className="p-3 border rounded-lg space-y-3 bg-muted/30"
                          >
                            <div className="flex items-start gap-2">
                              <div className="p-1.5 bg-primary/10 rounded-full">
                                <User className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm">
                                  {contact.firstName} {contact.lastName}
                                  {(contact.title || contact.department) && (
                                    <span className="text-xs text-muted-foreground font-normal ml-2">
                                      {contact.title && <span>{contact.title}</span>}
                                      {contact.title && contact.department && <span> • </span>}
                                      {contact.department && <span>{contact.department}</span>}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {(contact.email || contact.phone) && (
                              <div className="space-y-2 pt-2.5 border-t">
                                {contact.email && (
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                      <Mail className="h-3.5 w-3.5" />
                                      Email
                                    </div>
                                    <p className="text-sm break-all">{contact.email}</p>
                                  </div>
                                )}
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
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

