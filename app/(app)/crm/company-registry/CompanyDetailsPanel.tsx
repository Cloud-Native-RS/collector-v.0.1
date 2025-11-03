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
import { 
  Mail, Phone, Edit, Building2, MapPin, Hash, Calendar, Globe, Briefcase, Save, X as XIcon,
  CreditCard, User, Users, FileText
} from "lucide-react";
import type { Company } from "./types";
import { cn } from "@/lib/utils";

interface CompanyDetailsPanelProps {
  company: Company | null;
  open: boolean;
  onClose: (open: boolean) => void;
  onEdit?: (company: Company) => void;
  onSave?: (company: Company) => void;
  isNewCompany?: boolean;
  onCreate?: (company: Company) => void;
}

export function CompanyDetailsPanel({
  company,
  open,
  onClose,
  onEdit,
  onSave,
  isNewCompany = false,
  onCreate,
}: CompanyDetailsPanelProps) {
  // For new company, create a default empty company
  const defaultNewCompany: Company = {
    id: 0,
    originalId: undefined,
    companyNumber: "",
    legalName: "",
    tradingName: "",
    companyType: "Other",
    taxId: "",
    registrationNumber: "",
    status: "pending",
    industry: "",
    address: {
      street: "",
      city: "",
      state: null,
      zipCode: "",
      country: "",
    },
    contactInfo: {
      email: "",
      phone: "",
      website: null,
    },
    bankAccount: {
      bankName: "",
      accountNumber: "",
      routingNumber: null,
      iban: null,
      swift: null,
    },
    legalRepresentative: {
      name: "",
      title: "",
      email: "",
      phone: "",
    },
    contactPersons: undefined,
    tenantId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [isEditMode, setIsEditMode] = useState(isNewCompany);
  const [editedCompany, setEditedCompany] = useState<Company | null>(isNewCompany ? defaultNewCompany : null);

  // Initialize edit state when company changes
  useEffect(() => {
    if (isNewCompany) {
      setEditedCompany(defaultNewCompany);
      setIsEditMode(true);
    } else if (company) {
      setEditedCompany({ ...company });
      setIsEditMode(false);
    }
  }, [company, isNewCompany]);

  useEffect(() => {
    if (!open && !isNewCompany) {
      setIsEditMode(false);
    }
  }, [open, isNewCompany]);

  if (!isNewCompany && !company && !editedCompany) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className={cn("w-[400px] sm:w-[500px]")}>
          <SheetHeader>
            <SheetTitle>Company Details</SheetTitle>
            <SheetDescription>No company selected</SheetDescription>
          </SheetHeader>
          <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
            <p>Select a company to view details</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const displayCompany = isEditMode && editedCompany ? editedCompany : (company || editedCompany);
  const currentCompany = displayCompany || (isNewCompany ? editedCompany : null);
  if (!currentCompany && !isNewCompany) return null;

  const companyName = currentCompany.legalName || currentCompany.tradingName || "Company";
  const initials = companyName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'liquidated':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    if (company) {
      setEditedCompany({ ...company });
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    if (company) {
      setEditedCompany({ ...company });
    }
  };

  const handleSave = () => {
    if (editedCompany) {
      if (isNewCompany && onCreate) {
        onCreate(editedCompany);
        setEditedCompany({ ...defaultNewCompany });
        onClose(false);
      } else if (onSave) {
        onSave(editedCompany);
        setIsEditMode(false);
      } else {
        console.log(isNewCompany ? "Creating company:" : "Saving company:", editedCompany);
        if (isNewCompany) {
          onClose(false);
        } else {
          setIsEditMode(false);
        }
      }
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
              <SheetTitle className="sr-only">
                {isNewCompany ? "New Company" : (currentCompany ? companyName : "Company Details")}
              </SheetTitle>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarImage src={undefined} alt={companyName} />
                  <AvatarFallback className="text-lg font-semibold">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <h2 className="text-xl font-semibold mb-1">
                        {isNewCompany ? "New Company" : "Edit Company"}
                      </h2>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Legal Name</label>
                        <Input
                          value={editedCompany?.legalName || ""}
                          onChange={(e) => setEditedCompany({ ...editedCompany!, legalName: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Trading Name</label>
                        <Input
                          value={editedCompany?.tradingName || ""}
                          onChange={(e) => setEditedCompany({ ...editedCompany!, tradingName: e.target.value })}
                          className="h-9"
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Status</label>
                        <Select
                          value={editedCompany?.status || "pending"}
                          onValueChange={(value) => setEditedCompany({ ...editedCompany!, status: value as Company["status"] })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="liquidated">Liquidated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold mb-1">
                        {companyName}
                      </h2>
                      {currentCompany.tradingName && currentCompany.tradingName !== currentCompany.legalName && (
                        <SheetDescription className="text-sm text-muted-foreground mb-2">
                          Trading as: {currentCompany.tradingName}
                        </SheetDescription>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge
                          variant={getStatusVariant(currentCompany.status)}
                          className="capitalize"
                        >
                          {currentCompany.status}
                        </Badge>
                        {currentCompany.companyType && (
                          <Badge variant="outline">
                            {currentCompany.companyType}
                          </Badge>
                        )}
                      </div>
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
                          value={editedCompany?.contactInfo.email || ""}
                          onChange={(e) => setEditedCompany({ 
                            ...editedCompany!, 
                            contactInfo: { ...editedCompany!.contactInfo, email: e.target.value }
                          })}
                          className="h-9"
                        />
                      ) : currentCompany.contactInfo.email ? (
                        <a
                          href={`mailto:${currentCompany.contactInfo.email}`}
                          className="text-sm font-medium text-primary hover:underline truncate block"
                          title={currentCompany.contactInfo.email}
                        >
                          {currentCompany.contactInfo.email}
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
                          value={editedCompany?.contactInfo.phone || ""}
                          onChange={(e) => setEditedCompany({ 
                            ...editedCompany!, 
                            contactInfo: { ...editedCompany!.contactInfo, phone: e.target.value }
                          })}
                          className="h-9"
                        />
                      ) : currentCompany.contactInfo.phone ? (
                        <a
                          href={`tel:${currentCompany.contactInfo.phone}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {currentCompany.contactInfo.phone}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>

                  {(currentCompany.contactInfo.website || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Website</p>
                        {isEditMode ? (
                          <Input
                            type="url"
                            value={editedCompany?.contactInfo.website || ""}
                            onChange={(e) => setEditedCompany({ 
                              ...editedCompany!, 
                              contactInfo: { ...editedCompany!.contactInfo, website: e.target.value || null }
                            })}
                            className="h-9"
                            placeholder="https://..."
                          />
                        ) : currentCompany.contactInfo.website ? (
                          <a
                            href={currentCompany.contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline truncate block"
                          >
                            {currentCompany.contactInfo.website}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Address Information */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Address
                </h3>
                <div className="space-y-3">
                  {(currentCompany.address.street || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Street</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.address.street || ""}
                            onChange={(e) => setEditedCompany({ 
                              ...editedCompany!, 
                              address: { ...editedCompany!.address, street: e.target.value }
                            })}
                            className="h-9"
                            placeholder="Street Address"
                          />
                        ) : currentCompany.address.street ? (
                          <p className="text-sm font-medium text-foreground">{currentCompany.address.street}</p>
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
                            value={editedCompany?.address.city || ""}
                            onChange={(e) => setEditedCompany({ 
                              ...editedCompany!, 
                              address: { ...editedCompany!.address, city: e.target.value }
                            })}
                            className="h-9"
                            placeholder="City"
                          />
                        ) : currentCompany.address.city ? (
                          <p className="text-foreground font-medium text-sm">{currentCompany.address.city}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0.5">State</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.address.state || ""}
                            onChange={(e) => setEditedCompany({ 
                              ...editedCompany!, 
                              address: { ...editedCompany!.address, state: e.target.value || null }
                            })}
                            className="h-9"
                            placeholder="State"
                          />
                        ) : currentCompany.address.state ? (
                          <p className="text-foreground font-medium text-sm">{currentCompany.address.state}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-0.5">ZIP</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.address.zipCode || ""}
                            onChange={(e) => setEditedCompany({ 
                              ...editedCompany!, 
                              address: { ...editedCompany!.address, zipCode: e.target.value }
                            })}
                            className="h-9"
                            placeholder="ZIP"
                          />
                        ) : currentCompany.address.zipCode ? (
                          <p className="text-foreground font-medium text-sm">{currentCompany.address.zipCode}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {(currentCompany.address.country || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Country</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.address.country || ""}
                            onChange={(e) => setEditedCompany({ 
                              ...editedCompany!, 
                              address: { ...editedCompany!.address, country: e.target.value }
                            })}
                            className="h-9"
                            placeholder="Country"
                          />
                        ) : currentCompany.address.country ? (
                          <p className="text-sm font-medium text-foreground">{currentCompany.address.country}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Company Details */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Company Details
                </h3>
                <div className="space-y-3">
                  {(currentCompany.companyNumber || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Company Number</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.companyNumber || ""}
                            onChange={(e) => setEditedCompany({ ...editedCompany!, companyNumber: e.target.value })}
                            className="h-9"
                          />
                        ) : currentCompany.companyNumber ? (
                          <p className="text-sm font-medium text-foreground">{currentCompany.companyNumber}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(currentCompany.taxId || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Tax ID</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.taxId || ""}
                            onChange={(e) => setEditedCompany({ ...editedCompany!, taxId: e.target.value })}
                            className="h-9"
                          />
                        ) : currentCompany.taxId ? (
                          <p className="text-sm font-medium text-foreground">{currentCompany.taxId}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(currentCompany.registrationNumber || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Registration Number</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.registrationNumber || ""}
                            onChange={(e) => setEditedCompany({ ...editedCompany!, registrationNumber: e.target.value })}
                            className="h-9"
                          />
                        ) : currentCompany.registrationNumber ? (
                          <p className="text-sm font-medium text-foreground">{currentCompany.registrationNumber}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(currentCompany.industry || isEditMode) && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Industry</p>
                        {isEditMode ? (
                          <Input
                            value={editedCompany?.industry || ""}
                            onChange={(e) => setEditedCompany({ ...editedCompany!, industry: e.target.value })}
                            className="h-9"
                            placeholder="Industry"
                          />
                        ) : currentCompany.industry ? (
                          <p className="text-sm font-medium text-foreground">{currentCompany.industry}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                    </div>
                  )}
                  {isEditMode && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Company Type</p>
                        <Select
                          value={editedCompany?.companyType || "Other"}
                          onValueChange={(value) => setEditedCompany({ ...editedCompany!, companyType: value as Company["companyType"] })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Corporation">Corporation</SelectItem>
                            <SelectItem value="Limited Liability Company">Limited Liability Company</SelectItem>
                            <SelectItem value="Private Limited Company">Private Limited Company</SelectItem>
                            <SelectItem value="Public Limited Company">Public Limited Company</SelectItem>
                            <SelectItem value="Gesellschaft mit beschränkter Haftung">GmbH</SelectItem>
                            <SelectItem value="Société à Responsabilité Limitée">SARL</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Legal Representative */}
              {(currentCompany.legalRepresentative.name || currentCompany.legalRepresentative.email || isEditMode) && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Legal Representative
                  </h3>
                  <div className="space-y-3">
                    {(currentCompany.legalRepresentative.name || isEditMode) && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Name</p>
                          {isEditMode ? (
                            <Input
                              value={editedCompany?.legalRepresentative.name || ""}
                              onChange={(e) => setEditedCompany({ 
                                ...editedCompany!, 
                                legalRepresentative: { ...editedCompany!.legalRepresentative, name: e.target.value }
                              })}
                              className="h-9"
                              placeholder="Legal Representative Name"
                            />
                          ) : currentCompany.legalRepresentative.name ? (
                            <p className="text-sm font-medium text-foreground">{currentCompany.legalRepresentative.name}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>
                    )}
                    {(currentCompany.legalRepresentative.email || isEditMode) && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Email</p>
                          {isEditMode ? (
                            <Input
                              type="email"
                              value={editedCompany?.legalRepresentative.email || ""}
                              onChange={(e) => setEditedCompany({ 
                                ...editedCompany!, 
                                legalRepresentative: { ...editedCompany!.legalRepresentative, email: e.target.value }
                              })}
                              className="h-9"
                            />
                          ) : currentCompany.legalRepresentative.email ? (
                            <a
                              href={`mailto:${currentCompany.legalRepresentative.email}`}
                              className="text-sm font-medium text-primary hover:underline truncate block"
                            >
                              {currentCompany.legalRepresentative.email}
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>
                    )}
                    {(currentCompany.legalRepresentative.phone || isEditMode) && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-0.5">Phone</p>
                          {isEditMode ? (
                            <Input
                              type="tel"
                              value={editedCompany?.legalRepresentative.phone || ""}
                              onChange={(e) => setEditedCompany({ 
                                ...editedCompany!, 
                                legalRepresentative: { ...editedCompany!.legalRepresentative, phone: e.target.value }
                              })}
                              className="h-9"
                            />
                          ) : currentCompany.legalRepresentative.phone ? (
                            <a
                              href={`tel:${currentCompany.legalRepresentative.phone}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {currentCompany.legalRepresentative.phone}
                            </a>
                          ) : (
                            <p className="text-sm text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <Separator />

              {/* Additional Info */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Additional Information
                </h3>
                <div className="space-y-3 text-sm">
                  {currentCompany.createdAt && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-0.5">Created</p>
                        <p className="text-sm text-foreground">
                          {new Date(currentCompany.createdAt).toLocaleDateString('en-US', {
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
                    {isNewCompany ? "Create" : "Save"}
                  </Button>
                </>
              ) : !isNewCompany && onEdit ? (
                <Button onClick={handleEditClick} className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Company
                </Button>
              ) : null}
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CompanyDetailsPanel;

