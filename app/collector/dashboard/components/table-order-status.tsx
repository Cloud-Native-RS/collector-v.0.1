"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronDown, ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/CardActionMenus";
import { useRecentOrders, useOrderStatusCounts } from "@/hooks/use-dashboard";
import type { DashboardOrder } from "@/lib/api/dashboard";

type Order = DashboardOrder;

// Empty array for initial state - will be replaced by API data
const emptyData: Order[] = [];

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "ID",
    size: 80
  },
  {
    accessorKey: "customerName",
    header: "Customer Name"
  },
  {
    accessorKey: "items",
    header: "Qty Items",
    cell: ({ row }) => `${row.getValue("items")} Items`
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  },
  {
    accessorKey: "paymentMethod",
    header: "Payment Method"
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      const statusMap = {
        completed: "success",
        "new-order": "info",
        "in-progress": "warning",
        "on-hold": "warning",
        return: "destructive"
      } as const;

      const statusClass = statusMap[status] ?? "default";

      return (
        <Badge variant={statusClass} className="capitalize">
          {status.replace("-", " ")}
        </Badge>
      );
    }
  }
];

export function TableOrderStatus() {
  const { orders, isLoading: ordersLoading, error: ordersError } = useRecentOrders(50);
  const { counts, isLoading: countsLoading } = useOrderStatusCounts();
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Use real data from API
  const data = React.useMemo(() => orders || emptyData, [orders]);

  // Calculate totals for progress bars
  const totalOrders = React.useMemo(() => {
    return counts.newOrder + counts.inProgress + counts.completed + counts.onHold + counts.return;
  }, [counts]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    initialState: {
      pagination: {
        pageSize: 6
      }
    }
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Track Order Status</CardTitle>
        <CardDescription>Analyze growth and changes in visitor patterns</CardDescription>
        <CardAction>
          <ExportButton />
        </CardAction>
      </CardHeader>
      <CardContent>
        {countsLoading ? (
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="font-display text-2xl lg:text-3xl">{counts.newOrder}</div>
              <div className="flex gap-2">
                <div className="text-muted-foreground text-sm">New Order</div>
              </div>
              <Progress
                value={totalOrders > 0 ? (counts.newOrder / totalOrders) * 100 : 0}
                className="h-2 bg-blue-100 dark:bg-blue-950"
                indicatorColor="bg-blue-400"
              />
            </div>
            <div className="space-y-2">
              <div className="font-display text-2xl lg:text-3xl">{counts.inProgress}</div>
              <div className="flex gap-2">
                <div className="text-muted-foreground text-sm">In Progress</div>
              </div>
              <Progress
                value={totalOrders > 0 ? (counts.inProgress / totalOrders) * 100 : 0}
                className="h-2 bg-teal-100 dark:bg-teal-950"
                indicatorColor="bg-teal-400"
              />
            </div>
            <div className="space-y-2">
              <div className="font-display text-2xl lg:text-3xl">{counts.completed}</div>
              <div className="flex gap-2">
                <div className="text-muted-foreground text-sm">Completed</div>
              </div>
              <Progress
                value={totalOrders > 0 ? (counts.completed / totalOrders) * 100 : 0}
                className="h-2 bg-green-100 dark:bg-green-950"
                indicatorColor="bg-green-400"
              />
            </div>
            <div className="space-y-2">
              <div className="font-display text-2xl lg:text-3xl">{counts.return + counts.onHold}</div>
              <div className="flex gap-2">
                <div className="text-muted-foreground text-sm">On Hold / Return</div>
              </div>
              <Progress
                value={totalOrders > 0 ? ((counts.return + counts.onHold) / totalOrders) * 100 : 0}
                className="h-2 bg-orange-100 dark:bg-orange-950"
                indicatorColor="bg-orange-400"
              />
            </div>
          </div>
        )}

        {ordersError && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load orders: {ordersError.message}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter orders..."
              value={(table.getColumn("customerName")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("customerName")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <div className="text-muted-foreground flex-1 text-sm">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
