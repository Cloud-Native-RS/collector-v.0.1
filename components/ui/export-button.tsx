"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { exportToCSV, exportToExcel, type ExportColumn } from "@/lib/export";
import { toast } from "sonner";

export interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  entityName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

export function ExportButton<T>({
  data,
  columns,
  filename = "export",
  entityName = "Data",
  variant = "outline",
  size = "default",
  className,
  disabled = false,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "excel") => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);

    try {
      // Add small delay for better UX (shows loading state)
      await new Promise((resolve) => setTimeout(resolve, 300));

      const timestamp = new Date().toISOString().split("T")[0];
      const fullFilename = `${filename}-${timestamp}`;

      if (format === "csv") {
        exportToCSV({
          data,
          columns,
          filename: `${fullFilename}.csv`,
        });
        toast.success(`Exported ${data.length} ${entityName.toLowerCase()}(s) to CSV`);
      } else {
        exportToExcel({
          data,
          columns,
          filename: `${fullFilename}.xlsx`,
          sheetName: entityName,
        });
        toast.success(`Exported ${data.length} ${entityName.toLowerCase()}(s) to Excel`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={disabled || isExporting || data.length === 0}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("csv")} disabled={isExporting}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")} disabled={isExporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
