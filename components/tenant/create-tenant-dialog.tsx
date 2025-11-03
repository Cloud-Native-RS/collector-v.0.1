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
import { createTenant, getUserTenants } from "@/lib/api/auth";
import { toast } from "sonner";

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateTenantDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTenantDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error("Naziv kompanije je obavezan");
      return;
    }

    try {
      setLoading(true);
      await createTenant({ displayName: displayName.trim() });
      toast.success("Kompanija je uspešno kreirana");
      setDisplayName("");
      onOpenChange(false);
      
      // Refresh tenants list if callback provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Reload page to refresh tenant list
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Failed to create company:", error);
      toast.error(error.message || "Neuspešno kreiranje kompanije");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Kompanija</DialogTitle>
          <DialogDescription>
            Kreirajte novu kompaniju. Bit ćete automatski dodeljeni kao vlasnik.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">
                Naziv kompanije <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Unesite naziv kompanije"
                disabled={loading}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Otkaži
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Kreiranje..." : "Kreiraj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

