"use client";

import { PlusIcon, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { OffersTable } from "./components/offers-table";
import { useOffers } from "@/lib/api/offers-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateOfferSheet } from "./components/create-offer-sheet";

export default function OffersPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  // Map tabs to status filters
  const statusFilterMap: Record<string, string | undefined> = {
    overview: undefined,
    draft: "DRAFT",
    sent: "SENT",
    approved: "APPROVED",
    rejected: "REJECTED",
    expired: "EXPIRED",
    cancelled: "CANCELLED",
  };

  const status = statusFilterMap[activeTab];

  // Use TanStack Query hook
  const { data: offers = [], isLoading, refetch } = useOffers({
    status,
    limit: 100,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      const defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci0xIiwidGVuYW50SWQiOiJkZWZhdWx0LXRlbmFudCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2MTgxOTY1MCwiZXhwIjoxNzYxOTA2MDUwfQ.fsYunvfCb6ckAyk61ng40OMP9q9HcZHyP7LQ21N5NOA";
      localStorage.setItem('token', defaultToken);
      localStorage.setItem('tenantId', 'default-tenant');
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left Side - Table */}
      <div className="flex-1 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
            <p className="text-muted-foreground">
              Create and manage customer offers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setCreateSheetOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" /> Create Offer
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            <OffersTable
              data={offers}
              loading={isLoading}
              onRefresh={() => refetch()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Editor */}
      {createSheetOpen && (
        <div className="w-[600px] border-l bg-background overflow-auto">
          <CreateOfferSheet
            open={createSheetOpen}
            onOpenChange={setCreateSheetOpen}
            onSuccess={() => refetch()}
          />
        </div>
      )}
    </div>
  );
}
