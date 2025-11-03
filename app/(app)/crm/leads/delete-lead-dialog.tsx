"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Lead } from "./types";
import { toast } from "sonner";
import { crmApi } from "@/lib/api/crm";

interface DeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess: () => void;
}

export default function DeleteLeadDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: DeleteLeadDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!lead) return;

    try {
      setLoading(true);
      await crmApi.deleteLead(lead.id);
      toast.success("Lead deleted successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to delete lead: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the lead <strong>{lead.name}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete Lead"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

