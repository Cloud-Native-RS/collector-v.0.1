"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
import { Input } from "@/components/ui/input";

export type StockItem = {
  id: string;
  sku: string;
  productName: string;
  warehouseName: string;
  quantityAvailable: number;
  reservedQuantity: number;
  availableForOrder: number;
  minimumThreshold: number;
  status: string;
};

const mockStock: StockItem[] = [
  {
    id: "1",
    sku: "LAPTOP-001",
    productName: "Dell Laptop XPS 13",
    warehouseName: "Main Warehouse",
    quantityAvailable: 50,
    reservedQuantity: 5,
    availableForOrder: 45,
    minimumThreshold: 10,
    status: "normal"
  },
  {
    id: "2",
    sku: "WATER-BTL-500",
    productName: "Mineral Water Bottle 500ml",
    warehouseName: "Main Warehouse",
    quantityAvailable: 1000,
    reservedQuantity: 50,
    availableForOrder: 950,
    minimumThreshold: 200,
    status: "normal"
  },
  {
    id: "3",
    sku: "SHIRT-MED-BLUE",
    productName: "Cotton T-Shirt Medium Blue",
    warehouseName: "Secondary Warehouse",
    quantityAvailable: 15,
    reservedQuantity: 10,
    availableForOrder: 5,
    minimumThreshold: 20,
    status: "low"
  }
];

const columns: ColumnDef<StockItem>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("sku")}</div>
    )
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => <div className="font-medium">{row.getValue("productName")}</div>
  },
  {
    accessorKey: "warehouseName",
    header: "Warehouse",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("warehouseName")}</Badge>
    )
  },
  {
    accessorKey: "quantityAvailable",
    header: "Available",
    cell: ({ row }) => {
      const qty = row.getValue("quantityAvailable") as number;
      const isLow = qty < (row.original.minimumThreshold as number);
      return (
        <div className={`font-medium ${isLow ? "text-red-600" : ""}`}>
          {qty}
        </div>
      );
    }
  },
  {
    accessorKey: "reservedQuantity",
    header: "Reserved",
    cell: ({ row }) => (
      <div className="text-orange-600">{row.getValue("reservedQuantity")}</div>
    )
  },
  {
    accessorKey: "availableForOrder",
    header: "Available for Order",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("availableForOrder")}</Badge>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "low" ? "destructive" : "default"}>
          {status === "low" ? "Low Stock" : "Normal"}
        </Badge>
      );
    }
  }
];

export default function StockTable() {
  const [data] = React.useState<StockItem[]>(mockStock);
  const [searchQuery, setSearchQuery] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search stock..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

