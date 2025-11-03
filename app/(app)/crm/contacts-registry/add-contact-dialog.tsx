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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { companiesApi, customersApi, type Company } from "@/lib/api/registry";
import type { Contact } from "./types";
import { cn } from "@/lib/utils";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contact?: Contact;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  companyId: string;
  taxId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function AddContactDialog({
  open,
  onOpenChange,
  onSuccess,
  contact,
}: CreateContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [companySearchValue, setCompanySearchValue] = useState("");
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    companyId: "",
    taxId: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });

  // Load companies when dialog opens
  useEffect(() => {
    if (open) {
      loadCompanies();
    }
  }, [open]);

  // Populate form when contact prop changes (edit mode)
  useEffect(() => {
    if (contact && open) {
      setFormData({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        title: contact.title || "",
        department: contact.department || "",
        companyId: contact.companyId?.toString() || "",
        taxId: "", // Tax ID is not needed in form anymore
        street: contact.address?.street || "",
        city: contact.address?.city || "",
        state: contact.address?.state || "",
        zipCode: contact.address?.zipCode || "",
        country: contact.address?.country || "United States",
      });
      setCompanySearchValue("");
    } else if (!contact && open) {
      // Reset form when opening in add mode
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        department: "",
        companyId: "",
        taxId: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
      });
      setCompanySearchValue("");
    }
  }, [contact, open]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companiesApi.list({ take: 100 });
      setCompanies(response.data || []);
    } catch (error: any) {
      console.error('Failed to load companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.companyId || !formData.department) {
      toast.error("Please fill in all required fields (First Name, Last Name, Email, Phone, Company, Department)");
      return;
    }

    // Tax ID is required only for new contacts (but we'll generate it on backend or get it from company)
    // For now, we'll use a placeholder - you may want to generate it or get it from company data

    try {
      setLoading(true);
      
      if (contact) {
        // Update existing contact - use originalId if available
        let contactId = contact.originalId;

        if (!contactId) {
          console.warn('Contact missing originalId, attempting to reload from API');
          // Try to reload the contact from API to get the proper ID
          try {
            const response = await customersApi.list({ type: 'INDIVIDUAL', take: 1000 });
            const foundContact = response.data?.find(
              (c: any) => c.customerNumber === contact.contactNumber || 
                         (c.firstName === contact.firstName && c.lastName === contact.lastName && c.email === contact.email)
            );
            if (foundContact && foundContact.id) {
              contactId = foundContact.id;
              console.log('Found contact with ID:', contactId);
            } else {
              toast.error('Could not find contact in API. Please refresh the page.');
              return;
            }
          } catch (error: any) {
            console.error('Failed to reload contact:', error);
            toast.error('Please refresh the page and try again. Contact data needs to be reloaded.');
            return;
          }
        }

        console.log('Updating contact with ID:', contactId);
        // Prepare update data - only send fields that API accepts for update
        const updateData: any = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          department: formData.department.trim(),
        };

        if (formData.title?.trim()) {
          updateData.title = formData.title.trim();
        }
        if (formData.companyId) {
          updateData.companyId = formData.companyId;
        }

        await customersApi.update(contactId, updateData);
        toast.success("Contact updated successfully!");
      } else {
        // Create new contact
        // Tax ID will need to be generated or provided - for now using a placeholder
        // You may want to generate it based on company or user input
        const taxId = formData.taxId || `TEMP-${Date.now()}`;

        const response = await customersApi.create({
          type: 'INDIVIDUAL',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          title: formData.title || undefined,
          department: formData.department,
          companyId: formData.companyId,
          taxId: taxId,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state || undefined,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          contact: {
            email: formData.email,
            phone: formData.phone,
          },
        });

        if (!response.success) {
          throw new Error("Failed to create contact");
        }

        toast.success("Contact created successfully!");
      }
      
      onSuccess();
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        title: "",
        department: "",
        companyId: "",
        taxId: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error(`Error ${contact ? 'updating' : 'creating'} contact:`, error);
      toast.error(`Failed to ${contact ? 'update' : 'create'} contact: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
          <DialogDescription>
            {contact ? "Update contact information in the registry." : "Create a new contact in the registry. All fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                required
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="e.g. Sales, Marketing, IT"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyId">Company *</Label>
            <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={companySearchOpen}
                  className="w-full justify-between"
                  disabled={loadingCompanies}
                >
                  {formData.companyId
                    ? companies.find((company) => company.id === formData.companyId)?.legalName || "Select company..."
                    : loadingCompanies ? "Loading companies..." : "Select company..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search company..." 
                    value={companySearchValue}
                    onValueChange={setCompanySearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>No company found.</CommandEmpty>
                    <CommandGroup>
                      {companies
                        .filter((company) =>
                          company.legalName.toLowerCase().includes(companySearchValue.toLowerCase())
                        )
                        .map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.legalName}
                            onSelect={() => {
                              setFormData({ ...formData, companyId: company.id });
                              setCompanySearchOpen(false);
                              setCompanySearchValue("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.companyId === company.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {company.legalName}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <div className="space-y-2">
              <Input
                placeholder="Street address *"
                required
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City *"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Zip Code *"
                  required
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                />
                <Input
                  placeholder="Country *"
                  required
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (contact ? "Updating..." : "Creating...") : (contact ? "Update Contact" : "Create Contact")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

