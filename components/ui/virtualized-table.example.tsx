/**
 * Example: How to convert a regular TanStack Table to use virtualization
 *
 * BEFORE (Regular Table):
 * ```tsx
 * <div className="rounded-md border">
 *   <Table>
 *     <TableHeader>
 *       {table.getHeaderGroups().map((headerGroup) => (
 *         <TableRow key={headerGroup.id}>
 *           {headerGroup.headers.map((header) => (
 *             <TableHead key={header.id}>
 *               {flexRender(header.column.columnDef.header, header.getContext())}
 *             </TableHead>
 *           ))}
 *         </TableRow>
 *       ))}
 *     </TableHeader>
 *     <TableBody>
 *       {table.getRowModel().rows.map((row) => (
 *         <TableRow key={row.id}>
 *           {row.getVisibleCells().map((cell) => (
 *             <TableCell key={cell.id}>
 *               {flexRender(cell.column.columnDef.cell, cell.getContext())}
 *             </TableCell>
 *           ))}
 *         </TableRow>
 *       ))}
 *     </TableBody>
 *   </Table>
 * </div>
 * ```
 *
 * AFTER (Virtualized Table):
 * ```tsx
 * import { VirtualizedTable } from "@/components/ui/virtualized-table";
 *
 * <div className="rounded-md border">
 *   <VirtualizedTable
 *     table={table}
 *     estimateSize={53}  // Estimated row height in pixels
 *     overscan={5}       // Number of rows to render outside viewport
 *   />
 * </div>
 * ```
 *
 * BENEFITS:
 * - Only renders visible rows + overscan
 * - Handles 10,000+ rows smoothly
 * - Reduces memory usage by 70-90%
 * - Improves scroll performance significantly
 *
 * WHEN TO USE:
 * - Tables with 50+ rows
 * - Lists with heavy cell content (images, charts, etc.)
 * - Infinite scroll scenarios
 * - Performance-critical data tables
 *
 * NOTE: For tables with < 50 rows, regular table is fine.
 */

export {}; // This is just documentation file
