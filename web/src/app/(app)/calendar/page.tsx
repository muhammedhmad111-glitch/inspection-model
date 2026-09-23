import { createClient } from "@/lib/supabase/server";
import { getActiveLine } from "@/lib/production-line-server";
import { CalendarClient } from "./calendar-client";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const supabase = await createClient();
  const line = await getActiveLine();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("active", true);

  return (
    <CalendarClient
      profiles={profiles ?? []}
      initialDay={day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null}
      line={line}
    />
  );
}
