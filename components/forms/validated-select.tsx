import { forwardRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface ValidatedSelectProps {
  id?: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export const ValidatedSelect = forwardRef<HTMLButtonElement, ValidatedSelectProps>(
  (
    {
      id,
      label,
      error,
      hint,
      required,
      placeholder,
      value,
      onValueChange,
      disabled,
      options,
      className,
    },
    ref
  ) => {
    const hasError = !!error;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className={cn(hasError && "text-destructive")}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}

        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            id={id}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            className={cn(hasError && "border-destructive focus:ring-destructive", className)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <p
            id={`${id}-error`}
            className="text-sm font-medium text-destructive flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

ValidatedSelect.displayName = "ValidatedSelect";
