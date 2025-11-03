import { describe, it, expect } from 'vitest';
import { validateTaxId, validateIBAN, validateSWIFT } from '../validation';

describe('Validation Utilities', () => {
  describe('validateTaxId', () => {
    it('should validate US Tax ID format', () => {
      const result = validateTaxId('12-3456789', 'US');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid US Tax ID format', () => {
      const result = validateTaxId('123-456-789', 'US');
      expect(result.valid).toBe(false);
    });

    it('should validate UK VAT format', () => {
      const result = validateTaxId('GB999999999', 'GB');
      expect(result.valid).toBe(true);
    });

    it('should validate UK VAT format with spaces', () => {
      const result = validateTaxId('GB999999999 000', 'GB');
      expect(result.valid).toBe(true);
    });

    it('should validate German Tax ID', () => {
      const result = validateTaxId('12345678901', 'DE');
      expect(result.valid).toBe(true);
    });

    it('should validate French Tax ID', () => {
      const result = validateTaxId('123456789', 'FR');
      expect(result.valid).toBe(true);
    });

    it('should validate generic tax ID with 5+ characters', () => {
      const result = validateTaxId('12345', 'FR');
      expect(result.valid).toBe(true);
    });

    it('should reject tax ID with less than 5 characters', () => {
      const result = validateTaxId('1234', 'UNKNOWN');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate tax ID with 6 characters for unknown country', () => {
      const result = validateTaxId('123456', 'UNKNOWN');
      expect(result.valid).toBe(true);
    });

    it('should return error message when invalid', () => {
      const result = validateTaxId('1234', 'UNKNOWN');
      expect(result.error).toBe('Invalid Tax ID format');
    });

    it('should normalize spaces in UK VAT', () => {
      const result = validateTaxId('GB 999 999 999', 'GB');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateIBAN', () => {
    it('should validate correct IBAN format', () => {
      const result = validateIBAN('GB82WEST12345698765432');
      expect(result.valid).toBe(true);
    });

    it('should validate IBAN with lowercase', () => {
      const result = validateIBAN('gb82west12345698765432');
      expect(result.valid).toBe(true);
    });

    it('should validate various IBAN formats', () => {
      const testCases = [
        'DE89370400440532013000',
        'FR1420041010050500013M02606',
        'CH9300762011623852957',
        'US64SVBKUS6S3300958879',
      ];

      testCases.forEach(iban => {
        const result = validateIBAN(iban);
        expect(result.valid).toBe(true);
      });
    });

    it('should validate IBAN with spaces', () => {
      const result = validateIBAN('GB82 WEST 1234 5698 7654 32');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid IBAN format - too short', () => {
      const result = validateIBAN('GB82');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid IBAN format - wrong structure', () => {
      const result = validateIBAN('INVALID-IBAN-123');
      expect(result.valid).toBe(false);
    });

    it('should reject IBAN with invalid characters', () => {
      const result = validateIBAN('GB82-TEST-1234-IBAN');
      expect(result.valid).toBe(false);
    });

    it('should accept empty IBAN (optional)', () => {
      const result = validateIBAN('');
      expect(result.valid).toBe(true);
    });

    it('should return error message when invalid', () => {
      const result = validateIBAN('INVALID');
      expect(result.error).toBe('Invalid IBAN format');
    });

    it('should handle whitespace-only IBAN as empty', () => {
      const result = validateIBAN('   ');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateSWIFT', () => {
    it('should validate correct SWIFT code - 8 characters', () => {
      const result = validateSWIFT('BARCGB22');
      expect(result.valid).toBe(true);
    });

    it('should validate correct SWIFT code - 11 characters', () => {
      const result = validateSWIFT('BARCGB22XXX');
      expect(result.valid).toBe(true);
    });

    it('should validate various SWIFT codes', () => {
      const testCases = [
        'DEUTDEFF',
        'CHASUS33',
        'HSBCGB2L',
        'CITIDEBX',
        'BNPAFRPP',
      ];

      testCases.forEach(swift => {
        const result = validateSWIFT(swift);
        expect(result.valid).toBe(true);
      });
    });

    it('should validate SWIFT with mixed case', () => {
      const result = validateSWIFT('barcGb22');
      expect(result.valid).toBe(true);
    });

    it('should validate SWIFT code with 8 characters', () => {
      const testCases = [
        'ABCDDEFF',
        'XYZ12345',
        'QWERTYUI',
      ];

      testCases.forEach(swift => {
        const result = validateSWIFT(swift);
        expect(result.valid).toBe(true);
      });
    });

    it('should validate SWIFT code with 11 characters', () => {
      const testCases = [
        'ABCDDEFF001',
        'XYZ12345000',
      ];

      testCases.forEach(swift => {
        const result = validateSWIFT(swift);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject SWIFT code that is too short', () => {
      const result = validateSWIFT('BARCGB');
      expect(result.valid).toBe(false);
    });

    it('should reject SWIFT code that is too long', () => {
      const result = validateSWIFT('BARCGB22XXXX');
      expect(result.valid).toBe(false);
    });

    it('should reject SWIFT code with invalid characters', () => {
      const result = validateSWIFT('BARC-GB22');
      expect(result.valid).toBe(false);
    });

    it('should reject SWIFT code with spaces', () => {
      const result = validateSWIFT('BARC GB22');
      expect(result.valid).toBe(false);
    });

    it('should reject lowercase SWIFT code', () => {
      const result = validateSWIFT('barcgb22');
      expect(result.valid).toBe(false);
    });

    it('should accept empty SWIFT (optional)', () => {
      const result = validateSWIFT('');
      expect(result.valid).toBe(true);
    });

    it('should return error message when invalid', () => {
      const result = validateSWIFT('INVALID');
      expect(result.error).toBe('Invalid SWIFT code format');
    });

    it('should handle undefined SWIFT', () => {
      const result = validateSWIFT(undefined as any);
      expect(result.valid).toBe(true);
    });
  });
});

