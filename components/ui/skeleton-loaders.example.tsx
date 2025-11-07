/**
 * EXAMPLE: How to use skeleton loaders
 *
 * BASIC USAGE WITH REACT QUERY:
 * ```tsx
 * import { useContacts } from "@/lib/react-query";
 * import { TableSkeleton } from "@/components/ui/skeleton-loaders";
 *
 * function ContactsPage() {
 *   const { data, isLoading } = useContacts();
 *
 *   if (isLoading) {
 *     return <TableSkeleton rows={10} columns={5} />;
 *   }
 *
 *   return <DataTable data={data} />;
 * }
 * ```
 *
 * DASHBOARD STATS:
 * ```tsx
 * import { StatsCardSkeleton } from "@/components/ui/skeleton-loaders";
 *
 * {isLoading ? (
 *   <StatsCardSkeleton count={4} />
 * ) : (
 *   <StatsCards data={stats} />
 * )}
 * ```
 *
 * DETAIL PANEL:
 * ```tsx
 * import { DetailPanelSkeleton } from "@/components/ui/skeleton-loaders";
 *
 * <Sheet open={open}>
 *   <SheetContent>
 *     {isLoading ? (
 *       <DetailPanelSkeleton />
 *     ) : (
 *       <ContactDetails contact={contact} />
 *     )}
 *   </SheetContent>
 * </Sheet>
 * ```
 *
 * KANBAN BOARD:
 * ```tsx
 * import { KanbanSkeleton } from "@/components/ui/skeleton-loaders";
 *
 * {isLoading ? (
 *   <KanbanSkeleton columns={5} cardsPerColumn={4} />
 * ) : (
 *   <KanbanBoard deals={deals} />
 * )}
 * ```
 *
 * CARD GRID:
 * ```tsx
 * import { CardGridSkeleton } from "@/components/ui/skeleton-loaders";
 *
 * {isLoading ? (
 *   <CardGridSkeleton count={6} />
 * ) : (
 *   <ProductGrid products={products} />
 * )}
 * ```
 *
 * BENEFITS:
 * - Better perceived performance
 * - Reduces "flash of empty content"
 * - Shows users that content is loading
 * - Maintains layout stability
 */

export {};
