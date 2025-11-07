"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Eye,
  ExternalLink,
  Link2,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { Offer } from "@/lib/api/offers";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGenerateOfferToken, useConvertOfferToInvoice } from "@/lib/api/offers-hooks";

const statusColors: Record<
  string,
  "default" | "secondary" | "success" | "destructive" | "outline" | "warning" | "info"
> = {
  DRAFT: "secondary",
  SENT: "info",
  APPROVED: "success",
  REJECTED: "destructive",
  EXPIRED: "warning",
  CANCELLED: "outline",
};

type OffersTableContext = {
  onPreview: (id: string) => void;
  getCustomerName: (id: string) => string;
};

function ActionsCell({ offer }: { offer: Offer }) {
  const generateToken = useGenerateOfferToken();
  const convertToInvoice = useConvertOfferToInvoice();

  const handleGenerateAndOpen = async () => {
    try {
      let token = offer.token;
      if (!token) {
        const response = await generateToken.mutateAsync(offer.id);
        token = response.data.token;
      }
      window.open(`/q/${token}`, "_blank");
    } catch (error) {
      toast.error("Failed to open quotation");
    }
  };

  const handleCopyLink = async () => {
    try {
      let token = offer.token;
      if (!token) {
        const response = await generateToken.mutateAsync(offer.id);
        token = response.data.token;
      }
      const link = `${window.location.origin}/q/${token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/offers/${offer.id}/pdf`);
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${offer.offerNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      await convertToInvoice.mutateAsync(offer.id);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGenerateAndOpen}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Page
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="h-4 w-4 mr-2" />
          Copy Share Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
        {offer.status === "APPROVED" && !offer.convertedToInvoiceId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleConvertToInvoice}>
              Convert to Invoice
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createOffersColumns(context: OffersTableContext): ColumnDef<Offer>[] {
  return [
    {
      accessorKey: "offerNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Offer #
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue("offerNumber")}</div>
      ),
    },
    {
      accessorKey: "customerId",
      header: "Customer",
      cell: ({ row }) => {
        const customerId = row.getValue("customerId") as string;
        return (
          <div className="font-medium">{context.getCustomerName(customerId)}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={statusColors[status] || "default"}>{status}</Badge>;
      },
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Issue Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => format(new Date(row.getValue("issueDate")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "validUntil",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Valid Until
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => format(new Date(row.getValue("validUntil")), "MMM dd, yyyy"),
    },
    {
      accessorKey: "grandTotal",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = row.getValue("grandTotal") as string | number;
        const formatted =
          typeof amount === "string"
            ? parseFloat(amount).toFixed(2)
            : amount.toFixed(2);
        return (
          <div className="font-medium">
            {row.original.currency} {formatted}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionsCell offer={row.original} />,
    },
  ];
}






