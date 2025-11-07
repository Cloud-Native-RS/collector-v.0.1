"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, CheckCircle2, Sparkles, Copy, Share2, Download, Mail } from "lucide-react";
import { OfferEditor } from "./offer-editor";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreateOfferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateOfferSheet({ open, onOpenChange, onSuccess }: CreateOfferSheetProps) {
  const [createdOfferId, setCreatedOfferId] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleOfferSuccess = async (data?: { offerId: string; token?: string }) => {
    if (data?.offerId) {
      setCreatedOfferId(data.offerId);
      if (data.token) {
        setCreatedToken(data.token);
      }
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCreatedOfferId(null);
      setCreatedToken(null);
      setIsClosing(false);
      onOpenChange(false);
    }, 200);
  };

  const handleViewPreview = () => {
    if (createdToken) {
      window.open(`/q/${createdToken}`, "_blank");
    }
  };

  const handleCopyLink = async () => {
    if (createdToken) {
      const url = `${window.location.origin}/q/${createdToken}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownloadPDF = () => {
    if (createdOfferId) {
      window.open(`/api/offers/${createdOfferId}/pdf`, "_blank");
      toast.success("Downloading PDF...");
    }
  };

  const handleSendEmail = () => {
    // TODO: Implement email sending
    toast.info("Email functionality coming soon!");
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/10 transition-opacity duration-200",
        isClosing && "opacity-0"
      )}
    >
      {/* Enhanced Header with Better Typography */}
      <div className="relative border-b bg-background/50 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            {createdOfferId ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    Quotation Created
                    <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                  </h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    Ready to share with your customer
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xl font-semibold tracking-tight">Create New Quotation</h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    Fill in the details below to generate your quotation
                  </p>
                </div>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {createdOfferId && createdToken ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            {/* Success Card with Better Spacing */}
            <div className="bg-card border rounded-2xl shadow-xl p-10 space-y-8">
              {/* Success Icon & Message with Better Typography */}
              <div className="text-center space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 border-4 border-green-500/20 shadow-lg">
                      <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold tracking-tight">Quotation Created!</h3>
                  <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Your quotation is ready to be shared with your customer.
                  </p>
                </div>
              </div>

              {/* Link Preview with Better Spacing */}
              <div className="bg-muted/50 rounded-xl p-5 border space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Shareable Link
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 text-sm bg-background px-4 py-3 rounded-lg border font-mono truncate">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/q/${createdToken}`}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="shrink-0 h-10 px-4"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons with Better Sizing */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button
                  onClick={handleViewPreview}
                  size="lg"
                  className="h-14 text-base font-semibold"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View Preview
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  size="lg"
                  className="h-14 text-base font-semibold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </Button>
              </div>

              {/* Secondary Actions with Better Spacing */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleSendEmail}
                  variant="secondary"
                  className="h-11"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send via Email
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="secondary"
                  className="h-11"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>

              {/* Divider with More Space */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    or
                  </span>
                </div>
              </div>

              {/* Close Button with Better Typography */}
              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full h-11 font-medium"
              >
                Close & Return to List
              </Button>
            </div>

            {/* Tips Section with Better Spacing */}
            <div className="mt-8 p-5 bg-primary/5 border border-primary/20 rounded-xl">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Share the link directly with your customer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Download PDF for offline access or printing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Track when your customer views the quotation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Send follow-up reminders automatically</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">
            {/* Progress Indicator with Better Typography */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Step 1 of 1
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Fill Quotation Details
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-primary to-primary/80 w-full transition-all duration-300 rounded-full" />
              </div>
            </div>

            {/* Form Card with Better Shadow */}
            <div className="bg-card border rounded-2xl shadow-lg overflow-hidden">
              <OfferEditor
                onSuccess={handleOfferSuccess}
                onCancel={handleClose}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
