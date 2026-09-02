import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import type { DailyReportVideoProps } from "@/remotion/daily-report";

// Renderer needs a Node.js runtime + headless Chromium — not the Edge runtime.
export const runtime = "nodejs";
export const maxDuration = 300;

// Bundle once per server process and reuse across requests.
let bundlePromise: Promise<string> | null = null;
function getServeUrl() {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.ts"),
    });
  }
  return bundlePromise;
}

export async function POST(req: NextRequest) {
  let inputProps: DailyReportVideoProps;
  try {
    inputProps = (await req.json()) as DailyReportVideoProps;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outPath = path.join(os.tmpdir(), `daily-report-${Date.now()}.mp4`);
  try {
    const serveUrl = await getServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: "DailyReport",
      inputProps,
    });
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
    });

    const file = await fs.readFile(outPath);
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
  } finally {
    await fs.unlink(outPath).catch(() => {});
  }
}
