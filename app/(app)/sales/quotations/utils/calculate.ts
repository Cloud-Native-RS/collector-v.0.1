import type { LineItem } from "../types";

type CalculateTotalParams = {
  price: number;
  quantity: number;
  vat?: number;
  includeVAT?: boolean;
};

export function calculateTotal({
  price,
  quantity,
  vat = 0,
  includeVAT = false,
}: CalculateTotalParams): number {
  const subtotal = price * quantity;
  if (includeVAT && vat) {
    return subtotal + (subtotal * vat) / 100;
  }
  return subtotal;
}

export function calculateTotals(lineItems: LineItem[]) {
  let totalAmount = 0;
  let totalVAT = 0;

  for (const item of lineItems) {
    const subtotal = item.price * item.quantity;
    totalAmount += subtotal;
    if (item.vat) {
      totalVAT += (subtotal * item.vat) / 100;
    }
  }

  return { totalAmount, totalVAT };
}







