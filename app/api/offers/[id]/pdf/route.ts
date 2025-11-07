import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { PdfTemplate } from "@/app/(app)/sales/quotations/invoice/src/templates/pdf";
import { adaptOfferToInvoice } from "@/app/(app)/sales/quotations/utils/offer-to-invoice-adapter";

const OFFERS_SERVICE_URL = process.env.OFFERS_SERVICE_URL || "http://localhost:3003";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get token from headers or query
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || 
                  request.cookies.get("token")?.value;

    // Fetch offer from offers-service
    const offerResponse = await fetch(`${OFFERS_SERVICE_URL}/api/offers/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "x-tenant-id": request.headers.get("x-tenant-id") || "default-tenant",
      },
    });

    if (!offerResponse.ok) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    const offerData = await offerResponse.json();
    const offer = offerData.data;

    // Convert offer to invoice format
    const invoiceData = adaptOfferToInvoice(offer);

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      await PdfTemplate(invoiceData)
    );

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="quotation-${offer.offerNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[PDF Generation] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

