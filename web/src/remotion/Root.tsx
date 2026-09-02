import { Composition } from "remotion";
import {
  DailyReportVideo,
  DAILY_REPORT_DEFAULTS,
  DAILY_REPORT_DURATION,
  VIDEO_FPS,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
} from "./daily-report";
import {
  SystemOverview,
  SYSTEM_OVERVIEW_DEFAULTS,
  SYSTEM_OVERVIEW_DURATION,
} from "./system-overview";
import { SchedulingVideo, SCHEDULING_DEFAULTS, SCHEDULING_DURATION } from "./scheduling";
import {
  SchedulingVideoAr,
  SCHEDULING_AR_DEFAULTS,
  SCHEDULING_AR_DURATION,
} from "./scheduling/index-ar";
import { FPS, H, W } from "./system-overview/theme";

// Registered compositions — the id is what the renderer selects.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="DailyReport"
        component={DailyReportVideo}
        durationInFrames={DAILY_REPORT_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={DAILY_REPORT_DEFAULTS}
      />
      <Composition
        id="SystemOverview"
        component={SystemOverview}
        durationInFrames={SYSTEM_OVERVIEW_DURATION}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={SYSTEM_OVERVIEW_DEFAULTS}
      />
      <Composition
        id="Scheduling"
        component={SchedulingVideo}
        durationInFrames={SCHEDULING_DURATION}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={SCHEDULING_DEFAULTS}
      />
      <Composition
        id="SchedulingAR"
        component={SchedulingVideoAr}
        durationInFrames={SCHEDULING_AR_DURATION}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={SCHEDULING_AR_DEFAULTS}
      />
    </>
  );
};
