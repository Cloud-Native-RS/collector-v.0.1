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
import { ArrowUpDown, Building2, Globe, Mail, MapPin, MoreHorizontal, Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Company } from "./types";

const createColumns = (onCompanyClick?: (company: Company) => void): ColumnDef<Company>[] => [
  {
    id: "rowNumber",
    header: "#",
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      return <div className="text-sm text-muted-foreground">{pageIndex * pageSize + row.index + 1}</div>;
    },
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "legalName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Legal Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div>
          <button
            onClick={() => onCompanyClick?.(row.original)}
            className="font-medium hover:text-primary hover:underline cursor-pointer text-left transition-colors"
          >
            {row.original.legalName}
          </button>
        </div>
      );
    }
  },
  {
    accessorKey: "companyType",
    header: "Type",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Building2 className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{row.original.companyType}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => <span className="text-sm">{row.getValue("industry")}</span>
  },
  {
    accessorKey: "contact",
    header: "Contact Info",
    cell: ({ row }) => {
      const contactPersons = row.original.contactPersons || [];
      
      // Debug log
      if (contactPersons.length === 0) {
        console.log(`[CompanyDataTable] No contacts for company: ${row.original.legalName}`, {
          contactPersons,
          hasContactPersons: !!row.original.contactPersons,
          contactPersonsType: typeof row.original.contactPersons
        });
      }
      
      // Pronađi primarni kontakt - prvo pokušaj da nađeš onog sa title "Manager", ako ne postoji uzmi prvog
      const primaryContact = contactPersons.find(p => p.title === 'Manager') || contactPersons[0];
      
      if (primaryContact && primaryContact.firstName && primaryContact.lastName) {
        return (
          <div className="flex items-center gap-2">
            <User className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm">
              {primaryContact.firstName} {primaryContact.lastName}
            </span>
          </div>
        );
      }
      
      // Fallback ako nema kontakata ili kontakt nema ime/prezime
      return (
        <span className="text-muted-foreground text-sm">—</span>
      );
    }
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const address = row.original.address;
      return (
        <div className="flex items-center gap-2">
          <MapPin className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{`${address.city}, ${address.country}`}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "taxId",
    header: "Tax ID",
    cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("taxId")}</div>
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.original.status;
      
      const statusMap = {
        active: "default",
        inactive: "secondary",
        pending: "outline",
        liquidated: "destructive"
      } as const;

      return (
        <Badge variant={statusMap[status] || "outline"} className="capitalize">
          {status}
        </Badge>
      );
    }
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View company</DropdownMenuItem>
            <DropdownMenuItem>Edit company</DropdownMenuItem>
            <DropdownMenuItem>View documents</DropdownMenuItem>
            <DropdownMenuItem>View bank accounts</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

interface CompanyDataTableProps {
  data: Company[];
  onCompanyClick?: (company: Company) => void;
}

export default function CompanyDataTable({ data, onCompanyClick }: CompanyDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const columns = React.useMemo(() => createColumns(onCompanyClick), [onCompanyClick]);

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
    initialState: {
      pagination: {
        pageSize: 20
      }
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility
    }
  });

  return (
    <div className="w-full space-y-4">
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
            {table.getRowModel().rows?.length ? (
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-sm">Show</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">entries</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-muted-foreground text-sm">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} entries
          </div>
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
    </div>
  );
}

