import type { Payment } from "@/types";

/**
 * Deterministic invoice number from a payment row.
 * Format: `INV-YYYY-XXXXXXXX` (last 8 hex chars of the UUID, uppercased,
 * year-prefixed by paid_at if available else created_at).
 *
 * If the row already has a real `invoice_number` populated by an upstream
 * gateway, that takes precedence.
 */
export function computeInvoiceNumber(p: Payment): string {
  if (p.invoice_number) return p.invoice_number;
  const year = new Date(p.paid_at ?? p.created_at).getFullYear();
  const tail = p.id.replace(/-/g, "").slice(-8).toUpperCase();
  return `INV-${year}-${tail}`;
}
