"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export type ExtraRecipient = Tables<"report_extra_recipients">;

/** Addresses in the profiles table that cannot actually receive mail. */
export const PLACEHOLDER_DOMAIN = "@cimpor-amreyah.local";

// An Arabic keyboard produces ، and ؛, and pasting from Outlook brings newlines
// and angle brackets. The old split only knew "," and ";", so "a@x.com، b@y.com"
// quietly mailed "a@x.com،" — an address that cannot exist.
const SEPARATORS = /[\s,;،؛]+/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/**
 * Split a typed or pasted blob into addresses. Anything that is not an address
 * comes back in `invalid` rather than being dropped: silently sending to two
 * people when the user typed three is worse than saying which one was wrong.
 */
export function parseEmails(raw: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of raw.split(SEPARATORS)) {
    const t = token.trim().replace(/^[<(]+|[>),.]+$/g, "").toLowerCase();
    if (!t) continue;
    if (EMAIL.test(t)) valid.push(t);
    else invalid.push(t);
  }
  return { valid: [...new Set(valid)], invalid };
}

export type AddResult = "added" | "duplicate" | "unsaved";

/**
 * The shared list of report recipients without an account. Both the daily and the
 * weekly report dialog use it, so a mailbox added in one shows up in the other.
 */
export function useExtraRecipients() {
  const [extras, setExtras] = useState<ExtraRecipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("report_extra_recipients")
        .select("*")
        .order("email");
      if (active) {
        setExtras(data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /**
   * "unsaved" means the address is usable for this send but the user lacks the
   * reports permission to keep it — worth telling them, not worth blocking on.
   */
  const add = useCallback(
    async (email: string, label?: string): Promise<AddResult> => {
      if (extras.some((e) => e.email === email)) return "duplicate";
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: row } = await supabase
        .from("report_extra_recipients")
        .insert({ email, label: label?.trim() || null, added_by: user?.id ?? null })
        .select("*")
        .single();
      if (!row) {
        setExtras((cur) => [
          ...cur,
          {
            email,
            label: label?.trim() || null,
            added_by: null,
            created_at: new Date().toISOString(),
          },
        ]);
        return "unsaved";
      }
      setExtras((cur) => [...cur, row]);
      return "added";
    },
    [extras]
  );

  const forget = useCallback(async (email: string): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase
      .from("report_extra_recipients")
      .delete()
      .eq("email", email);
    if (error) return false;
    setExtras((cur) => cur.filter((e) => e.email !== email));
    return true;
  }, []);

  return { extras, loading, add, forget };
}
