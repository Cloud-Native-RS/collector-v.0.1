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
  Globe, 
  Mail, 
  MapPin, 
  MoreHorizontal, 
  Phone, 
  User,
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
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { type Company } from "./types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const createColumns = (onCompanyClick?: (company: Company) => void): ColumnDef<Company>[] => [
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
        <button
          onClick={() => onCompanyClick?.(row.original)}
          className="font-medium hover:text-primary hover:underline cursor-pointer text-left transition-colors text-sm"
        >
          {row.original.legalName}
        </button>
      );
    },
    size: 200,
  },
  {
    accessorKey: "companyType",
    header: "Type",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="text-sm truncate">{row.original.companyType}</span>
        </div>
      );
    },
    size: 180,
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => <span className="text-sm">{row.getValue("industry") || "—"}</span>,
    size: 150,
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
          <div className="flex items-center gap-1.5 min-w-[130px]">
            <User className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-sm truncate">
              {primaryContact.firstName} {primaryContact.lastName}
            </span>
          </div>
        );
      }
      
      // Fallback ako nema kontakata ili kontakt nema ime/prezime
      return (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
    size: 180,
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
    accessorKey: "taxId",
    header: "Tax ID",
    cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("taxId") || "—"}</div>,
    size: 150,
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
            <DropdownMenuItem onClick={() => onCompanyClick?.(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
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

interface CompanyDataTableProps {
  data: Company[];
  onCompanyClick?: (company: Company) => void;
}

export default function CompanyDataTable({ data, onCompanyClick }: CompanyDataTableProps) {
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

  const columns = React.useMemo(() => createColumns(onCompanyClick), [onCompanyClick]);

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
      toast.error("No companies to export");
      return;
    }

    // Create CSV headers
    const headers = ["Legal Name", "Trading Name", "Company Type", "Industry", "Email", "Phone", "City", "Country", "Tax ID", "Status"];
    
    // Create CSV rows
    const csvRows = [
      headers.join(","),
      ...rowsToExport.map(company => {
        const tradingName = (company.tradingName || "").replace(/"/g, '""');
        return [
          `"${company.legalName.replace(/"/g, '""')}"`,
          `"${tradingName}"`,
          `"${company.companyType}"`,
          `"${company.industry || ""}"`,
          `"${company.contactInfo.email}"`,
          `"${company.contactInfo.phone || ""}"`,
          `"${company.address.city}"`,
          `"${company.address.country}"`,
          `"${company.taxId || ""}"`,
          `"${company.status}"`
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `companies-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${rowsToExport.length} company/companies`);
  }, [selectedRows, selectedCount, table]);

  // Bulk delete
  const handleBulkDelete = React.useCallback(() => {
    if (selectedCount === 0) {
      toast.error("No companies selected");
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedCount} company/companies?`)) {
      // TODO: Implement actual delete API call
      toast.success(`Deleted ${selectedCount} company/companies`);
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

  return (
    <div className="w-full space-y-2">
      {/* Compact Toolbar */}
      <div className="grid grid-cols-12 gap-2 items-center px-3 py-2">
        {/* Search */}
        <div className="col-span-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
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
                       column.id === "legalName" ? "Legal Name" :
                       column.id === "companyType" ? "Type" :
                       column.id === "industry" ? "Industry" :
                       column.id === "contact" ? "Contact" :
                       column.id === "location" ? "Location" :
                       column.id === "taxId" ? "Tax ID" :
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      row.getIsSelected() && "bg-muted"
                    )}
                    onClick={() => onCompanyClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className={cn(
                          "py-2 text-sm",
                          cell.column.id === "select" && "w-10",
                          cell.column.id === "rowNumber" && "w-10",
                          cell.column.id === "actions" && "w-10"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Building2 className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No companies found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Show</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[70px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground">entries</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 px-2 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 px-2 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

