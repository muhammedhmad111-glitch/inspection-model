import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";

// Bundling is the slow part and it does not depend on the props, so it is done
// once per server process and shared by every composition and every request.
let bundlePromise: Promise<string> | null = null;
function getServeUrl() {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.ts"),
    });
  }
  return bundlePromise;
}

/** Renders a registered composition to an MP4 and hands back the bytes. */
export async function renderCompositionToBuffer(
  id: string,
  inputProps: Record<string, unknown>
): Promise<Buffer> {
  const outPath = path.join(os.tmpdir(), `${id}-${Date.now()}.mp4`);
  try {
    const serveUrl = await getServeUrl();
    const composition = await selectComposition({ serveUrl, id, inputProps });
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
    });
    return await fs.readFile(outPath);
  } finally {
    await fs.unlink(outPath).catch(() => {});
  }
}
