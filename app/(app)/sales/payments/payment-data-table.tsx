"use client";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Payment } from "@/lib/api/payments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning' | 'info'> = {
  PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "destructive",
  REFUNDED: "secondary",
  PARTIAL: "info",
};

const providerColors: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'outline' | 'warning' | 'info'> = {
  STRIPE: "default",
  PAYPAL: "info",
  BANK_TRANSFER: "secondary",
  MANUAL: "warning",
  CASH: "success",
};

export default function PaymentDataTable({ 
  data, 
  loading, 
  onRefresh 
}: { 
  data: Payment[]; 
  loading: boolean; 
  onRefresh: () => void;
}) {
  const getStatusColor = (status: string) => {
    return statusColors[status] || "secondary";
  };

  const getProviderColor = (provider: string) => {
    return providerColors[provider] || "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payments found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Invoice ID</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Processed At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-xs">
                {payment.transactionId || payment.id.slice(0, 8)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {payment.invoiceId.slice(0, 8)}
              </TableCell>
              <TableCell>
                <Badge variant={getProviderColor(payment.provider)}>
                  {payment.provider}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-semibold">
                  {payment.currency} {typeof payment.amount === 'string' 
                    ? parseFloat(payment.amount).toFixed(2) 
                    : payment.amount.toFixed(2)}
                </span>
              </TableCell>
              <TableCell>
                {payment.paymentMethod || '-'}
              </TableCell>
              <TableCell>
                {payment.processedAt 
                  ? format(new Date(payment.processedAt), "MMM dd, yyyy HH:mm")
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

