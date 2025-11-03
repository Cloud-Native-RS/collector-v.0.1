"use client";

import { PlusIcon, RefreshCw, FileText, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import ContractDataTable from "./contract-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const statusFilterMap: Record<string, string | undefined> = {
    overview: undefined,
    draft: "DRAFT",
    active: "ACTIVE",
    expired: "EXPIRED",
    terminated: "TERMINATED",
  };

  useEffect(() => {
    loadContracts();
  }, [activeTab]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      // TODO: Implement contracts API
      // For now, using mock data
      const mockContracts: Contract[] = [];
      setContracts(mockContracts);
    } catch (error: any) {
      toast.error(`Failed to load contracts: ${error.message}`);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const totalContracts = contracts.length;
  const totalValue = contracts.reduce((sum, contract) => sum + contract.amount, 0);
  const activeCount = contracts.filter(c => c.status === "ACTIVE").length;
  const expiringSoonCount = contracts.filter(c => {
    const endDate = new Date(c.endDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;

  const stats = [
    {
      title: "Total Contracts",
      value: totalContracts.toString(),
      icon: FileText,
      description: "All time"
    },
    {
      title: "Total Value",
      value: `$${totalValue.toFixed(2)}`,
      icon: TrendingUp,
      description: "Contract value"
    },
    {
      title: "Active",
      value: activeCount.toString(),
      icon: Calendar,
      description: "Currently active"
    },
    {
      title: "Expiring Soon",
      value: expiringSoonCount.toString(),
      icon: AlertCircle,
      description: "Within 30 days"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Manage customer contracts, agreements, and renewal tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadContracts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> Create Contract
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
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="terminated">Terminated</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
          <CardDescription>
            View and manage all contracts. Track renewals, monitor expirations, and manage contract terms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContractDataTable 
            data={contracts} 
            loading={loading}
            onRefresh={loadContracts}
          />
        </CardContent>
      </Card>
    </div>
  );
}

