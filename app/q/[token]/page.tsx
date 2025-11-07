"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download, Check, X, Loader2 } from "lucide-react";
import { HtmlTemplate } from "@/app/(app)/sales/quotations/invoice/src/templates/html";
import { adaptOfferToInvoice } from "@/app/(app)/sales/quotations/utils/offer-to-invoice-adapter";
import type { Offer } from "@/lib/api/offers";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function QuotationPublicPage() {
  const params = useParams();
  const token = params?.token as string;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid quotation link");
      setLoading(false);
      return;
    }

    const fetchOffer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/offers/public/${token}`);
        
        if (!response.ok) {
          throw new Error("Quotation not found or link has expired");
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setOffer(data.data);
        } else {
          throw new Error("Invalid quotation data");
        }
      } catch (err) {
        console.error("[Quotation Public] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load quotation");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [token]);

  const handleDownloadPDF = async () => {
    if (!offer) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/offers/${offer.id}/pdf`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

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
    } catch (err) {
      console.error("[PDF Download] Error:", err);
      toast.error("Failed to download PDF");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!offer) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/offers/${offer.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approverEmail: "customer@example.com", // TODO: Get from form
          comments: "Accepted via public link",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept quotation");
      }

      toast.success("Quotation accepted successfully");
      
      // Refresh offer data
      const refreshResponse = await fetch(`${API_BASE_URL}/api/offers/public/${token}`);
      const refreshData = await refreshResponse.json();
      if (refreshData.success && refreshData.data) {
        setOffer(refreshData.data);
      }
    } catch (err) {
      console.error("[Accept] Error:", err);
      toast.error("Failed to accept quotation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!offer) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/offers/${offer.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approverEmail: "customer@example.com", // TODO: Get from form
          comments: "Rejected via public link",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject quotation");
      }

      toast.success("Quotation rejected");
      
      // Refresh offer data
      const refreshResponse = await fetch(`${API_BASE_URL}/api/offers/public/${token}`);
      const refreshData = await refreshResponse.json();
      if (refreshData.success && refreshData.data) {
        setOffer(refreshData.data);
      }
    } catch (err) {
      console.error("[Reject] Error:", err);
      toast.error("Failed to reject quotation");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Quotation Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "The quotation you're looking for doesn't exist or the link has expired."}
          </p>
        </div>
      </div>
    );
  }

  const invoiceData = adaptOfferToInvoice(offer);
  const canTakeAction = offer.status === "SENT";

  return (
    <div className="min-h-screen bg-background">
      {/* Header with actions */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Quotation {offer.offerNumber}</h1>
            <span className={`px-2 py-1 text-xs rounded-full ${
              offer.status === "APPROVED" ? "bg-green-100 text-green-800" :
              offer.status === "REJECTED" ? "bg-red-100 text-red-800" :
              offer.status === "SENT" ? "bg-blue-100 text-blue-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {offer.status}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {canTakeAction && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={actionLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={actionLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Quotation Content */}
      <div className="container py-6 flex justify-center">
        <HtmlTemplate 
          data={invoiceData} 
          width={794} 
          height={1123} 
        />
      </div>
    </div>
  );
}

