export function buildSlots(
  schedule: { openMinute: number; closeMinute: number; capacity: number },
  durationMin: number,
  booked: { startMinute: number; endMinute: number }[],
) {
  const slots: { startMinute: number; endMinute: number; available: boolean }[] = [];
  if (!Number.isInteger(durationMin) || durationMin < 1) return slots; // evita bucle infinito

  for (let start = schedule.openMinute; start + durationMin <= schedule.closeMinute; start += durationMin) {
    const end = start + durationMin;
    const overlaps = booked.filter((b) => b.startMinute < end && b.endMinute > start).length;
    slots.push({ startMinute: start, endMinute: end, available: overlaps < schedule.capacity });
  }
  return slots;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" válido y real (rechaza 2026-02-31) */
export const isValidDate = (d: string) =>
  typeof d === 'string' &&
  DATE_RE.test(d) &&
  new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

/** Día de la semana (0 = domingo) sin sorpresas de zona horaria */
export const dayOfWeek = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();

/** "Hoy" en Lima (YYYY-MM-DD), no en la hora del servidor */
export const todayLima = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());

export const toHHmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;