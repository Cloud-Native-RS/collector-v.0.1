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
  ARCHIVED: "warning",
};

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

export default function PriceListDataTable({ 
  data, 
  loading, 
  onRefresh 
}: { 
  data: PriceList[]; 
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
        No price lists found. Price list management coming soon.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Valid From</TableHead>
            <TableHead>Valid To</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((list) => (
            <TableRow key={list.id}>
              <TableCell className="font-medium">{list.name}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(list.status)}>
                  {list.status}
                </Badge>
              </TableCell>
              <TableCell>{list.currency}</TableCell>
              <TableCell>{list.products}</TableCell>
              <TableCell>{format(new Date(list.validFrom), "MMM dd, yyyy")}</TableCell>
              <TableCell>{list.validTo ? format(new Date(list.validTo), "MMM dd, yyyy") : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

