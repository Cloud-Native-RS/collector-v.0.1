import { generateMeta } from "@/lib/utils";
import { Metadata } from "next";

import PipelinesPageClient from "./pipelines-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Sales Pipelines",
    description:
      "Sales Pipelines Analytics - Comprehensive view of your sales pipeline performance, conversion rates, and stage analytics.",
    canonical: "/crm/pipelines"
  });
}

export default async function PipelinesPage() {
  return <PipelinesPageClient />;
}

