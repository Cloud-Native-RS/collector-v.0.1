"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Sales Orders Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[99vh] flex-col items-center justify-center gap-4 px-2 py-8">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold lg:text-5xl">Error Loading Orders</h2>
        <p className="text-muted-foreground">{error.message || 'Something went wrong!'}</p>
        {error.digest && (
          <p className="text-sm text-muted-foreground">Error ID: {error.digest}</p>
        )}
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}

