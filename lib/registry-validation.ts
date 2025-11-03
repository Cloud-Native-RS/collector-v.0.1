/**
 * Validation utilities for Customer & Company Registry microservice
 */

export function validateTaxId(taxId: string, country?: string): { valid: boolean; error?: string } {
  if (!taxId || taxId.trim().length === 0) {
    return { valid: false, error: "Tax ID is required" };
  }

  // US Tax ID format (EIN): XX-XXXXXXX
  if (!country || country === "United States") {
    const usTaxIdPattern = /^\d{2}-\d{7}$/;
    if (usTaxIdPattern.test(taxId)) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid US Tax ID format (should be XX-XXXXXXX)" };
  }

  // UK VAT format: GB999 9999 99 or GB999999999
  if (country === "United Kingdom") {
    const ukVatPattern = /^GB\d{9}(\s\d{3})?$/;
    if (ukVatPattern.test(taxId.replace(/\s/g, ""))) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid UK VAT format" };
  }

  // German Tax ID: 11 digits
  if (country === "Germany") {
    const deTaxIdPattern = /^\d{11}$/;
    if (deTaxIdPattern.test(taxId)) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid German Tax ID format (should be 11 digits)" };
  }

  // French Tax ID: 9 digits
  if (country === "France") {
    const frTaxIdPattern = /^\d{9}$/;
    if (frTaxIdPattern.test(taxId)) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid French Tax ID format (should be 9 digits)" };
  }

  // Generic validation: at least 5 characters
  if (taxId.length >= 5) {
    return { valid: true };
  }

  return { valid: false, error: "Tax ID must be at least 5 characters long" };
}

export function validateRegistrationNumber(regNumber: string, country?: string): { valid: boolean; error?: string } {
  if (!regNumber || regNumber.trim().length === 0) {
    return { valid: true }; // Registration number is optional
  }

  // US State registration formats vary, accept flexible formats
  if (!country || country === "United States") {
    if (regNumber.length >= 3) {
      return { valid: true };
    }
    return { valid: false, error: "Registration number too short" };
  }

  // UK company registration: GB-XXXX-XXXX or similar
  if (country === "United Kingdom") {
    if (regNumber.length >= 8) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid UK company registration format" };
  }

  // German HRB number: HRB-XXXXXX
  if (country === "Germany") {
    const deHrbPattern = /^HRB-?\d{5,6}$/;
    if (deHrbPattern.test(regNumber)) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid German HRB format (should be HRB-XXXXXX)" };
  }

  // French RCS: RCS-Paris-XXXXXX
  if (country === "France") {
    if (regNumber.startsWith("RCS-") && regNumber.length >= 10) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid French RCS format" };
  }

  // Generic validation: at least 5 characters
  if (regNumber.length >= 5) {
    return { valid: true };
  }

  return { valid: false, error: "Registration number must be at least 5 characters long" };
}

export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  if (!iban) {
    return { valid: true }; // IBAN is optional for non-EU countries
  }

  // Basic IBAN format: 2 letters (country) + 2 digits (check digits) + up to 30 alphanumeric characters
  const ibanPattern = /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/;
  
  if (ibanPattern.test(iban.replace(/\s/g, ""))) {
    return { valid: true };
  }

  return { valid: false, error: "Invalid IBAN format" };
}

export function validateSWIFT(swift: string): { valid: boolean; error?: string } {
  if (!swift) {
    return { valid: true }; // SWIFT is optional
  }

  // SWIFT format: 4 letters (bank) + 2 letters (country) + 2 characters (location) + 3 characters (branch, optional)
  const swiftPattern = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  
  if (swiftPattern.test(swift)) {
    return { valid: true };
  }

  return { valid: false, error: "Invalid SWIFT code format" };
}

export function checkDuplicateCustomer(customers: any[], email: string, taxId: string): { isDuplicate: boolean; field?: string } {
  const duplicateByEmail = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (duplicateByEmail) {
    return { isDuplicate: true, field: "email" };
  }

  const duplicateByTaxId = customers.find((c) => c.taxId === taxId);
  if (duplicateByTaxId) {
    return { isDuplicate: true, field: "taxId" };
  }

  return { isDuplicate: false };
}

export function checkDuplicateCompany(companies: any[], legalName: string, taxId: string, registrationNumber: string): { isDuplicate: boolean; field?: string } {
  const duplicateByName = companies.find((c) => c.legalName.toLowerCase() === legalName.toLowerCase());
  if (duplicateByName) {
    return { isDuplicate: true, field: "legalName" };
  }

  const duplicateByTaxId = companies.find((c) => c.taxId === taxId);
  if (duplicateByTaxId) {
    return { isDuplicate: true, field: "taxId" };
  }

  if (registrationNumber) {
    const duplicateByRegNumber = companies.find((c) => c.registrationNumber === registrationNumber);
    if (duplicateByRegNumber) {
      return { isDuplicate: true, field: "registrationNumber" };
    }
  }

  return { isDuplicate: false };
}

