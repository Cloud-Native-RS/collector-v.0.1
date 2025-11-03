import { NextRequest, NextResponse } from "next/server";
import { customersApi } from "@/lib/api/registry";

/**
 * GET /api/crm/contacts/[id]/notes
 * Fetch notes for a specific contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Fetch customer by ID from registry service
    const response = await customersApi.getById(id);
    const customer = response.data;

    if (!customer) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Extract notes from customer data
    // Notes might be stored in different ways - adjust based on your data structure
    // For now, return empty array if no notes field exists
    const notes: string[] = [];
    
    // If customer has notes field, parse it
    // This assumes notes might be stored as a string or array
    if ((customer as any).notes) {
      if (typeof (customer as any).notes === "string") {
        // If notes is a string, try to parse it as JSON array or split by newlines
        try {
          const parsed = JSON.parse((customer as any).notes);
          if (Array.isArray(parsed)) {
            notes.push(...parsed);
          } else {
            notes.push((customer as any).notes);
          }
        } catch {
          // If not JSON, treat as single note or split by newlines
          const noteLines = (customer as any).notes.split("\n").filter((line: string) => line.trim());
          notes.push(...noteLines);
        }
      } else if (Array.isArray((customer as any).notes)) {
        notes.push(...(customer as any).notes);
      }
    }

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error("Error fetching contact notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes", details: error.message },
      { status: 500 }
    );
  }
}

