import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderCompositionToBuffer } from "@/lib/remotion-render";
import type { WeeklyReportVideoProps } from "@/remotion/weekly-report";

export const runtime = "nodejs";
export const maxDuration = 300;

// Ninety days is long enough for a manager to come back to last quarter's report
// and short enough that a link forwarded outside the company eventually dies.
const SIGNED_URL_TTL = 60 * 60 * 24 * 90;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  let inputProps: WeeklyReportVideoProps;
  try {
    inputProps = (await req.json()) as WeeklyReportVideoProps;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // weekStart lands in the storage path, so it never gets to be free-form text.
  if (!ISO_DATE.test(inputProps?.weekStart ?? "")) {
    return NextResponse.json({ error: "weekStart must be YYYY-MM-DD" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const file = await renderCompositionToBuffer(
      "WeeklyReport",
      inputProps as unknown as Record<string, unknown>
    );

    // One object per week: re-sending replaces the render instead of accumulating.
    const objectPath = `weekly/${inputProps.weekStart}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(objectPath, file, { contentType: "video/mp4", upsert: true });
    if (uploadError) {
      console.error("[render-weekly] upload failed:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("reports")
      .createSignedUrl(objectPath, SIGNED_URL_TTL);
    if (signError || !signed) {
      console.error("[render-weekly] signing failed:", signError);
      return NextResponse.json(
        { error: signError?.message ?? "Could not create a link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl, bytes: file.length });
  } catch (err) {
    console.error("[render-weekly] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 }
    );
  }
}
