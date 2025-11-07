"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component that makes tables responsive by adding horizontal scroll on mobile
 * and proper shadows to indicate scrollable content.
 */
export function ResponsiveTableWrapper({
  children,
  className,
}: ResponsiveTableWrapperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Horizontal scroll with shadow indicators */}
      <div className="relative overflow-x-auto rounded-md border">
        {/* Scroll shadow indicators */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent opacity-0 transition-opacity md:hidden"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent opacity-0 transition-opacity md:hidden"
          aria-hidden="true"
        />

        {children}
      </div>

      {/* Mobile scroll hint */}
      <p className="mt-2 text-xs text-muted-foreground md:hidden">
        <span aria-label="Swipe to scroll" role="img">
          👆
        </span>{" "}
        Swipe to see more columns
      </p>
    </div>
  );
}
