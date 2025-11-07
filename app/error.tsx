"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service (e.g., Sentry)
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to error tracking service
      console.error("Global error:", error);
    } else {
      console.error("Development error:", error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Nešto je pošlo po zlu
                </h1>
                <p className="text-muted-foreground">
                  Izvinjavamo se zbog neprijatnosti. Molimo pokušajte ponovo ili se vratite na početnu stranicu.
                </p>
              </div>

              {process.env.NODE_ENV === "development" && error.message && (
                <div className="mt-4 rounded-lg bg-muted p-4 text-left">
                  <p className="font-mono text-sm text-destructive">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => reset()} className="w-full sm:w-auto">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Pokušaj ponovo
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Početna strana
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
