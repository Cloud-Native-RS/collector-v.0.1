import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const dataFilePath = path.join(process.cwd(), "app/(app)/crm/contacts-registry/data.json");

export async function GET() {
  try {
    const data = await fs.readFile(dataFilePath, "utf-8");
    const contacts = JSON.parse(data);
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to read contacts data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read existing contacts
    const data = await fs.readFile(dataFilePath, "utf-8");
    const contacts = JSON.parse(data);

    // Get the form data
    const formData = await request.json();

    // Generate new ID
    const maxId = Math.max(...contacts.map((c: any) => c.id), 0);
    const newId = maxId + 1;

    // Generate contact number (format: XX with zero padding)
    const contactNumber = String(newId).padStart(2, "0");

    // Create new contact object
    const newContact = {
      id: newId,
      contactNumber,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      title: formData.title || null,
      department: formData.department || null,
      companyId: formData.companyName ? Math.floor(Math.random() * 25) + 1 : null,
      companyName: formData.companyName || null,
      status: formData.status || "active",
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state || null,
        zipCode: formData.zipCode,
        country: formData.country,
      },
      tenantId: "tenant-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add new contact to the array
    contacts.push(newContact);

    // Write back to file
    await fs.writeFile(dataFilePath, JSON.stringify(contacts, null, 2), "utf-8");

    return NextResponse.json(
      { success: true, data: newContact },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact", details: error.message },
      { status: 500 }
    );
  }
}

