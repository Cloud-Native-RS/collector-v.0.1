export {
  convertToCSV,
  downloadCSV,
  exportToCSV,
  type ExportColumn,
  type CsvExportOptions,
} from "./csv-export";

export {
  convertToExcel,
  downloadExcel,
  exportToExcel,
  exportToExcelMultiSheet,
  type ExcelExportOptions,
  type MultiSheetOptions,
} from "./excel-export";

// Common export formats
export type ExportFormat = "csv" | "excel";

// Re-usable column definitions for common entities
export const commonColumns = {
  contact: [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "company.name", label: "Company" },
    { key: "status", label: "Status" },
    {
      key: "createdAt",
      label: "Created",
      format: (val: unknown) => new Date(val as string).toLocaleDateString(),
    },
  ],
  company: [
    { key: "name", label: "Company Name" },
    { key: "industry", label: "Industry" },
    { key: "website", label: "Website" },
    { key: "employees", label: "Employees" },
    { key: "revenue", label: "Revenue", format: (val: unknown) => `$${val}` },
    { key: "status", label: "Status" },
    {
      key: "createdAt",
      label: "Created",
      format: (val: unknown) => new Date(val as string).toLocaleDateString(),
    },
  ],
  deal: [
    { key: "title", label: "Deal Title" },
    { key: "company.name", label: "Company" },
    { key: "value", label: "Value", format: (val: unknown) => `$${val}` },
    { key: "stage", label: "Stage" },
    { key: "probability", label: "Probability", format: (val: unknown) => `${val}%` },
    {
      key: "expectedCloseDate",
      label: "Expected Close",
      format: (val: unknown) => new Date(val as string).toLocaleDateString(),
    },
    { key: "status", label: "Status" },
  ],
  product: [
    { key: "name", label: "Product Name" },
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price", format: (val: unknown) => `$${val}` },
    { key: "stock", label: "Stock" },
    { key: "status", label: "Status" },
  ],
} as const;
