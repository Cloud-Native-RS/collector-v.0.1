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
import { ArrowUpDown, Building2, Mail, MapPin, MoreHorizontal, Phone } from "lucide-react";

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
import { type Contact } from "./types";

export const columns: ColumnDef<Contact>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const firstName = row.original.firstName?.trim() || '';
      const lastName = row.original.lastName?.trim() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Debug: Log if name is missing
      if (!fullName) {
        console.warn('Contact missing firstName/lastName:', {
          id: row.original.id,
          contactNumber: row.original.contactNumber,
          firstName: row.original.firstName,
          lastName: row.original.lastName,
          email: row.original.email,
          fullRow: row.original
        });
      }
      
      return (
        <div>
          <div className="font-medium">
            {fullName || row.original.email || row.original.contactNumber || 'N/A'}
          </div>
          {row.original.title && (
            <div className="text-muted-foreground text-sm">{row.original.title}</div>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => {
      const companyName = row.original.companyName;
      const legalName = row.original.companyLegalName;
      
      if (!companyName && !legalName) {
        return (
          <span className="text-muted-foreground text-sm">—</span>
        );
      }
      
      // Always prefer legalName, never show trading name
      // If legalName exists, use it; otherwise use companyName (but filter out any "Trading as:" text)
      let displayName = legalName || companyName || '';
      
      // Remove any "Trading as:" text if it exists in the name (prefix or anywhere)
      displayName = displayName
        .replace(/^Trading as:\s*/i, '')
        .replace(/Trading as:\s*/i, '')
        .trim();
      
      return (
        <div className="flex items-center gap-2">
          <Building2 className="text-muted-foreground h-4 w-4" />
          <span>{displayName}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => {
      if (!row.original.department) {
        return (
          <span className="text-muted-foreground text-sm">—</span>
        );
      }
      return (
        <span className="text-sm">{row.original.department}</span>
      );
    }
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="text-muted-foreground h-3 w-3" />
            {row.original.phone}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="text-muted-foreground h-3 w-3" />
            {row.original.email}
          </div>
        </div>
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
        archived: "destructive"
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem>View contact</DropdownMenuItem>
            <DropdownMenuItem>Edit contact</DropdownMenuItem>
            <DropdownMenuItem>View company</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

interface ContactsDataTableProps {
  data: Contact[];
  onContactClick?: (contact: Contact) => void;
}

export default function ContactsDataTable({ data, onContactClick }: ContactsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

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
                <TableRow 
                  key={row.id} 
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onContactClick?.(row.original)}
                  className={onContactClick ? "cursor-pointer hover:bg-muted/50" : ""}
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

