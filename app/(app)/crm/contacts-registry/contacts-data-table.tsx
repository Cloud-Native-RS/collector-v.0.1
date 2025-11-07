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
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import { 
  ArrowUpDown, 
  Building2, 
  Mail, 
  MapPin, 
  MoreHorizontal, 
  Phone,
  Search,
  Download,
  Trash2,
  Eye,
  Settings2,
  X,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { type Contact } from "./types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Column definitions
export const columns: ColumnDef<Contact>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "rowNumber",
    header: "#",
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      return <div className="text-sm text-muted-foreground w-8">{pageIndex * pageSize + row.index + 1}</div>;
    },
    enableSorting: false,
    enableHiding: false,
    size: 60,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 h-8 data-[state=open]:bg-accent"
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
      
      return (
        <div className="flex flex-col gap-0 min-w-[180px]">
          <div className="text-sm font-medium leading-tight">
            {fullName || row.original.email || row.original.contactNumber || 'N/A'}
          </div>
          {row.original.title && (
            <div className="text-xs text-muted-foreground leading-tight">{row.original.title}</div>
          )}
        </div>
      );
    },
    size: 250,
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
      
      let displayName = legalName || companyName || '';
      displayName = displayName
        .replace(/^Trading as:\s*/i, '')
        .replace(/Trading as:\s*/i, '')
        .trim();
      
      return (
        <div className="flex items-center gap-1.5 min-w-[140px]">
          <Building2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <span className="text-sm truncate">{displayName}</span>
        </div>
      );
    },
    size: 200,
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
    },
    size: 150,
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-0.5 min-w-[160px]">
          {row.original.phone && (
            <div className="flex items-center gap-1.5 text-sm">
              <Phone className="text-muted-foreground h-3 w-3 shrink-0" />
              <span className="truncate">{row.original.phone}</span>
            </div>
          )}
          {row.original.email && (
            <div className="flex items-center gap-1.5 text-sm">
              <Mail className="text-muted-foreground h-3 w-3 shrink-0" />
              <span className="truncate">{row.original.email}</span>
            </div>
          )}
        </div>
      );
    },
    size: 220,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const address = row.original.address;
      return (
        <div className="flex items-center gap-1.5 min-w-[130px]">
          <MapPin className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <span className="text-sm truncate">{`${address.city}, ${address.country}`}</span>
        </div>
      );
    },
    size: 180,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3 h-8 data-[state=open]:bg-accent"
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
    },
    size: 120,
  },
  {
    id: "actions",
    enableHiding: false,
    size: 50,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View contact
            </DropdownMenuItem>
            <DropdownMenuItem>
              View company
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

interface ContactsDataTableProps {
  data: Contact[];
  allContacts?: Contact[];
  onContactClick?: (contact: Contact) => void;
  loading?: boolean;
}

export default function ContactsDataTable({ 
  data, 
  allContacts,
  onContactClick,
  loading = false 
}: ContactsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Debounced global filter
  const [debouncedFilter, setDebouncedFilter] = React.useState("");
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilter(globalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [globalFilter]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: debouncedFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 25
      }
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // Export to CSV
  const handleExport = React.useCallback(() => {
    const rowsToExport = selectedCount > 0 
      ? selectedRows.map(row => row.original)
      : table.getFilteredRowModel().rows.map(row => row.original);

    if (rowsToExport.length === 0) {
      toast.error("No contacts to export");
      return;
    }

    // Create CSV headers
    const headers = ["Name", "Email", "Phone", "Company", "Department", "City", "Country", "Status"];
    
    // Create CSV rows
    const csvRows = [
      headers.join(","),
      ...rowsToExport.map(contact => {
        const name = `${contact.firstName} ${contact.lastName}`.trim() || contact.email || "N/A";
        const company = (contact.companyLegalName || contact.companyName || "").replace(/"/g, '""');
        return [
          `"${name.replace(/"/g, '""')}"`,
          `"${contact.email}"`,
          `"${contact.phone}"`,
          `"${company}"`,
          `"${contact.department || ""}"`,
          `"${contact.address.city}"`,
          `"${contact.address.country}"`,
          `"${contact.status}"`
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${rowsToExport.length} contact(s)`);
  }, [selectedRows, selectedCount, table]);

  // Bulk delete
  const handleBulkDelete = React.useCallback(() => {
    if (selectedCount === 0) {
      toast.error("No contacts selected");
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedCount} contact(s)?`)) {
      // TODO: Implement actual delete API call
      toast.success(`Deleted ${selectedCount} contact(s)`);
      setRowSelection({});
    }
  }, [selectedCount]);

  // Clear filters
  const handleClearFilters = React.useCallback(() => {
    setGlobalFilter("");
    setColumnFilters([]);
    setRowSelection({});
  }, []);

  const hasActiveFilters = globalFilter || columnFilters.length > 0 || selectedCount > 0;

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Compact Toolbar */}
      <div className="grid grid-cols-12 gap-2 items-center px-3 py-2">
        {/* Search */}
        <div className="col-span-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
            {globalFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => setGlobalFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Actions & Controls */}
        <div className="col-span-6 flex items-center justify-end gap-1">
          {selectedCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
              <Separator orientation="vertical" className="h-3 mx-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-6 px-2 text-xs"
              >
                <Download className="mr-1 h-3 w-3" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          )}
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                <Settings2 className="mr-1 h-3 w-3" />
                Columns
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide() && column.id !== "select")
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "rowNumber" ? "#" : 
                       column.id === "name" ? "Name" :
                       column.id === "companyName" ? "Company" :
                       column.id === "department" ? "Department" :
                       column.id === "contact" ? "Contact" :
                       column.id === "location" ? "Location" :
                       column.id === "status" ? "Status" :
                       column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Compact Table with Zebra Striping */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className={cn(
                          "h-8 py-1 text-xs font-medium text-muted-foreground",
                          header.id === "select" && "w-10",
                          header.id === "rowNumber" && "w-10",
                          header.id === "actions" && "w-10"
                        )}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow 
                    key={row.id} 
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onContactClick?.(row.original)}
                    className={cn(
                      onContactClick && "cursor-pointer",
                      row.getIsSelected() && "bg-primary/5",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "hover:bg-muted/40 transition-colors border-b"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className="py-1 text-sm"
                        onClick={(e) => {
                          if (cell.column.id === "select" || cell.column.id === "actions") {
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
                  <TableCell colSpan={columns.length} className="h-16 text-center py-4">
                    <p className="text-xs text-muted-foreground">No contacts found.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <p className="text-muted-foreground text-xs">Show</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
              <SelectTrigger className="w-[70px] h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">entries</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-muted-foreground text-xs">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-6 px-2 text-xs"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-6 px-2 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
