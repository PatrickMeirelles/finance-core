export function getClosingDate(day: number, referenceDate = new Date()): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  const validDay = Math.min(day, lastDayOfMonth);
  return new Date(year, month, validDay);
}
