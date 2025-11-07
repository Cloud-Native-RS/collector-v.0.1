"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useMemo, useState } from "react";
import { Offer } from "@/lib/api/offers";
import { customersApi, type Customer } from "@/lib/api/registry";
import { createOffersColumns } from "./offers-table-columns";

interface OffersTableProps {
  data: Offer[];
  loading: boolean;
  onRefresh: () => void;
}

export function OffersTable({ data, loading }: OffersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [customerNameById, setCustomerNameById] = useState<Record<string, string>>({});

  const uniqueCustomerIds = useMemo(
    () => Array.from(new Set(data.map((o) => o.customerId).filter(Boolean))),
    [data]
  );

  // Load customer names
  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      if (!uniqueCustomerIds.length) return;

      const idsToLoad = uniqueCustomerIds.filter((id) => !(id in customerNameById));
      if (!idsToLoad.length) return;

      try {
        const entries = await Promise.all(
          idsToLoad.map(async (id) => {
            try {
              const res = await customersApi.getById(id);
              const c = res.data as Customer;

              const name =
                c.type === "COMPANY"
                  ? c.companyName || c.customerNumber
                  : [c.firstName, c.lastName].filter(Boolean).join(" ") ||
                    c.customerNumber;

              return [id, name] as const;
            } catch (error) {
              return [id, "⚠️ Customer Not Found"] as const;
            }
          })
        );

        if (!cancelled && entries.length) {
          const nameMap = Object.fromEntries(entries);
          setCustomerNameById((prev) => ({ ...prev, ...nameMap }));
        }
      } catch (error) {
        console.error("[OffersTable] Error loading customers:", error);
      }
    }
    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, [uniqueCustomerIds, customerNameById]);

  const getCustomerName = (id: string) => {
    return customerNameById[id] || "Loading...";
  };

  const columns = useMemo(
    () =>
      createOffersColumns({
        onPreview: (id) => {
          // TODO: Implement preview
          console.log("Preview offer", id);
        },
        getCustomerName,
      }),
    [customerNameById]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
        <span className="ml-2 text-muted-foreground">Loading offers...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Input */}
      <div className="flex items-center py-4 px-4">
        <Input
          placeholder="Filter by offer number..."
          value={(table.getColumn("offerNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("offerNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Table */}
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  No offers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-end space-x-2 py-4 px-4">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} offer(s) total
        </div>
      </div>
    </div>
  );
}






