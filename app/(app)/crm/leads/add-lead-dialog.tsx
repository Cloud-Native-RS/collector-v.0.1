"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { crmApi, type CreateLeadInput, type LeadSource, type LeadStatus } from "@/lib/api/crm";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface LeadFormData {
  title: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  companyType: string;
  tradingName: string;
  companyWebsite: string;
  companyIndustry: string;
  companySize: string;
  companyAddress: string;
  companyTaxId: string;
  companyRegistrationNumber: string;
  legalRepName: string;
  legalRepTitle: string;
  legalRepEmail: string;
  legalRepPhone: string;
  source: LeadSource;
  status: LeadStatus;
  value: string;
  notes: string;
}

export default function AddLeadDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    title: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    companyType: "",
    tradingName: "",
    companyWebsite: "",
    companyIndustry: "",
    companySize: "",
    companyAddress: "",
    companyTaxId: "",
    companyRegistrationNumber: "",
    legalRepName: "",
    legalRepTitle: "",
    legalRepEmail: "",
    legalRepPhone: "",
    source: "OTHER",
    status: "NEW",
    value: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      name: "",
      email: "",
      phone: "",
      company: "",
      companyType: "",
      tradingName: "",
      companyWebsite: "",
      companyIndustry: "",
      companySize: "",
      companyAddress: "",
      companyTaxId: "",
      companyRegistrationNumber: "",
      legalRepName: "",
      legalRepTitle: "",
      legalRepEmail: "",
      legalRepPhone: "",
      source: "OTHER",
      status: "NEW",
      value: "",
      notes: "",
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields (Name and Email)");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const createData: CreateLeadInput = {
        title: formData.title.trim() || undefined,
        name: formData.name.trim(),
        email: formData.email.trim(),
        source: formData.source,
        status: formData.status,
      };

      // Add optional fields only if they have values
      if (formData.phone.trim()) {
        createData.phone = formData.phone.trim();
      }
      if (formData.company.trim()) {
        createData.company = formData.company.trim();
      }
      if (formData.companyType.trim()) {
        createData.companyType = formData.companyType.trim();
      }
      if (formData.tradingName.trim()) {
        createData.tradingName = formData.tradingName.trim();
      }
      if (formData.companyWebsite.trim()) {
        createData.companyWebsite = formData.companyWebsite.trim();
      }
      if (formData.companyIndustry.trim()) {
        createData.companyIndustry = formData.companyIndustry.trim();
      }
      if (formData.companySize.trim()) {
        createData.companySize = formData.companySize.trim();
      }
      if (formData.companyAddress.trim()) {
        createData.companyAddress = formData.companyAddress.trim();
      }
      if (formData.companyTaxId.trim()) {
        createData.companyTaxId = formData.companyTaxId.trim();
      }
      if (formData.companyRegistrationNumber.trim()) {
        createData.companyRegistrationNumber = formData.companyRegistrationNumber.trim();
      }
      if (formData.legalRepName.trim()) {
        createData.legalRepName = formData.legalRepName.trim();
      }
      if (formData.legalRepTitle.trim()) {
        createData.legalRepTitle = formData.legalRepTitle.trim();
      }
      if (formData.legalRepEmail.trim()) {
        createData.legalRepEmail = formData.legalRepEmail.trim();
      }
      if (formData.legalRepPhone.trim()) {
        createData.legalRepPhone = formData.legalRepPhone.trim();
      }
      if (formData.value.trim()) {
        const parsedValue = parseFloat(formData.value);
        if (!isNaN(parsedValue) && parsedValue >= 0) {
          createData.value = parsedValue;
        }
      }
      if (formData.notes.trim()) {
        createData.notes = formData.notes.trim();
      }

      await crmApi.createLead(createData);

      toast.success("Lead created successfully!");
      resetForm();
      onSuccess();
      handleOpenChange(false);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      toast.error(
        `Failed to create lead: ${error.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new sales lead. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Lead Title <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Website Redesign Project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Contact Name * <span className="text-muted-foreground text-xs">(Person Name)</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: LeadSource) =>
                    setFormData({ ...formData, source: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="SOCIAL">Social Media</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="CALL">Phone Call</SelectItem>
                    <SelectItem value="REFERRAL">Referral</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: LeadStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                    <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Estimated Value</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Company Information (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Company Inc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type</Label>
                <Input
                  id="companyType"
                  value={formData.companyType}
                  onChange={(e) =>
                    setFormData({ ...formData, companyType: e.target.value })
                  }
                  placeholder="LLC, Corporation, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tradingName">Trading Name</Label>
                <Input
                  id="tradingName"
                  value={formData.tradingName}
                  onChange={(e) =>
                    setFormData({ ...formData, tradingName: e.target.value })
                  }
                  placeholder="DBA name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) =>
                    setFormData({ ...formData, companyWebsite: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyIndustry">Industry</Label>
                <Input
                  id="companyIndustry"
                  value={formData.companyIndustry}
                  onChange={(e) =>
                    setFormData({ ...formData, companyIndustry: e.target.value })
                  }
                  placeholder="Technology, Retail, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Input
                  id="companySize"
                  value={formData.companySize}
                  onChange={(e) =>
                    setFormData({ ...formData, companySize: e.target.value })
                  }
                  placeholder="1-10, 11-50, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) =>
                  setFormData({ ...formData, companyAddress: e.target.value })
                }
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyTaxId">Tax ID</Label>
                <Input
                  id="companyTaxId"
                  value={formData.companyTaxId}
                  onChange={(e) =>
                    setFormData({ ...formData, companyTaxId: e.target.value })
                  }
                  placeholder="12-3456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyRegistrationNumber">Registration Number</Label>
                <Input
                  id="companyRegistrationNumber"
                  value={formData.companyRegistrationNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyRegistrationNumber: e.target.value,
                    })
                  }
                  placeholder="Registration number"
                />
              </div>
            </div>
          </div>

          {/* Legal Representative */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-foreground">Legal Representative (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalRepName">Name</Label>
                <Input
                  id="legalRepName"
                  value={formData.legalRepName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalRepName: e.target.value })
                  }
                  placeholder="Legal representative name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalRepTitle">Title</Label>
                <Input
                  id="legalRepTitle"
                  value={formData.legalRepTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, legalRepTitle: e.target.value })
                  }
                  placeholder="CEO, Director, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalRepEmail">Email</Label>
                <Input
                  id="legalRepEmail"
                  type="email"
                  value={formData.legalRepEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, legalRepEmail: e.target.value })
                  }
                  placeholder="legal@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalRepPhone">Phone</Label>
                <Input
                  id="legalRepPhone"
                  type="tel"
                  value={formData.legalRepPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, legalRepPhone: e.target.value })
                  }
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about this lead..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

