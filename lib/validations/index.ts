// Export all validation schemas
export * from "./contact.schema";
export * from "./company.schema";
export * from "./deal.schema";
export * from "./product.schema";

// Common validation utilities
export { z } from "zod";

// Helper function to get form-friendly error messages
export function getZodErrorMap(error: any): Record<string, string> {
  if (!error?.errors) return {};

  const errorMap: Record<string, string> = {};
  error.errors.forEach((err: any) => {
    const path = err.path.join(".");
    errorMap[path] = err.message;
  });

  return errorMap;
}
