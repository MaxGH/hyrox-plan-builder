import { addDays, startOfWeek } from "date-fns";

const DAY_MAP: Record<string, number> = {
  Montag: 0,
  Dienstag: 1,
  Mittwoch: 2,
  Donnerstag: 3,
  Freitag: 4,
  Samstag: 5,
  Sonntag: 6,
};

export function getSessionDate(
  session: { sessionId?: string; dayOfWeek?: string },
  weekNumber: number,
  startDate: string,
  overrides: Record<string, string> = {}
): string {
  if (session.sessionId && overrides[session.sessionId]) {
    return overrides[session.sessionId];
  }

  const start = new Date(startDate);
  const weekStart = addDays(start, (weekNumber - 1) * 7);
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const dayOffset = DAY_MAP[session.dayOfWeek || ""] ?? 0;
  const date = addDays(monday, dayOffset);
  return date.toISOString().substring(0, 10);
}
