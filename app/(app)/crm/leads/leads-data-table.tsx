"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowUpDown, Mail, MoreHorizontal, Phone, Building2, Search, X, Trash2, Tag, UserPlus, CheckSquare2, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import { Checkbox } from "@/components/ui/checkbox";
import { type Lead } from "./types";
import ViewLeadDialog from "./view-lead-dialog";
import EditLeadDialog from "./edit-lead-dialog";
import DeleteLeadDialog from "./delete-lead-dialog";
import ConvertToCustomerDialog from "./convert-to-customer-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsDataTable({ 
  data, 
  onRefresh, 
  loading,
  selectedStatus
}: { 
  data: Lead[]; 
  onRefresh?: () => void;
  loading?: boolean;
  selectedStatus?: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply search filter
  React.useEffect(() => {
    if (debouncedSearch) {
      setColumnFilters([
        ...columnFilters.filter(f => f.id !== "global"),
        {
          id: "global",
          value: debouncedSearch
        }
      ]);
    } else {
      setColumnFilters(columnFilters.filter(f => f.id !== "global"));
    }
  }, [debouncedSearch]);

  const columns: ColumnDef<Lead>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40
    },
    {
      id: "title",
      accessorFn: (row) => `${row.title || ""} ${row.name} ${row.company || ""} ${row.email || ""}`,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3 -ml-3 hover:bg-transparent"
          >
            <span>Title</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 min-w-[250px]">
          <button
            onClick={() => {
              setSelectedLead(row.original);
              setViewDialogOpen(true);
            }}
            className="font-medium text-sm hover:text-primary hover:underline text-left transition-colors group"
          >
            {row.original.title || row.original.name}
          </button>
          {row.original.title && (
            <div className="text-muted-foreground text-xs">
              <span>Contact: {row.original.name}</span>
            </div>
          )}
          {row.original.company && (
            <div className="text-muted-foreground text-xs flex items-center gap-1">
              <Building2 className="h-3 w-3 opacity-60" />
              <span>{row.original.company}</span>
            </div>
          )}
        </div>
      ),
      size: 300
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        return (
          <div className="space-y-1 min-w-[180px]">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="text-muted-foreground h-3.5 w-3.5 opacity-60" />
              <span className="truncate">{row.original.email}</span>
            </div>
            {row.original.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="text-muted-foreground h-3.5 w-3.5 opacity-60" />
                <span>{row.original.phone}</span>
              </div>
            )}
          </div>
        );
      },
      size: 200
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.original.source;
        
        const sourceMap = {
          website: { label: "Website", variant: "default" as const, className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
          social: { label: "Social", variant: "secondary" as const, className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
          email: { label: "Email", variant: "outline" as const, className: "" },
          call: { label: "Call", variant: "outline" as const, className: "" },
          referral: { label: "Referral", variant: "default" as const, className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
          other: { label: "Other", variant: "secondary" as const, className: "" }
        } as const;

        const sourceConfig = sourceMap[source] || { label: source, variant: "outline" as const, className: "" };

        return (
          <Badge variant={sourceConfig.variant} className={cn("text-xs font-normal", sourceConfig.className)}>
            {sourceConfig.label}
          </Badge>
        );
      },
      size: 120
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3 -ml-3 hover:bg-transparent"
          >
            <span>Status</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.original.status;
        
        const statusMap = {
          new: { variant: "default" as const, className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
          contacted: { variant: "secondary" as const, className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
          qualified: { variant: "outline" as const, className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
          proposal_sent: { variant: "outline" as const, className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
          negotiation: { variant: "secondary" as const, className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
          won: { variant: "default" as const, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
          lost: { variant: "destructive" as const, className: "" }
        } as const;

        const statusConfig = statusMap[status] || { variant: "outline" as const, className: "" };

        return (
          <Badge variant={statusConfig.variant} className={cn("text-xs font-medium capitalize", statusConfig.className)}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
      size: 130
    },
    {
      accessorKey: "value",
      header: () => <div className="text-right">Value</div>,
      cell: ({ row }) => {
        const value = row.original.value;
        if (!value) return <div className="text-right text-muted-foreground text-sm">-</div>;
        
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);

        return <div className="text-right font-semibold text-sm">{formatted}</div>;
      },
      size: 120
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned",
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        if (!assignedTo) return <div className="text-sm text-muted-foreground">-</div>;
        return <div className="text-sm">{assignedTo}</div>;
      },
      size: 120
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
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
      },
      size: 50
    }
  ], []);

  // Global filter function
  const globalFilterFn = React.useCallback(
    (row: any, columnId: string, value: string) => {
      const search = value.toLowerCase();
      const lead = row.original as Lead;
      
      return (
        lead.title?.toLowerCase().includes(search) ||
        lead.name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.company?.toLowerCase().includes(search) ||
        lead.phone?.toLowerCase().includes(search) ||
        false
      );
    },
    []
  );

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
    enableRowSelection: true,
    globalFilterFn,
    initialState: {
      pagination: {
        pageSize: 25
      }
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  const handleRefresh = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setConvertDialogOpen(false);
    setRowSelection({});
    if (onRefresh) {
      onRefresh();
    }
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedLeads = selectedRows.map(row => row.original);
  const selectedCount = Object.keys(rowSelection).length;

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)?`)) {
      return;
    }

    // TODO: Implement bulk delete API call
    toast.success(`Deleted ${selectedLeads.length} lead(s)`);
    setRowSelection({});
    handleRefresh();
  };

  return (
    <>
      <div className="w-full space-y-3">
        {/* Search and Filters Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Select
            value={(table.getColumn("source")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("source")?.setFilterValue(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Phone Call</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between bg-muted/50 border rounded-lg px-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedCount} {selectedCount === 1 ? "lead" : "leads"} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
                className="h-7 text-xs"
              >
                Clear selection
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => toast.info("Bulk edit coming soon")}
              >
                <Tag className="mr-1.5 h-3.5 w-3.5" />
                Change status
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => toast.info("Bulk assign coming soon")}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-destructive hover:text-destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border bg-background">
          <div className="relative">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead 
                          key={header.id}
                          className="h-10"
                          style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        >
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length}>
                        <div className="flex items-center gap-4 py-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[180px]" />
                          <Skeleton className="h-5 w-[80px]" />
                          <Skeleton className="h-5 w-[100px]" />
                          <Skeleton className="h-4 w-[100px] ml-auto" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow 
                      key={row.id} 
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        row.getIsSelected() && "bg-muted/30"
                      )}
                      onClick={() => {
                        setSelectedLead(row.original);
                        setViewDialogOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className="py-3"
                          onClick={(e) => {
                            // Prevent row click when clicking on actions or checkbox
                            if (cell.column.id === "actions" || cell.column.id === "select") {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {loading ? (
                          <p className="text-sm text-muted-foreground">Loading leads...</p>
                        ) : searchQuery ? (
                          <>
                            <p className="text-sm text-muted-foreground">No leads found matching your search.</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchQuery("")}
                              className="h-7"
                            >
                              Clear search
                            </Button>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No leads found. Click "Add Lead" to create your first lead.
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              of {table.getFilteredRowModel().rows.length} results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Show</p>
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
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8"
              >
                Next
              </Button>
            </div>
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
