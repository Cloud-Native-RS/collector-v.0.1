import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ContactInfoFieldProps {
  icon: LucideIcon;
  label: string;
  value: string | null | undefined;
  isEditMode: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  href?: string; // For clickable links in view mode
}

export function ContactInfoField({
  icon: Icon,
  label,
  value,
  isEditMode,
  onChange,
  placeholder,
  type = "text",
  href,
}: ContactInfoFieldProps) {
  if (!isEditMode && !value) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        {isEditMode ? (
          <Input
            type={type}
            placeholder={placeholder || label}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-9"
          />
        ) : href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm">{value}</span>
        )}
      </div>
    </div>
  );
}
