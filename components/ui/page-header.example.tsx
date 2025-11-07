/**
 * EXAMPLE: How to use PageHeader with breadcrumbs
 *
 * SIMPLE USAGE:
 * ```tsx
 * import { PageHeader } from "@/components/ui/page-header";
 *
 * <PageHeader
 *   title="Contacts"
 *   description="Manage your contacts and customer relationships"
 * />
 * ```
 *
 * WITH ACTIONS:
 * ```tsx
 * import { PageHeader } from "@/components/ui/page-header";
 * import { Button } from "@/components/ui/button";
 * import { Plus } from "lucide-react";
 *
 * <PageHeader
 *   title="Contacts"
 *   description="Manage your contacts and customer relationships"
 *   actions={
 *     <>
 *       <Button variant="outline">
 *         <Download className="h-4 w-4 mr-2" />
 *         Export
 *       </Button>
 *       <Button>
 *         <Plus className="h-4 w-4 mr-2" />
 *         Add Contact
 *       </Button>
 *     </>
 *   }
 * />
 * ```
 *
 * WITHOUT BREADCRUMBS:
 * ```tsx
 * <PageHeader
 *   title="Settings"
 *   showBreadcrumbs={false}
 * />
 * ```
 *
 * The breadcrumbs are automatically generated from the URL path:
 * /crm/contacts-registry → Home > CRM > Contacts
 * /inventory/products-services → Home > Inventory > Products & Services
 * /apps/calendar → Home > Apps > Calendar
 */

export {};
