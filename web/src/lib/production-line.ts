/**
 * A user works one production line at a time. Rather than bolt a line dropdown
 * onto every filter bar, the choice lives in a cookie and every server page
 * reads it — so switching once re-scopes the dashboard, the task list, the
 * findings and the reports together, and a line-1 inspector never sees a
 * line-3 number by accident.
 *
 * Everything here is client-safe on purpose; reading the cookie needs
 * `next/headers` and lives in `production-line-server.ts`, because the labels
 * and the type below are also used inside client components.
 */

export const PRODUCTION_LINES = [1, 3] as const;
export type ProductionLine = (typeof PRODUCTION_LINES)[number];

export const DEFAULT_LINE: ProductionLine = 1;
export const LINE_COOKIE = "production_line";

export const LINE_LABELS_AR: Record<ProductionLine, string> = {
  1: "خط 1",
  3: "خط 3",
};

export function parseLine(value: string | undefined | null): ProductionLine {
  const n = Number(value);
  return (PRODUCTION_LINES as readonly number[]).includes(n)
    ? (n as ProductionLine)
    : DEFAULT_LINE;
}
