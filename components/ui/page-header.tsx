import { ReactNode } from "react";
import { DynamicBreadcrumbs } from "./dynamic-breadcrumbs";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showBreadcrumbs?: boolean;
  className?: string;
}

/**
 * Standardized page header component with breadcrumbs, title, description and actions
 */
export function PageHeader({
  title,
  description,
  actions,
  showBreadcrumbs = true,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {showBreadcrumbs && <DynamicBreadcrumbs />}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
