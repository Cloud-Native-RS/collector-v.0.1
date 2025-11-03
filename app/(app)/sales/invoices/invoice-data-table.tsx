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
import { ArrowUpDown, Calendar, DollarSign, FileText, MoreHorizontal, Receipt, Download, Eye, Send, CreditCard, AlertCircle, Check } from "lucide-react";
import { invoicesApi, type Invoice } from "@/lib/api/invoices";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const getStatusBadge = (status: Invoice["status"]) => {
  const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    DRAFT: { variant: "outline", label: "Draft" },
    ISSUED: { variant: "default", label: "Issued" },
    PAID: { variant: "default", label: "Paid" },
    PARTIALLY_PAID: { variant: "secondary", label: "Partially Paid" },
    OVERDUE: { variant: "destructive", label: "Overdue" },
    CANCELED: { variant: "outline", label: "Canceled" },
    REFUNDED: { variant: "secondary", label: "Refunded" }
  };

  const config = statusMap[status] || statusMap.DRAFT;
  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  );
};

const createColumns = (onRefresh?: () => void): ColumnDef<Invoice>[] => [
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
    accessorKey: "invoiceNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Invoice #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium font-mono text-sm">{row.getValue("invoiceNumber")}</div>
    )
  },
  {
    accessorKey: "customerId",
    header: "Customer",
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("customerId")}</div>
    )
  },
  {
    accessorKey: "issueDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Issue Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("issueDate"));
      return (
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{format(date, "MMM dd, yyyy")}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dueDate"));
      const isOverdue = new Date() > date && row.original.status !== "PAID";
      return (
        <div className={`flex items-center gap-2 ${isOverdue ? "text-destructive" : ""}`}>
          <Calendar className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{format(date, "MMM dd, yyyy")}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "grandTotal",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const grandTotal = row.getValue("grandTotal");
      const amount = typeof grandTotal === 'string' ? parseFloat(grandTotal) : Number(grandTotal);
      const currency = row.original.currency;
      return (
        <div className="flex items-center gap-2 font-medium">
          <DollarSign className="text-muted-foreground h-4 w-4" />
          <span className="text-sm">{amount.toFixed(2)} {currency}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "outstandingAmount",
    header: "Outstanding",
    cell: ({ row }) => {
      const outstanding = row.getValue("outstandingAmount");
      const amount = typeof outstanding === 'string' ? parseFloat(outstanding) : Number(outstanding);
      const currency = row.original.currency;
      if (amount === 0) {
        return <span className="text-sm text-muted-foreground">-</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{amount.toFixed(2)} {currency}</span>
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
    cell: ({ row }) => getStatusBadge(row.getValue("status"))
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const invoice = row.original;
      
      const handleDownloadPDF = async () => {
        try {
          const blob = await invoicesApi.downloadPDF(invoice.id);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${invoice.invoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success("PDF downloaded successfully");
        } catch (error: any) {
          toast.error(`Failed to download PDF: ${error.message}`);
        }
      };

      const handleIssue = async () => {
        try {
          await invoicesApi.issue(invoice.id);
          toast.success("Invoice issued successfully");
          onRefresh?.();
        } catch (error: any) {
          toast.error(`Failed to issue invoice: ${error.message}`);
        }
      };

      const handlePushToAccounting = async () => {
        try {
          await invoicesApi.pushToAccounting(invoice.id);
          toast.success("Invoice pushed to accounting successfully");
        } catch (error: any) {
          toast.error(`Failed to push to accounting: ${error.message}`);
        }
      };

      const handleCancel = async () => {
        if (!confirm(`Are you sure you want to cancel invoice ${invoice.invoiceNumber}?`)) {
          return;
        }
        try {
          await invoicesApi.cancel(invoice.id);
          toast.success("Invoice canceled successfully");
          onRefresh?.();
        } catch (error: any) {
          toast.error(`Failed to cancel invoice: ${error.message}`);
        }
      };
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            {invoice.status === "DRAFT" && (
              <DropdownMenuItem onClick={handleIssue}>
                <Send className="mr-2 h-4 w-4" />
                Issue Invoice
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {invoice.status !== "PAID" && invoice.status !== "CANCELED" && (
              <RecordPaymentDialog invoice={invoice} onSuccess={() => onRefresh?.()} />
            )}
            <DropdownMenuItem onClick={handlePushToAccounting}>
              <Check className="mr-2 h-4 w-4" />
              Push to Accounting
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {invoice.status === "DRAFT" && (
              <DropdownMenuItem className="text-destructive" onClick={handleCancel}>
                Cancel Invoice
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];

function RecordPaymentDialog({ invoice, onSuccess }: { invoice: Invoice; onSuccess: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [provider, setProvider] = React.useState<"STRIPE" | "PAYPAL" | "BANK_TRANSFER" | "MANUAL" | "CASH">("MANUAL");
  const [transactionId, setTransactionId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const outstanding = typeof invoice.outstandingAmount === 'string' 
        ? parseFloat(invoice.outstandingAmount) 
        : invoice.outstandingAmount;
      
      await invoicesApi.recordPayment({
        invoiceId: invoice.id,
        amount: parseFloat(amount),
        provider,
        transactionId: transactionId || undefined,
      });
      
      toast.success("Payment recorded successfully");
      setOpen(false);
      setAmount("");
      setTransactionId("");
      onSuccess();
    } catch (error: any) {
      toast.error(`Failed to record payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const outstanding = typeof invoice.outstandingAmount === 'string' 
    ? parseFloat(invoice.outstandingAmount) 
    : invoice.outstandingAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <CreditCard className="mr-2 h-4 w-4" />
          Record Payment
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoice.invoiceNumber}. Outstanding amount: ${outstanding.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                max={outstanding}
              />
            </div>
            <div>
              <Label htmlFor="provider">Payment Provider *</Label>
              <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InvoiceDataTable({ data, loading: initialLoading, onRefresh }: { data: Invoice[]; loading?: boolean; onRefresh?: () => void }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Debug: Log data changes
  React.useEffect(() => {
    console.log('InvoiceDataTable - Data received:', data?.length || 0, 'invoices');
    console.log('InvoiceDataTable - Loading state:', initialLoading);
  }, [data, initialLoading]);

  // Create columns with onRefresh access
  const columnsWithActions = React.useMemo(() => {
    return createColumns(onRefresh);
  }, [onRefresh]);

  const table = useReactTable({
    data,
    columns: columnsWithActions,
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

  // Debug: Log table state
  React.useEffect(() => {
    const rows = table.getRowModel().rows;
    console.log('InvoiceDataTable - Table rows:', rows?.length || 0);
    console.log('InvoiceDataTable - Column filters:', columnFilters);
    console.log('InvoiceDataTable - Raw data length:', data?.length || 0);
  }, [table, columnFilters, data]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter by invoice number..."
          value={(table.getColumn("invoiceNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("invoiceNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Select
            value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ISSUED">Issued</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
          </Select>
        </div>
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
            {initialLoading ? (
              <TableRow>
                <TableCell colSpan={columnsWithActions.length} className="h-24 text-center">
                  Loading invoices...
                </TableCell>
              </TableRow>
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
                <TableCell colSpan={columnsWithActions.length} className="h-24 text-center">
                  No invoices found.
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

