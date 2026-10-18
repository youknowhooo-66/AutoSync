/**
 * Civil date (YYYY-MM-DD, UTC) `days` from now.
 *
 * Use instead of hard-coded dates for anything compared against "now"
 * (e.g. receivable due dates must not precede the OS completion date),
 * otherwise the suite starts failing once the calendar passes the literal.
 */
export function futureCivilDate(days = 30): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
