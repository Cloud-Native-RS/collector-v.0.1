/**
 * EXAMPLE: How to use AdvancedFilter component
 *
 * SETUP:
 * ```tsx
 * import { AdvancedFilter, type FilterField } from "@/components/ui/advanced-filter";
 * import { type Contact } from "@/types";
 *
 * function ContactsPage() {
 *   const [contacts, setContacts] = useState<Contact[]>([...]);
 *   const [filteredContacts, setFilteredContacts] = useState<Contact[]>(contacts);
 *
 *   // Define filterable fields
 *   const filterFields: FilterField[] = [
 *     {
 *       key: "firstName",
 *       label: "First Name",
 *       type: "text",
 *       placeholder: "Enter first name"
 *     },
 *     {
 *       key: "email",
 *       label: "Email Address",
 *       type: "text",
 *       placeholder: "Enter email"
 *     },
 *     {
 *       key: "status",
 *       label: "Status",
 *       type: "select",
 *       options: [
 *         { value: "active", label: "Active" },
 *         { value: "inactive", label: "Inactive" },
 *         { value: "pending", label: "Pending" },
 *         { value: "archived", label: "Archived" },
 *       ]
 *     },
 *     {
 *       key: "createdAt",
 *       label: "Created Date",
 *       type: "date"
 *     },
 *     {
 *       key: "companyName",
 *       label: "Company",
 *       type: "text"
 *     }
 *   ];
 *
 *   return (
 *     <div>
 *       <div className="flex items-center gap-2 mb-4">
 *         <AdvancedFilter
 *           fields={filterFields}
 *           data={contacts}
 *           onFilterChange={(filtered) => setFilteredContacts(filtered)}
 *         />
 *       </div>
 *
 *       <ContactsTable data={filteredContacts} />
 *     </div>
 *   );
 * }
 * ```
 *
 * FIELD TYPES:
 *
 * 1. TEXT FILTERS:
 * ```tsx
 * {
 *   key: "firstName",
 *   label: "First Name",
 *   type: "text",
 *   placeholder: "Enter first name"
 * }
 * ```
 * Operators: equals, notEquals, contains, notContains, startsWith, endsWith, isNull, isNotNull
 *
 * 2. NUMBER FILTERS:
 * ```tsx
 * {
 *   key: "age",
 *   label: "Age",
 *   type: "number",
 *   placeholder: "Enter age"
 * }
 * ```
 * Operators: equals, notEquals, greaterThan, lessThan, greaterThanOrEqual, lessThanOrEqual, between, isNull, isNotNull
 *
 * 3. DATE FILTERS:
 * ```tsx
 * {
 *   key: "createdAt",
 *   label: "Created Date",
 *   type: "date"
 * }
 * ```
 * Operators: equals, notEquals, greaterThan, lessThan, between, isNull, isNotNull
 *
 * 4. SELECT/ENUM FILTERS:
 * ```tsx
 * {
 *   key: "status",
 *   label: "Status",
 *   type: "select",
 *   options: [
 *     { value: "active", label: "Active" },
 *     { value: "inactive", label: "Inactive" }
 *   ]
 * }
 * ```
 * Operators: equals, notEquals, in, notIn, isNull, isNotNull
 *
 * 5. BOOLEAN FILTERS:
 * ```tsx
 * {
 *   key: "isVerified",
 *   label: "Verified",
 *   type: "boolean"
 * }
 * ```
 * Operators: equals
 *
 * NESTED FIELDS:
 * Access nested properties using dot notation:
 * ```tsx
 * {
 *   key: "company.name",
 *   label: "Company Name",
 *   type: "text"
 * },
 * {
 *   key: "address.city",
 *   label: "City",
 *   type: "text"
 * }
 * ```
 *
 * ADVANCED EXAMPLES:
 *
 * 1. Multi-condition filtering (all conditions must match):
 * - Filter contacts where:
 *   - Status = "active"
 *   - Created date > "2024-01-01"
 *   - Company name contains "Tech"
 *
 * 2. Date range filtering:
 * - Created date between "2024-01-01" and "2024-12-31"
 *
 * 3. Multi-select filtering:
 * - Status in ["active", "pending"]
 *
 * 4. Complex text filtering:
 * - Email contains "@example.com"
 * - First name starts with "John"
 *
 * FEATURES:
 * - Multiple filter conditions (AND logic)
 * - Visual filter badges showing active filters
 * - Clear individual or all filters
 * - Date picker UI for date fields
 * - Dropdown for select fields
 * - Real-time filtering as you type
 * - Empty/null value checking
 * - Nested property support
 *
 * BENEFITS:
 * - User-friendly filter UI
 * - Type-safe filtering
 * - No manual filter logic needed
 * - Consistent UX across tables
 * - Flexible operator system
 * - Works with any data type
 */

export {};
