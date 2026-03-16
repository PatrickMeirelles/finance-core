export function getClosingDate(day: number, referenceDate = new Date()): Date {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  const validDay = Math.min(day, lastDayOfMonth);
  return new Date(year, month, validDay);
}

export function safeAddMonths(date: Date, months: number) {
  const newDate = new Date(date);
  const targetMonth = newDate.getMonth() + months;

  const day = newDate.getDate();

  const result = new Date(newDate.getFullYear(), targetMonth, 1);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(day, lastDay));

  return result;
}
