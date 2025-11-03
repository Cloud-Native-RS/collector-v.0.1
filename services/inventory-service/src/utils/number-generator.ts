export const generatePONumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PO-${timestamp}-${random}`;
};

export const generateSKU = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

