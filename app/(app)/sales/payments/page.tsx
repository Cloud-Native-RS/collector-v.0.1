"use client";

import { RefreshCw, CreditCard, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import PaymentDataTable from "./payment-data-table";
import { paymentsApi, Payment } from "@/lib/api/payments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const statusFilterMap: Record<string, string | undefined> = {
    overview: undefined,
    pending: "PENDING",
    succeeded: "SUCCEEDED",
    failed: "FAILED",
    refunded: "REFUNDED",
  };

  useEffect(() => {
    loadPayments();
  }, [activeTab]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const status = statusFilterMap[activeTab];
      const response = await paymentsApi.list({
        status,
        take: 100,
      });
      setPayments(response.data || []);
    } catch (error: any) {
      toast.error(`Failed to load payments: ${error.message}`);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, payment) => {
    const amount = typeof payment.amount === 'string' 
      ? parseFloat(payment.amount) 
      : payment.amount;
    return sum + amount;
  }, 0);
  const succeededCount = payments.filter(p => p.status === "SUCCEEDED").length;
  const failedCount = payments.filter(p => p.status === "FAILED").length;

  const stats = [
    {
      title: "Total Payments",
      value: totalPayments.toString(),
      icon: CreditCard,
      description: "All time"
    },
    {
      title: "Total Amount",
      value: `$${totalAmount.toFixed(2)}`,
      icon: TrendingUp,
      description: "Revenue"
    },
    {
      title: "Successful",
      value: succeededCount.toString(),
      icon: CheckCircle,
      description: "Completed"
    },
    {
      title: "Failed",
      value: failedCount.toString(),
      icon: AlertCircle,
      description: "Requires attention"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track and manage all payment transactions across invoices and orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadPayments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="succeeded">Succeeded</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="refunded">Refunded</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            View and track all payment transactions. Filter by status, provider, or search by transaction ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentDataTable 
            data={payments} 
            loading={loading}
            onRefresh={loadPayments}
          />
        </CardContent>
      </Card>
    </div>
  );
}

