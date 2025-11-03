"use client";

import { Building2, Mail, Phone, MapPin, User, Briefcase, CreditCard, Calendar, X, Pencil, Copy, Check, Globe, Users, Info } from "lucide-react";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Company } from "./types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CompanyDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onEdit?: (company: Company) => void;
}

export default function CompanyDetailsDialog({
  open,
  onOpenChange,
  company,
  onEdit,
}: CompanyDetailsDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!company) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'liquidated':
        return <Badge variant="destructive">Liquidated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const CopyButton = ({ text, field, className }: { text: string; field: string; className?: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={() => handleCopy(text, field)}
      aria-label="Copy"
    >
      {copiedField === field ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-4xl h-[90vh] translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg flex flex-col overflow-hidden"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {company.legalName} - Company Details
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            View and edit company information
          </DialogPrimitive.Description>

          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold truncate">{company.legalName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(company.status)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onEdit && company && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(company)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <div className="px-6 pt-4">
                <TabsList>
                  <TabsTrigger value="overview" className="gap-2">
                    <Info className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="gap-2">
                    <Users className="h-4 w-4" />
                    Contacts
                    {company.contactPersons && company.contactPersons.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {company.contactPersons.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Info
                  </TabsTrigger>
                  <TabsTrigger value="metadata" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Metadata
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6 pb-6">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Legal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Legal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Legal Name
                        </div>
                        <p className="text-sm font-semibold">{company.legalName}</p>
                      </div>
                      {company.tradingName && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Trading Name
                          </div>
                          <p className="text-sm">{company.tradingName}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Company Type
                        </div>
                        <p className="text-sm">{company.companyType}</p>
                      </div>
                      {company.industry && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Industry
                          </div>
                          <p className="text-sm">{company.industry}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                          <span>Tax ID</span>
                          <CopyButton text={company.taxId} field="taxId" />
                        </div>
                        <p className="text-sm font-mono">{company.taxId}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Registration Number
                        </div>
                        <p className="text-sm font-mono">{company.registrationNumber}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Street
                        </div>
                        <p className="text-sm">{company.address.street}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          City
                        </div>
                        <p className="text-sm">{company.address.city}</p>
                      </div>
                      {company.address.state && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            State
                          </div>
                          <p className="text-sm">{company.address.state}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          ZIP Code
                        </div>
                        <p className="text-sm font-mono">{company.address.zipCode}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Country
                        </div>
                        <p className="text-sm">{company.address.country}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Legal Representative */}
                  {(company.legalRepresentative.name || company.legalRepresentative.email) && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Legal Representative
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {company.legalRepresentative.name && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Name
                            </div>
                            <p className="text-sm font-semibold">{company.legalRepresentative.name}</p>
                          </div>
                        )}
                        {company.legalRepresentative.title && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Title
                            </div>
                            <p className="text-sm">{company.legalRepresentative.title}</p>
                          </div>
                        )}
                        {company.legalRepresentative.email && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                Email
                              </span>
                              <CopyButton text={company.legalRepresentative.email} field="legalRepEmail" />
                            </div>
                            <p className="text-sm break-all">{company.legalRepresentative.email}</p>
                          </div>
                        )}
                        {company.legalRepresentative.phone && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              Phone
                            </div>
                            <p className="text-sm">{company.legalRepresentative.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {company.contactInfo && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Phone className="h-5 w-5 text-primary" />
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          {company.contactInfo.email && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5" />
                                  Email
                                </span>
                                <CopyButton text={company.contactInfo.email} field="contactEmail" />
                              </div>
                              <p className="text-sm break-all">{company.contactInfo.email}</p>
                            </div>
                          )}
                          {company.contactInfo.phone && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                Phone
                              </div>
                              <p className="text-sm">{company.contactInfo.phone}</p>
                            </div>
                          )}
                          {company.contactInfo.website && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
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
                </TabsContent>

                {/* Contacts Tab */}
                <TabsContent value="contacts" className="mt-6">
                  <div className="space-y-4">
                    {company.contactPersons && company.contactPersons.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {company.contactPersons.map((contact, index) => (
                          <div
                            key={contact.id || index}
                            className="p-4 border rounded-lg space-y-3 bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-base">
                                  {contact.firstName} {contact.lastName}
                                </p>
                                {(contact.title || contact.department) && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {contact.title && <span>{contact.title}</span>}
                                    {contact.title && contact.department && <span> • </span>}
                                    {contact.department && <span>{contact.department}</span>}
                                  </p>
                                )}
                              </div>
                            </div>
                            {(contact.email || contact.phone) && (
                              <div className="space-y-2 pt-2 border-t">
                                {contact.email && (
                                  <div className="flex items-center gap-3">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                      <Mail className="h-3.5 w-3.5" />
                                      Email
                                    </div>
                                    <CopyButton text={contact.email} field={`contactEmail-${index}`} />
                                    <p className="text-sm break-all flex-1">{contact.email}</p>
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
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">No contact persons added yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Bank Info Tab */}
                <TabsContent value="bank" className="mt-6">
                  {company.bankAccount && (company.bankAccount.bankName || company.bankAccount.accountNumber) ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Bank Account Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {company.bankAccount.bankName && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Bank Name
                            </div>
                            <p className="text-sm font-semibold">{company.bankAccount.bankName}</p>
                          </div>
                        )}
                        {company.bankAccount.accountNumber && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Account Number
                            </div>
                            <p className="text-sm font-mono break-all">{company.bankAccount.accountNumber}</p>
                          </div>
                        )}
                        {company.bankAccount.routingNumber && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Routing Number
                            </div>
                            <p className="text-sm font-mono">{company.bankAccount.routingNumber}</p>
                          </div>
                        )}
                        {company.bankAccount.iban && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                              <span>IBAN</span>
                              <CopyButton text={company.bankAccount.iban} field="iban" />
                            </div>
                            <p className="text-sm font-mono break-all">{company.bankAccount.iban}</p>
                          </div>
                        )}
                        {company.bankAccount.swift && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              SWIFT Code
                            </div>
                            <p className="text-sm font-mono">{company.bankAccount.swift}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No bank account information available</p>
                    </div>
                  )}
                </TabsContent>

                {/* Metadata Tab */}
                <TabsContent value="metadata" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Audit Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Created At
                        </div>
                        <p className="text-sm font-medium">{formatDate(company.createdAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Last Updated
                        </div>
                        <p className="text-sm font-medium">{formatDate(company.updatedAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Company Number
                        </div>
                        <p className="text-sm font-mono">{company.companyNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Tenant ID
                        </div>
                        <p className="text-sm font-mono">{company.tenantId}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Placeholder for audit log */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Activity Log</h4>
                      <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                        Audit log coming soon...
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

