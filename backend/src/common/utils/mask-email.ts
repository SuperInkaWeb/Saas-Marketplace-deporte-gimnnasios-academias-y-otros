/**
 * AUD-34: enmascara un correo para poder mencionarlo en los logs sin exponerlo.
 * "walter.perez@gmail.com" -> "wa***@gmail.com"; sin "@" o vacío -> "***".
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '***';
  const value = String(email).trim();
  const at = value.lastIndexOf('@');
  if (at <= 0) return '***';
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}***@${domain || '***'}`;
}
