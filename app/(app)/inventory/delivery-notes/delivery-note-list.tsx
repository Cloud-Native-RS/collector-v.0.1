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
import { MoreHorizontal, Eye, Truck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export type DeliveryNote = {
  id: string;
  dnNumber: string;
  customerName: string;
  warehouseName: string;
  status: string;
  deliveryDate: string;
  itemsCount: number;
};

const mockDeliveryNotes: DeliveryNote[] = [
  {
    id: "1",
    dnNumber: "DN-2024-001",
    customerName: "ABC Company",
    warehouseName: "Main Warehouse",
    status: "delivered",
    deliveryDate: "2024-12-01",
    itemsCount: 15
  },
  {
    id: "2",
    dnNumber: "DN-2024-002",
    customerName: "XYZ Corp",
    warehouseName: "Secondary Warehouse",
    status: "in-transit",
    deliveryDate: "2024-12-02",
    itemsCount: 8
  }
];

const columns: ColumnDef<DeliveryNote>[] = [
  {
    accessorKey: "dnNumber",
    header: "Delivery Note #",
    cell: ({ row }) => (
      <div className="font-mono font-medium">{row.getValue("dnNumber")}</div>
    )
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => <div className="font-medium">{row.getValue("customerName")}</div>
  },
  {
    accessorKey: "warehouseName",
    header: "Warehouse",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("warehouseName")}</Badge>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        "in-transit": "default",
        delivered: "outline",
        pending: "secondary",
        canceled: "destructive"
      };
      return (
        <Badge variant={variants[status] || "secondary"}>
          {status === "in-transit" ? "In Transit" : status.toUpperCase()}
        </Badge>
      );
    }
  },
  {
    accessorKey: "deliveryDate",
    header: "Delivery Date",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.getValue("deliveryDate")}</div>
    )
  },
  {
    accessorKey: "itemsCount",
    header: "Items",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("itemsCount")}</div>
    )
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
            <DropdownMenuItem>
              <Truck className="mr-2 h-4 w-4" />
              Track Delivery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

export default function DeliveryNoteList() {
  const [data] = React.useState<DeliveryNote[]>(mockDeliveryNotes);

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
                No delivery notes found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

