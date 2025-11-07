/**
 * Excel Export Utility
 * Uses SheetJS (xlsx) to create Excel files with formatting
 */

import * as XLSX from "xlsx";
import type { ExportColumn } from "./csv-export";

export interface ExcelExportOptions<T> {
  filename?: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  data: T[];
  includeHeaders?: boolean;
}

/**
 * Gets nested value from object using dot notation
 */
function getValue<T>(obj: T, path: string): unknown {
  return path.split(".").reduce((current: any, key) => current?.[key], obj);
}

/**
 * Converts data array to Excel workbook
 */
export function convertToExcel<T>(options: ExcelExportOptions<T>): XLSX.WorkBook {
  const {
    columns,
    data,
    includeHeaders = true,
    sheetName = "Sheet1",
  } = options;

  // Build array of arrays (AOA format)
  const rows: unknown[][] = [];

  // Add header row
  if (includeHeaders) {
    rows.push(columns.map((col) => col.label));
  }

  // Add data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const rawValue = getValue(row, col.key as string);
      return col.format ? col.format(rawValue, row) : rawValue;
    });
    rows.push(values);
  }

  // Create worksheet from AOA
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Auto-size columns based on content
  const columnWidths = columns.map((col, idx) => {
    // Calculate max width for this column
    let maxWidth = col.label.length;

    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
      const value = rows[rowIdx + (includeHeaders ? 1 : 0)]?.[idx];
      const valueLength = String(value ?? "").length;
      maxWidth = Math.max(maxWidth, valueLength);
    }

    return { wch: Math.min(maxWidth + 2, 50) }; // Max width of 50
  });

  worksheet["!cols"] = columnWidths;

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return workbook;
}

/**
 * Downloads Excel file to user's computer
 */
export function downloadExcel<T>(options: ExcelExportOptions<T>): void {
  const { filename = "export.xlsx", ...excelOptions } = options;

  const workbook = convertToExcel(excelOptions);

  // Write workbook and trigger download
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports data to Excel format
 * @example
 * ```ts
 * exportToExcel({
 *   filename: 'contacts.xlsx',
 *   sheetName: 'Contacts',
 *   data: contacts,
 *   columns: [
 *     { key: 'firstName', label: 'First Name' },
 *     { key: 'email', label: 'Email' },
 *     { key: 'createdAt', label: 'Created', format: (val) => new Date(val).toLocaleDateString() }
 *   ]
 * });
 * ```
 */
export function exportToExcel<T>(options: ExcelExportOptions<T>): void {
  downloadExcel(options);
}

/**
 * Exports multiple sheets to a single Excel file
 */
export interface MultiSheetOptions<T> {
  filename?: string;
  sheets: Array<{
    name: string;
    columns: ExportColumn<T>[];
    data: T[];
  }>;
}

export function exportToExcelMultiSheet<T>(options: MultiSheetOptions<T>): void {
  const { filename = "export.xlsx", sheets } = options;

  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const ws = convertToExcel({
      columns: sheet.columns,
      data: sheet.data,
      sheetName: sheet.name,
    }).Sheets[sheet.name];

    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }

  XLSX.writeFile(workbook, filename);
}
