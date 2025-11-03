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
import { type Lead } from "./types";
import { Building2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { crmApi } from "@/lib/api/crm";

interface ConvertToCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess: () => void;
}

export default function ConvertToCustomerDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: ConvertToCustomerDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!lead) return;

    try {
      setLoading(true);
      const result = await crmApi.convertLead(lead.id);
      toast.success(`Lead converted to customer successfully. Customer number: ${result.customerNumber}`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to convert lead: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert Lead to Customer</DialogTitle>
          <DialogDescription>
            This will convert the lead to a customer in the registry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold">Lead Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Name:</span>
                <span>{lead.name}</span>
              </div>
              {lead.company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Company:</span>
                  <span>{lead.company}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              The lead will be added to the customer registry and available for all sales operations.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={loading}>
            {loading ? "Converting..." : "Convert to Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

