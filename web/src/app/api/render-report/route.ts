import { NextResponse, type NextRequest } from "next/server";
import { renderCompositionToBuffer } from "@/lib/remotion-render";
import type { DailyReportVideoProps } from "@/remotion/daily-report";

// Renderer needs a Node.js runtime + headless Chromium — not the Edge runtime.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  let inputProps: DailyReportVideoProps;
  try {
    inputProps = (await req.json()) as DailyReportVideoProps;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const file = await renderCompositionToBuffer(
      "DailyReport",
      inputProps as unknown as Record<string, unknown>
    );
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="Daily-Inspection-Report-${
          inputProps?.date ?? "video"
        }.mp4"`,
      },
    });
  } catch (err) {
    console.error("[render-report] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 }
    );
  }
}
