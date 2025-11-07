/**
 * EXAMPLE: How to make tables mobile-responsive
 *
 * OPTION 1: Horizontal Scroll (Simple, works for most cases)
 * -------------------------------------------------------
 * ```tsx
 * import { ResponsiveTableWrapper } from "@/components/ui/responsive-table-wrapper";
 *
 * <ResponsiveTableWrapper>
 *   <Table>
 *     <TableHeader>...</TableHeader>
 *     <TableBody>...</TableBody>
 *   </Table>
 * </ResponsiveTableWrapper>
 * ```
 *
 * OPTION 2: Mobile Card View (Better UX for complex tables)
 * ---------------------------------------------------------
 * ```tsx
 * import { MobileCardView } from "@/components/ui/mobile-card-view";
 * import { useMediaQuery } from "@/hooks/use-media-query";
 *
 * function ContactsTable({ contacts }) {
 *   const isMobile = useMediaQuery("(max-width: 768px)");
 *
 *   if (isMobile) {
 *     return (
 *       <MobileCardView
 *         data={contacts}
 *         renderCard={(contact) => (
 *           <div className="space-y-2">
 *             <div className="flex items-center justify-between">
 *               <h3 className="font-semibold">{contact.firstName} {contact.lastName}</h3>
 *               <Badge>{contact.status}</Badge>
 *             </div>
 *             <div className="flex items-center gap-2 text-sm text-muted-foreground">
 *               <Mail className="h-4 w-4" />
 *               {contact.email}
 *             </div>
 *             <div className="flex items-center gap-2 text-sm text-muted-foreground">
 *               <Phone className="h-4 w-4" />
 *               {contact.phone}
 *             </div>
 *           </div>
 *         )}
 *       />
 *     );
 *   }
 *
 *   return (
 *     <Table>
 *       <TableHeader>...</TableHeader>
 *       <TableBody>...</TableBody>
 *     </Table>
 *   );
 * }
 * ```
 *
 * OPTION 3: Hybrid Approach (Best of both worlds)
 * ------------------------------------------------
 * ```tsx
 * function DataTable({ data }) {
 *   const isMobile = useMediaQuery("(max-width: 768px)");
 *
 *   return (
 *     <>
 *       {/* Mobile: Card View */}
 *       <div className="md:hidden">
 *         <MobileCardView data={data} renderCard={renderMobileCard} />
 *       </div>
 *
 *       {/* Desktop: Table */}
 *       <div className="hidden md:block">
 *         <ResponsiveTableWrapper>
 *           <Table>...</Table>
 *         </ResponsiveTableWrapper>
 *       </div>
 *     </>
 *   );
 * }
 * ```
 *
 * WHEN TO USE WHAT:
 * - Simple tables (< 5 columns): Use ResponsiveTableWrapper
 * - Complex tables (> 5 columns): Use MobileCardView
 * - Mixed content: Use Hybrid Approach
 */

export {};
