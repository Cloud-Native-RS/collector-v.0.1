"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierName: string;
  status: string;
  orderDate: string;
  expectedDate: string;
  totalAmount: number;
};

const mockPOs: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-2024-001",
    supplierName: "Tech Supplies Co.",
    status: "sent",
    orderDate: "2024-12-01",
    expectedDate: "2024-12-08",
    totalAmount: 22000.00
  },
  {
    id: "2",
    poNumber: "PO-2024-002",
    supplierName: "Global Logistics Ltd.",
    status: "draft",
    orderDate: "2024-12-02",
    expectedDate: "2024-12-10",
    totalAmount: 8500.00
  }
];

const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: "poNumber",
    header: "PO Number",
    cell: ({ row }) => (
      <div className="font-mono font-medium">{row.getValue("poNumber")}</div>
    )
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    cell: ({ row }) => <div className="font-medium">{row.getValue("supplierName")}</div>
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        draft: "secondary",
        sent: "default",
        received: "outline",
        canceled: "destructive"
      };
      return (
        <Badge variant={variants[status] || "secondary"}>
          {status.toUpperCase()}
        </Badge>
      );
    }
  },
  {
    accessorKey: "orderDate",
    header: "Order Date",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("orderDate")}</div>
    )
  },
  {
    accessorKey: "expectedDate",
    header: "Expected Date",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("expectedDate")}</div>
    )
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalAmount"));
      return <div className="font-medium">${amount.toLocaleString()}</div>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

export default function PurchaseOrderList() {
  const [data] = React.useState<PurchaseOrder[]>(mockPOs);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No purchase orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

