"use client";

import { Player } from "@remotion/player";
import {
  DailyReportVideo,
  DAILY_REPORT_DEFAULTS,
  DAILY_REPORT_DURATION,
  VIDEO_FPS,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  type DailyReportVideoProps,
} from "@/remotion/daily-report";

export function ReportVideoPlayer({
  data = DAILY_REPORT_DEFAULTS,
}: {
  data?: DailyReportVideoProps;
}) {
  return (
    <Player
      component={DailyReportVideo}
      inputProps={data}
      durationInFrames={DAILY_REPORT_DURATION}
      fps={VIDEO_FPS}
      compositionWidth={VIDEO_WIDTH}
      compositionHeight={VIDEO_HEIGHT}
      controls
      loop
      style={{
        width: "100%",
        aspectRatio: `${VIDEO_WIDTH} / ${VIDEO_HEIGHT}`,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    />
  );
}
