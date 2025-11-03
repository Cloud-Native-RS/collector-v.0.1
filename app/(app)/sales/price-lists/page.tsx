"use client";

import { PlusIcon, RefreshCw, DollarSign, TrendingUp, Package, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import PriceListDataTable from "./price-list-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceList {
  id: string;
  name: string;
  currency: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  products: number;
  validFrom: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const statusFilterMap: Record<string, string | undefined> = {
    overview: undefined,
    draft: "DRAFT",
    active: "ACTIVE",
    archived: "ARCHIVED",
  };

  useEffect(() => {
    loadPriceLists();
  }, [activeTab]);

  const loadPriceLists = async () => {
    try {
      setLoading(true);
      // TODO: Implement price lists API
      // For now, using mock data
      const mockPriceLists: PriceList[] = [];
      setPriceLists(mockPriceLists);
    } catch (error: any) {
      toast.error(`Failed to load price lists: ${error.message}`);
      setPriceLists([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPriceLists = priceLists.length;
  const totalProducts = priceLists.reduce((sum, list) => sum + list.products, 0);
  const activeCount = priceLists.filter(l => l.status === "ACTIVE").length;
  const draftsCount = priceLists.filter(l => l.status === "DRAFT").length;

  const stats = [
    {
      title: "Total Price Lists",
      value: totalPriceLists.toString(),
      icon: DollarSign,
      description: "All time"
    },
    {
      title: "Total Products",
      value: totalProducts.toString(),
      icon: Package,
      description: "Across all lists"
    },
    {
      title: "Active",
      value: activeCount.toString(),
      icon: TrendingUp,
      description: "Currently active"
    },
    {
      title: "Drafts",
      value: draftsCount.toString(),
      icon: AlertCircle,
      description: "Pending approval"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Price Lists</h1>
          <p className="text-muted-foreground">
            Manage product pricing, discounts, and customer-specific pricing tiers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadPriceLists} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> Create Price List
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Price Lists Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price Lists</CardTitle>
          <CardDescription>
            View and manage all price lists. Create custom pricing for customers, products, or time periods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceListDataTable 
            data={priceLists} 
            loading={loading}
            onRefresh={loadPriceLists}
          />
        </CardContent>
      </Card>
    </div>
  );
}

