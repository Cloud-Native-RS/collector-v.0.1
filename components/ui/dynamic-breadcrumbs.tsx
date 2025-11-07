"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Custom labels for routes
const routeLabels: Record<string, string> = {
  crm: "CRM",
  "contacts-registry": "Contacts",
  "company-registry": "Companies",
  leads: "Leads",
  deals: "Deals",
  pipelines: "Pipelines",
  sales: "Sales",
  orders: "Orders",
  invoices: "Invoices",
  quotations: "Quotations",
  payments: "Payments",
  contracts: "Contracts",
  "price-lists": "Price Lists",
  inventory: "Inventory",
  "products-services": "Products & Services",
  "stock-management": "Stock",
  warehouses: "Warehouses",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  "delivery-notes": "Delivery Notes",
  hr: "HR",
  payroll: "Payroll",
  finance: "Finance",
  "project-management": "Projects",
  logistics: "Logistics",
  apps: "Apps",
  calendar: "Calendar",
  tasks: "Tasks",
  chat: "Chat",
  mail: "Mail",
  kanban: "Kanban",
  notes: "Notes",
  "file-manager": "File Manager",
  "pos-system": "POS System",
  "ai-chat": "AI Assistant",
  "todo-list-app": "Todo List",
  pages: "Pages",
  settings: "Settings",
};

// Function to format segment (fallback if not in routeLabels)
function formatSegment(segment: string): string {
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  // Format like "my-page" -> "My Page"
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DynamicBreadcrumbs() {
  const pathname = usePathname();

  // Skip breadcrumbs for home or auth pages
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null;
  }

  // Parse pathname into segments
  const segments = pathname
    .split("/")
    .filter((segment) => segment && !segment.startsWith("(") && !segment.endsWith(")"));

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = formatSegment(segment);
    const isLast = index === segments.length - 1;

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.length > 0 && (
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
        )}

        {/* Dynamic breadcrumbs */}
        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center gap-2">
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>

            {!item.isLast && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
