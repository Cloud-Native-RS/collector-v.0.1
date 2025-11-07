import { forwardRef } from "react";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface ValidatedTextareaProps extends TextareaProps {
  label?: string;
  error?: string;
  hint?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, error, hint, showCharCount, maxLength, className, value, ...props }, ref) => {
    const hasError = !!error;
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={props.id} className={cn(hasError && "text-destructive")}>
              {label}
              {props.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {showCharCount && maxLength && (
              <span className="text-xs text-muted-foreground">
                {currentLength} / {maxLength}
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <Textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            aria-invalid={hasError}
            aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
            className={cn(hasError && "border-destructive focus-visible:ring-destructive", className)}
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${props.id}-error`}
            className="text-sm font-medium text-destructive flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
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

ValidatedTextarea.displayName = "ValidatedTextarea";
