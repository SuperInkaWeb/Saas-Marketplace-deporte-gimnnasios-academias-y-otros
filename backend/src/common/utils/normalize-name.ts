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