export function buildSlots(
  schedule: { openMinute: number; closeMinute: number; capacity: number },
  durationMin: number,
  booked: { startMinute: number; endMinute: number }[],
) {
  const slots: { startMinute: number; endMinute: number; available: boolean }[] = [];
  for (let start = schedule.openMinute; start + durationMin <= schedule.closeMinute; start += durationMin) {
    const end = start + durationMin;
    const overlaps = booked.filter((b) => b.startMinute < end && b.endMinute > start).length;
    slots.push({ startMinute: start, endMinute: end, available: overlaps < schedule.capacity });
  }
  return slots;
}