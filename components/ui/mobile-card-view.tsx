"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileCardViewProps<T> {
  data: T[];
  renderCard: (item: T) => ReactNode;
  className?: string;
}

/**
 * Alternative mobile view for tables - renders items as cards instead of table rows
 * Better UX for mobile devices with complex table structures
 */
export function MobileCardView<T>({
  data,
  renderCard,
  className,
}: MobileCardViewProps<T>) {
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">{renderCard(item)}</CardContent>
        </Card>
      ))}
    </div>
  );
}
