import { describe, it, expect } from 'vitest';
import { generateLeadNumber, generateDealNumber } from '../number-generator';

describe('NumberGenerator', () => {
  describe('generateLeadNumber', () => {
    it('should generate a lead number with LEAD prefix', () => {
      const number = generateLeadNumber();
      expect(number).toMatch(/^LEAD-/);
    });

    it('should generate unique lead numbers', () => {
      const numbers = Array.from({ length: 10 }, () => generateLeadNumber());
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(10);
    });

    it('should have consistent format', () => {
      const number = generateLeadNumber();
      expect(number).toMatch(/^LEAD-[A-Z0-9]+$/);
    });
  });

  describe('generateDealNumber', () => {
    it('should generate a deal number with DEAL prefix', () => {
      const number = generateDealNumber();
      expect(number).toMatch(/^DEAL-/);
    });

    it('should generate unique deal numbers', () => {
      const numbers = Array.from({ length: 10 }, () => generateDealNumber());
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(10);
    });

    it('should have consistent format', () => {
      const number = generateDealNumber();
      expect(number).toMatch(/^DEAL-[A-Z0-9]+$/);
    });
  });
});

