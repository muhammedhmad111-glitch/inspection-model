import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Brand
const BRAND = "#631cbe";
const BRAND_SOFT = "#f3f0fa";

// ── Video config (kept here so the Player and any future renderer agree) ──
export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;

// Scene lengths in frames
const INTRO = 60;
const STATS = 100;
const OUTRO = 50;
export const DAILY_REPORT_DURATION = INTRO + STATS + OUTRO;

// ── Props: a decoupled subset of ReportData (only what the video shows) ──
export type DailyReportVideoProps = {
  date: string;
  preparedBy: string;
  completedCount: number;
  findingsCount: number;
  actionsCount: number;
};

export const DAILY_REPORT_DEFAULTS: DailyReportVideoProps = {
  date: "2026-07-13",
  preparedBy: "Inspection Team",
  completedCount: 18,
  findingsCount: 5,
  actionsCount: 9,
};

function IntroScene({ date, preparedBy }: { date: string; preparedBy: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const y = interpolate(enter, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: BRAND,
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ opacity: enter, transform: `translateY(${y}px)`, textAlign: "center" }}>
        <div style={{ fontSize: 22, letterSpacing: 4, opacity: 0.85 }}>CIMPOR AMREYAH</div>
        <div style={{ fontSize: 68, fontWeight: 800, marginTop: 14 }}>
          Daily Inspection Report
        </div>
        <div style={{ fontSize: 30, marginTop: 20, opacity: 0.9 }}>{date}</div>
        <div style={{ fontSize: 22, marginTop: 8, opacity: 0.7 }}>
          Prepared by {preparedBy}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Stat({ label, value, index }: { label: string; value: number; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = index * 10;
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const shown = Math.round(interpolate(enter, [0, 1], [0, value]));

  return (
    <div
      style={{
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
        background: BRAND_SOFT,
        borderRadius: 24,
        padding: "36px 44px",
        textAlign: "center",
        minWidth: 240,
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 800, color: BRAND, lineHeight: 1 }}>{shown}</div>
      <div style={{ fontSize: 24, color: "#555", marginTop: 12 }}>{label}</div>
    </div>
  );
}

function StatsScene(props: DailyReportVideoProps) {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        gap: 32,
        flexDirection: "row",
      }}
    >
      <Stat label="Completed" value={props.completedCount} index={0} />
      <Stat label="Open Findings" value={props.findingsCount} index={1} />
      <Stat label="Open Maintenance" value={props.actionsCount} index={2} />
    </AbsoluteFill>
  );
}

function OutroScene() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: BRAND,
        color: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ opacity, textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 700 }}>CPIIS</div>
        <div style={{ fontSize: 22, marginTop: 10, opacity: 0.8 }}>
          Inspection Management System
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function DailyReportVideo(props: DailyReportVideoProps) {
  return (
    <AbsoluteFill style={{ background: "#fff" }}>
      <Sequence durationInFrames={INTRO}>
        <IntroScene date={props.date} preparedBy={props.preparedBy} />
      </Sequence>
      <Sequence from={INTRO} durationInFrames={STATS}>
        <StatsScene {...props} />
      </Sequence>
      <Sequence from={INTRO + STATS} durationInFrames={OUTRO}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
}
