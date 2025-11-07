import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface Address {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

interface AddressSectionProps {
  address: Address | null | undefined;
  isEditMode: boolean;
  onAddressChange: (field: keyof Address, value: string) => void;
  label?: string;
}

export function AddressSection({
  address,
  isEditMode,
  onAddressChange,
  label = "Address",
}: AddressSectionProps) {
  if (!isEditMode && (!address || !address.street)) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="space-y-2 pl-6">
        {isEditMode ? (
          <>
            <Input
              placeholder="Street"
              value={address?.street || ""}
              onChange={(e) => onAddressChange("street", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="City"
                value={address?.city || ""}
                onChange={(e) => onAddressChange("city", e.target.value)}
              />
              <Input
                placeholder="State"
                value={address?.state || ""}
                onChange={(e) => onAddressChange("state", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="ZIP Code"
                value={address?.zipCode || ""}
                onChange={(e) => onAddressChange("zipCode", e.target.value)}
              />
              <Input
                placeholder="Country"
                value={address?.country || ""}
                onChange={(e) => onAddressChange("country", e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="text-sm">
            {address?.street && <div>{address.street}</div>}
            <div>
              {[address?.city, address?.state]
                .filter(Boolean)
                .join(", ")}
              {address?.zipCode && ` ${address.zipCode}`}
            </div>
            {address?.country && <div>{address.country}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
