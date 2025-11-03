"use client";

import Link from "next/link";
import { PlusIcon, RefreshCw, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import OfferDataTable from "./offer-data-table";
import { offersApi, Offer } from "@/lib/api/offers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const statusFilterMap: Record<string, string | undefined> = {
    overview: undefined,
    draft: "DRAFT",
    sent: "SENT",
    approved: "APPROVED",
    rejected: "REJECTED",
    expired: "EXPIRED",
    cancelled: "CANCELLED",
  };

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      const status = statusFilterMap[activeTab];
      console.log('[Offers Page] Loading offers with status:', status, 'activeTab:', activeTab);
      const response = await offersApi.list({
        status,
        limit: 100,
      });
      console.log('[Offers Page] Response:', response);
      setOffers(response.data || []);
    } catch (error: any) {
      console.error('[Offers Page] Error loading offers:', error);
      toast.error(`Failed to load offers: ${error.message}`);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // Ensure token is set for API calls
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      const defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci0xIiwidGVuYW50SWQiOiJkZWZhdWx0LXRlbmFudCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2MTgxOTY1MCwiZXhwIjoxNzYxOTA2MDUwfQ.fsYunvfCb6ckAyk61ng40OMP9q9HcZHyP7LQ21N5NOA";
      localStorage.setItem('token', defaultToken);
      localStorage.setItem('tenantId', 'default-tenant');
    }
    loadOffers();
  }, [loadOffers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
          <p className="text-muted-foreground">
            Create and manage customer offers with approval workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadOffers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/sales/quotations/create">
              <PlusIcon className="mr-2 h-4 w-4" /> Create Offer
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Offers</CardTitle>
          <CardDescription>
            View and manage all offers. Filter by status, search by offer number, or view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OfferDataTable 
            data={offers} 
            loading={loading}
            onRefresh={loadOffers}
          />
        </CardContent>
      </Card>
    </div>
  );
}

