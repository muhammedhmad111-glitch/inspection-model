"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LINE_COOKIE, parseLine } from "@/lib/production-line";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setActiveLine(value: number) {
  const line = parseLine(String(value));
  const store = await cookies();

  store.set(LINE_COOKIE, String(line), {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  // Every page reads the line, so the whole tree is stale after a switch.
  revalidatePath("/", "layout");
}
