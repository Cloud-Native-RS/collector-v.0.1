"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { companiesApi, CreateCompanyInput } from "@/lib/api/registry";
import { toast } from "sonner";
import { type Company } from "./types";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  company?: Company;
}

export default function AddCompanyDialog({
  open,
  onOpenChange,
  onSuccess,
  company,
}: AddCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("active");
  const [formData, setFormData] = useState<CreateCompanyInput>({
    companyType: "LLC",
    legalName: "",
    taxId: "",
    registrationNumber: "",
    industry: "",
    legalRepName: "",
    legalRepTitle: "",
    legalRepEmail: "",
    legalRepPhone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    contact: {
      email: "",
      phone: "",
      website: "",
    },
    bankAccount: {
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      iban: "",
      swift: "",
    },
  });

  // Populate form when company prop changes (edit mode)
  useEffect(() => {
    if (company && open) {
      setStatus(company.status || "active");
      setFormData({
        companyType: company.companyType === "Limited Liability Company" ? "LLC" : company.companyType,
        legalName: company.legalName || "",
        taxId: company.taxId || "",
        registrationNumber: company.registrationNumber || "",
        industry: company.industry || "",
        legalRepName: company.legalRepresentative?.name || "",
        legalRepTitle: company.legalRepresentative?.title || "",
        legalRepEmail: company.legalRepresentative?.email || "",
        legalRepPhone: company.legalRepresentative?.phone || "",
        address: {
          street: company.address?.street || "",
          city: company.address?.city || "",
          state: company.address?.state || "",
          zipCode: company.address?.zipCode || "",
          country: company.address?.country || "",
        },
        contact: {
          email: company.contactInfo?.email || "",
          phone: company.contactInfo?.phone || "",
          website: company.contactInfo?.website || "",
        },
        bankAccount: {
          bankName: company.bankAccount?.bankName || "",
          accountNumber: company.bankAccount?.accountNumber || "",
          routingNumber: company.bankAccount?.routingNumber || "",
          iban: company.bankAccount?.iban || "",
          swift: company.bankAccount?.swift || "",
        },
      });
    } else if (!company && open) {
      // Reset form when opening in add mode
      setStatus("active");
      setFormData({
        companyType: "LLC",
        legalName: "",
        taxId: "",
        registrationNumber: "",
        industry: "",
        legalRepName: "",
        legalRepTitle: "",
        legalRepEmail: "",
        legalRepPhone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        contact: {
          email: "",
          phone: "",
          website: "",
        },
        bankAccount: {
          bankName: "",
          accountNumber: "",
          routingNumber: "",
          iban: "",
          swift: "",
        },
      });
    }
  }, [company, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.legalName || !formData.taxId || !formData.registrationNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.address.street || !formData.address.city || !formData.address.zipCode || !formData.address.country) {
      toast.error("Please fill in all required address fields");
      return;
    }

    if (!formData.contact.email) {
      toast.error("Please provide a contact email");
      return;
    }

    try {
      setLoading(true);
      if (company) {
        // Update existing company - use originalId if available
        // If originalId is not set, it means the company was loaded before the fix
        // We need to reload from API to get the proper ID
        let companyId = company.originalId;
        
        if (!companyId) {
          console.warn('Company missing originalId, attempting to reload from API');
          // Try to reload the company from API to get the proper ID
          try {
            const response = await companiesApi.list({ take: 1000 });
            const foundCompany = response.data?.find(
              (c: any) => c.companyNumber === company.companyNumber || c.legalName === company.legalName
            );
            if (foundCompany && foundCompany.id) {
              companyId = foundCompany.id;
              console.log('Found company with ID:', companyId);
            } else {
              toast.error('Could not find company in API. Please refresh the page.');
              return;
            }
          } catch (error: any) {
            console.error('Failed to reload company:', error);
            toast.error('Please refresh the page and try again. Company data needs to be reloaded.');
            return;
          }
        }
        
        console.log('Updating company with ID:', companyId);
        // Prepare update data - only send fields that API accepts for update
        // Note: address, contact, and bankAccount are not updated through this endpoint
        const updateData: any = {
          status: status.toUpperCase(), // Convert to uppercase format (ACTIVE, INACTIVE, etc.)
        };
        
        // Only include fields that have values (not empty strings)
        if (formData.tradingName?.trim()) {
          updateData.tradingName = formData.tradingName.trim();
        }
        if (formData.industry?.trim()) {
          updateData.industry = formData.industry.trim();
        }
        if (formData.legalRepName?.trim()) {
          updateData.legalRepName = formData.legalRepName.trim();
        }
        if (formData.legalRepTitle?.trim()) {
          updateData.legalRepTitle = formData.legalRepTitle.trim();
        }
        if (formData.legalRepEmail?.trim()) {
          updateData.legalRepEmail = formData.legalRepEmail.trim();
        }
        if (formData.legalRepPhone?.trim()) {
          updateData.legalRepPhone = formData.legalRepPhone.trim();
        }
        
        console.log('Update data:', updateData);
        await companiesApi.update(companyId, updateData);
        toast.success("Company updated successfully");
      } else {
        // Create new company
        await companiesApi.create(formData);
        toast.success("Company created successfully");
      }
      onSuccess();
      // Reset form
      setFormData({
        companyType: "LLC",
        legalName: "",
        taxId: "",
        registrationNumber: "",
        industry: "",
        legalRepName: "",
        legalRepTitle: "",
        legalRepEmail: "",
        legalRepPhone: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        },
        contact: {
          email: "",
          phone: "",
          website: "",
        },
        bankAccount: {
          bankName: "",
          accountNumber: "",
          routingNumber: "",
          iban: "",
          swift: "",
        },
      });
    } catch (error: any) {
      toast.error(`Failed to ${company ? "update" : "create"} company: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add New Company"}</DialogTitle>
          <DialogDescription>
            {company ? "Update company information in the registry." : "Create a new company record in the registry."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type *</Label>
                <Select
                  value={formData.companyType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, companyType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORPORATION">Corporation</SelectItem>
                    <SelectItem value="LLC">Limited Liability Company</SelectItem>
                    <SelectItem value="LTD">Private Limited Company</SelectItem>
                    <SelectItem value="GMBH">GmbH</SelectItem>
                    <SelectItem value="SARL">SARL</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={!company}
                >
                  <SelectTrigger>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name *</Label>
              <Input
                id="legalName"
                required
                value={formData.legalName}
                onChange={(e) =>
                  setFormData({ ...formData, legalName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID *</Label>
                <Input
                  id="taxId"
                  required
                  value={formData.taxId}
                  onChange={(e) =>
                    setFormData({ ...formData, taxId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input
                  id="registrationNumber"
                  required
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationNumber: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Legal Representative */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal Representative</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalRepName">Name</Label>
                <Input
                  id="legalRepName"
                  value={formData.legalRepName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalRepName: e.target.value })
                  }
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalRepPhone">Phone</Label>
                <Input
                  id="legalRepPhone"
                  value={formData.legalRepPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, legalRepPhone: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address *</h3>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                required
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  required
                  value={formData.address.zipCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, zipCode: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                required
                value={formData.address.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, country: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information *</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.contact.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact: { ...formData.contact, phone: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.contact.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, website: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Bank Account */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bank Account (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankAccount?.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount!, bankName: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.bankAccount?.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount!, accountNumber: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input
                  id="routingNumber"
                  value={formData.bankAccount?.routingNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount!, routingNumber: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={formData.bankAccount?.iban}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount!, iban: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swift">SWIFT</Label>
                <Input
                  id="swift"
                  value={formData.bankAccount?.swift}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccount: { ...formData.bankAccount!, swift: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (company ? "Updating..." : "Creating...") : (company ? "Update Company" : "Create Company")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

