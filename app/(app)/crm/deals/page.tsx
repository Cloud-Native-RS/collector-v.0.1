import { generateMeta } from "@/lib/utils";
import { Metadata } from "next";

import DealsPageClient from "./deals-page-client";
import { type Deal } from "./types";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Deals Management",
    description:
      "Deals Management - Track and manage all your sales deals with pipeline stages, value tracking, and probability estimation.",
    canonical: "/crm/deals"
  });
}

export default async function DealsPage() {
  // Data will be loaded from API in the client component
  const initialDeals: Deal[] = [];

  return <DealsPageClient initialDeals={initialDeals} />;
}

