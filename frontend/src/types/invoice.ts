// Factura (modelo Invoice de backend/prisma/schema.prisma).
// Los montos son Decimal en la BD y llegan de la API como texto, por ejemplo "49.90".
// user y gym solo vienen en algunos endpoints (ver invoices.service.ts).

export interface Invoice {
  id: string;
  invoiceNum: string;
  amount: number | string;
  tax: number | string;
  total: number | string;
  status: string; // ISSUED | PAID | CANCELLED ...
  issuedAt: string;
  user?: { name?: string | null; email?: string | null } | null;
  gym?: { name: string; phone?: string | null; address?: string | null } | null;
}
