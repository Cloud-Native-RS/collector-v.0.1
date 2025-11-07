import { forwardRef } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface ValidatedInputProps extends InputProps {
  label?: string;
  error?: string;
  hint?: string;
  showErrorIcon?: boolean;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, error, hint, showErrorIcon = true, className, ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className={cn(hasError && "text-destructive")}>
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}

        <div className="relative">
          <Input
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
            className={cn(
              hasError && "border-destructive focus-visible:ring-destructive",
              showErrorIcon && hasError && "pr-10",
              className
            )}
            {...props}
          />

          {showErrorIcon && hasError && (
            <AlertCircle
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive"
              aria-hidden="true"
            />
          )}
        </div>

        {error && (
          <p
            id={`${props.id}-error`}
            className="text-sm font-medium text-destructive flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${props.id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";
