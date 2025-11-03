import { describe, it, expect } from 'vitest';
import { generateSKU, generatePONumber, generateWarehouseCode } from '../number-generator';

describe('Number Generator Utils', () => {
  describe('generateSKU', () => {
    it('should generate SKU in correct format', () => {
      const sku = generateSKU();
      expect(sku).toMatch(/^SKU-[A-Z0-9]{6}$/);
    });

    it('should generate unique SKUs', () => {
      const sku1 = generateSKU();
      const sku2 = generateSKU();
      expect(sku1).not.toBe(sku2);
    });

    it('should generate SKU with correct prefix', () => {
      const sku = generateSKU();
      expect(sku.startsWith('SKU-')).toBe(true);
    });
  });

  describe('generatePONumber', () => {
    it('should generate PO number in correct format', () => {
      const poNumber = generatePONumber();
      expect(poNumber).toMatch(/^PO-[A-Z0-9]{8}$/);
    });

    it('should generate unique PO numbers', () => {
      const po1 = generatePONumber();
      const po2 = generatePONumber();
      expect(po1).not.toBe(po2);
    });

    it('should generate PO with correct prefix', () => {
      const poNumber = generatePONumber();
      expect(poNumber.startsWith('PO-')).toBe(true);
    });
  });

  describe('generateWarehouseCode', () => {
    it('should generate warehouse code in correct format', () => {
      const code = generateWarehouseCode();
      expect(code).toMatch(/^WH-[A-Z0-9]{4}$/);
    });

    it('should generate unique warehouse codes', () => {
      const code1 = generateWarehouseCode();
      const code2 = generateWarehouseCode();
      expect(code1).not.toBe(code2);
    });

    it('should generate code with correct prefix', () => {
      const code = generateWarehouseCode();
      expect(code.startsWith('WH-')).toBe(true);
    });
  });
});

