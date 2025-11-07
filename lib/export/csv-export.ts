/**
 * CSV Export Utility
 * Converts data arrays to CSV format with proper escaping
 */

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: unknown, row: T) => string;
}

export interface CsvExportOptions<T> {
  filename?: string;
  columns: ExportColumn<T>[];
  data: T[];
  includeHeaders?: boolean;
  delimiter?: string;
}

/**
 * Escapes CSV value to handle quotes, commas, and newlines
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // Check if value needs to be quoted (contains comma, quote, or newline)
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Gets nested value from object using dot notation
 * Example: getValue(obj, 'company.name') => obj.company.name
 */
function getValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((current: any, key) => current?.[key], obj);
}

/**
 * Converts data array to CSV string
 */
export function convertToCSV<T>(options: CsvExportOptions<T>): string {
  const {
    columns,
    data,
    includeHeaders = true,
    delimiter = ",",
  } = options;

  const rows: string[] = [];

  // Add header row
  if (includeHeaders) {
    const headers = columns.map((col) => escapeCsvValue(col.label));
    rows.push(headers.join(delimiter));
  }

  // Add data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const rawValue = getValue(row, col.key as string);
      const formattedValue = col.format ? col.format(rawValue, row) : rawValue;
      return escapeCsvValue(formattedValue);
    });
    rows.push(values.join(delimiter));
  }

  return rows.join("\n");
}

/**
 * Downloads CSV file to user's computer
 */
export function downloadCSV<T>(options: CsvExportOptions<T>): void {
  const { filename = "export.csv", ...csvOptions } = options;

  const csvContent = convertToCSV(csvOptions);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Create download link
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Exports data to CSV format
 * @example
 * ```ts
 * exportToCSV({
 *   filename: 'contacts.csv',
 *   data: contacts,
 *   columns: [
 *     { key: 'firstName', label: 'First Name' },
 *     { key: 'email', label: 'Email' },
 *     { key: 'createdAt', label: 'Created', format: (val) => new Date(val).toLocaleDateString() }
 *   ]
 * });
 * ```
 */
export function exportToCSV<T>(options: CsvExportOptions<T>): void {
  downloadCSV(options);
}
