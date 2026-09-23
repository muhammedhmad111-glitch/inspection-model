import { cookies } from "next/headers";
import { LINE_COOKIE, parseLine, type ProductionLine } from "@/lib/production-line";

/**
 * Split out from `production-line.ts` because `next/headers` cannot be reached
 * from a client component, and the line switcher in the topbar is one.
 */
export async function getActiveLine(): Promise<ProductionLine> {
  const store = await cookies();
  return parseLine(store.get(LINE_COOKIE)?.value);
}
