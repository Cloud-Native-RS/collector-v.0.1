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
import { ArrowUpDown, Mail, MoreHorizontal, Phone, Building2 } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Lead } from "./types";
import ViewLeadDialog from "./view-lead-dialog";
import EditLeadDialog from "./edit-lead-dialog";
import DeleteLeadDialog from "./delete-lead-dialog";
import ConvertToCustomerDialog from "./convert-to-customer-dialog";

export default function LeadsDataTable({ 
  data, 
  onRefresh, 
  loading 
}: { 
  data: Lead[]; 
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);

  const columns: ColumnDef<Lead>[] = React.useMemo(() => [
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
      cell: ({ row }) => (
        <div>
          <button
            onClick={() => {
              setSelectedLead(row.original);
              setViewDialogOpen(true);
            }}
            className="font-medium hover:text-primary hover:underline text-left transition-colors"
          >
            {row.original.name}
          </button>
          {row.original.company && (
            <div className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {row.original.company}
            </div>
          )}
        </div>
      )
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="text-muted-foreground h-3 w-3" />
              {row.original.email}
            </div>
            {row.original.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="text-muted-foreground h-3 w-3" />
                {row.original.phone}
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.original.source;
        
        const sourceMap = {
          website: { label: "Website", variant: "default" as const },
          social: { label: "Social Media", variant: "secondary" as const },
          email: { label: "Email", variant: "outline" as const },
          call: { label: "Phone Call", variant: "outline" as const },
          referral: { label: "Referral", variant: "default" as const },
          other: { label: "Other", variant: "secondary" as const }
        } as const;

        return (
          <Badge variant={sourceMap[source]?.variant || "outline"} className="capitalize">
            {sourceMap[source]?.label || source}
          </Badge>
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
          new: "default",
          contacted: "secondary",
          qualified: "outline",
          proposal_sent: "outline",
          negotiation: "secondary",
          won: "default",
          lost: "destructive"
        } as const;

        return (
          <Badge variant={statusMap[status] || "outline"} className="capitalize">
            {status.replace("_", " ")}
          </Badge>
        );
      }
    },
    {
      accessorKey: "value",
      header: () => <div className="text-right">Value</div>,
      cell: ({ row }) => {
        const value = row.original.value;
        if (!value) return <div className="text-right">-</div>;
        
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD"
        }).format(value);

        return <div className="text-right font-medium">{formatted}</div>;
      }
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => {
        return <div className="text-sm">{row.original.assignedTo || "-"}</div>;
      }
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedLead(lead);
                  setViewDialogOpen(true);
                }}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedLead(lead);
                  setEditDialogOpen(true);
                }}
              >
                Edit lead
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedLead(lead);
                  setConvertDialogOpen(true);
                }}
              >
                Convert to customer
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setSelectedLead(lead);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ], []);

  const handleRefresh = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setConvertDialogOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  };

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
    <>
      <div className="w-full space-y-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter by name, email, or company..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
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

      <ViewLeadDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        lead={selectedLead}
        onEdit={() => {
          setViewDialogOpen(false);
          setEditDialogOpen(true);
        }}
        onConvert={() => {
          setViewDialogOpen(false);
          setConvertDialogOpen(true);
        }}
        onRefresh={handleRefresh}
      />
      <EditLeadDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lead={selectedLead}
        onSuccess={handleRefresh}
      />
      <DeleteLeadDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        lead={selectedLead}
        onSuccess={handleRefresh}
      />
      <ConvertToCustomerDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        lead={selectedLead}
        onSuccess={handleRefresh}
      />
    </>
  );
}
