export function normalizeName(raw?: string | null): string {
  return (raw ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Fallback explícito: '' = perfil sin nombre todavía. Nunca el email.
export function sanitizeName(raw?: string | null, email?: string): string {
  const clean = normalizeName(raw);
  if (!clean || looksLikeEmail(clean)) return '';
  if (email && clean.toLowerCase() === email.trim().toLowerCase()) return '';
  return clean;
}

// AUD-27: en cuentas antiguas el nombre quedó guardado como el email. En las
// respuestas públicas ese nombre se reemplaza por una etiqueta genérica.
const EMAIL_INSIDE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export function publicName(
  raw: string | null | undefined,
  fallback: string,
): string {
  const clean = normalizeName(raw);
  if (!clean) return clean;
  return EMAIL_INSIDE.test(clean) ? fallback : clean;
}

export function withPublicName<T extends { name?: string | null }>(
  user: T | null | undefined,
  fallback: string,
): T | null | undefined {
  if (!user) return user;
  return { ...user, name: publicName(user.name, fallback) };
}
