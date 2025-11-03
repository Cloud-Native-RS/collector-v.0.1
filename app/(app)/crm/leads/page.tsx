import { generateMeta } from "@/lib/utils";
import { Metadata } from "next";

import LeadsPageClient from "./leads-page-client";
import { type Lead } from "./types";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Leads Management",
    description:
      "Leads Management - Track and manage all your sales leads with status tracking, source attribution, and value estimation.",
    canonical: "/crm/leads"
  });
}

export default async function LeadsPage() {
  // Data will be loaded from API in the client component
  const initialLeads: Lead[] = [];

  return <LeadsPageClient initialLeads={initialLeads} />;
}

