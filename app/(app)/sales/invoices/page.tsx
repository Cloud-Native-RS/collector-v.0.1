"use client";

import { generateMeta } from "@/lib/utils";
import Link from "next/link";
import { PlusIcon, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import InvoiceDataTable from "./invoice-data-table";
import { invoicesApi, type Invoice } from "@/lib/api/invoices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const statusFilterMap: Record<string, string | undefined> = {
    overview: undefined,
    draft: "DRAFT",
    issued: "ISSUED",
    paid: "PAID",
    partially_paid: "PARTIALLY_PAID",
    overdue: "OVERDUE",
    canceled: "CANCELED",
  };

  useEffect(() => {
    // Token should be set during login, no need for fallback
    loadInvoices();
  }, [activeTab]);

  // Reload invoices when tenant changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'tenantId' || e.key === 'token') {
          loadInvoices();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const status = statusFilterMap[activeTab];
      const response = await invoicesApi.list({
        status,
        take: 100,
      });
      
      // Debug: Check response structure
      console.log('Invoices API response:', response);
      
      // Handle different response structures
      const invoicesData = Array.isArray(response) 
        ? response 
        : (response?.data || []);
      
      console.log('Loaded invoices:', invoicesData.length);
      setInvoices(invoicesData);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      toast.error(`Failed to load invoices: ${error.message}`);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalInvoices = invoices.length;
  const totalOutstanding = invoices.reduce((sum, inv) => {
    const amount = typeof inv.outstandingAmount === 'string' 
      ? parseFloat(inv.outstandingAmount) 
      : inv.outstandingAmount;
    return sum + amount;
  }, 0);
  const totalPaid = invoices.reduce((sum, inv) => {
    const amount = typeof inv.paidAmount === 'string' 
      ? parseFloat(inv.paidAmount) 
      : inv.paidAmount;
    return sum + amount;
  }, 0);
  const overdueCount = invoices.filter(inv => inv.status === "OVERDUE").length;

  const stats = [
    {
      title: "Total Invoices",
      value: totalInvoices.toString(),
      icon: Receipt,
      description: "All time"
    },
    {
      title: "Outstanding",
      value: `$${totalOutstanding.toFixed(2)}`,
      icon: DollarSign,
      description: "Unpaid amount"
    },
    {
      title: "Total Paid",
      value: `$${totalPaid.toFixed(2)}`,
      icon: TrendingUp,
      description: "Received payments"
    },
    {
      title: "Overdue",
      value: overdueCount.toString(),
      icon: AlertCircle,
      description: "Requires attention"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices & Billing</h1>
          <p className="text-muted-foreground">
            Manage invoices, track payments, and handle billing automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadInvoices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild>
            <Link href="/sales/invoices/create">
              <PlusIcon className="mr-2 h-4 w-4" /> Create Invoice
            </Link>
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
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="partially_paid">Partially Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            View and manage all invoices. Filter by status, search by invoice number, or view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceDataTable 
            data={invoices} 
            loading={loading}
            onRefresh={loadInvoices}
          />
        </CardContent>
      </Card>
    </div>
  );
}
