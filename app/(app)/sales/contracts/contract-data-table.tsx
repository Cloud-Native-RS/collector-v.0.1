"use client";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
  DRAFT: "secondary",
  ACTIVE: "success",
  EXPIRED: "warning",
  TERMINATED: "destructive",
};

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

export default function ContractDataTable({ 
  data, 
  loading, 
  onRefresh 
}: { 
  data: Contract[]; 
  loading: boolean; 
  onRefresh: () => void;
}) {
  const getStatusColor = (status: string) => {
    return statusColors[status] || "secondary";
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
        No contracts found. Contracts management coming soon.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract Number</TableHead>
            <TableHead>Customer ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">{contract.contractNumber}</TableCell>
              <TableCell className="font-mono text-xs">{contract.customerId.slice(0, 8)}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(contract.status)}>
                  {contract.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(contract.startDate), "MMM dd, yyyy")}</TableCell>
              <TableCell>{format(new Date(contract.endDate), "MMM dd, yyyy")}</TableCell>
              <TableCell>
                {contract.currency} {contract.amount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

