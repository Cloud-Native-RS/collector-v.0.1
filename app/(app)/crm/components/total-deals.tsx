"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { Card, CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { crmApi } from "@/lib/api/crm";

export function TotalDeals() {
  const [totalDeals, setTotalDeals] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        const response = await crmApi.getDeals();
        setTotalDeals(response.meta?.total || response.data.length);
      } catch (error) {
        console.error('Failed to load deals:', error);
        setTotalDeals(0);
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardDescription>Total Deals</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="font-display text-2xl lg:text-3xl">
            {loading ? "..." : totalDeals !== null ? totalDeals.toLocaleString() : "0"}
          </h4>
          <div className="text-muted-foreground text-sm">
            Active deals in pipeline
          </div>
        </div>
        <CardAction>
          <div className="flex gap-4">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <BriefcaseBusiness className="size-5" />
            </div>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
