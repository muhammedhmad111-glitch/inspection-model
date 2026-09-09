import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Cairo";

// Section names are a mix of English and Arabic ("Raw mills", "معدات عامة"), so the
// video needs one family that carries both. Cairo is what the app itself is set in.
const FONT = loadFont("normal", {
  subsets: ["arabic", "latin"],
  weights: ["400", "600", "700"],
}).fontFamily;

const C = {
  navy: "#252a5e",
  navyDeep: "#191d45",
  ink: "#0b0d24",
  indigo: "#818cf8",
  white: "#ffffff",
  mist: "#c7cbe8",
  muted: "#8b90bd",
  line: "rgba(255,255,255,0.10)",
  panel: "rgba(255,255,255,0.05)",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
} as const;

export const WEEKLY_FPS = 30;
export const WEEKLY_WIDTH = 1920;
export const WEEKLY_HEIGHT = 1080;

const INTRO = 75;
const HEADLINE = 120;
const BACKLOG = 90;
const BREAKDOWN = 120;
const FINDINGS = 135;
const OUTRO = 60;
// Cumulative starts, so inserting a scene only shifts the ones after it.
const AT_HEADLINE = INTRO;
const AT_BACKLOG = AT_HEADLINE + HEADLINE;
const AT_BREAKDOWN = AT_BACKLOG + BACKLOG;
const AT_FINDINGS = AT_BREAKDOWN + BREAKDOWN;
const AT_OUTRO = AT_FINDINGS + FINDINGS;
export const WEEKLY_REPORT_DURATION = AT_OUTRO + OUTRO;

export type WeeklyBucket = { name: string; completed: number; findings: number };
export type WeeklyFinding = {
  code: string;
  title: string;
  severity: string;
  equipment: string | null;
  /** Register code, e.g. RM-007 — what a planner searches SAP with. */
  equipmentCode: string | null;
  /** The number stencilled on the machine, e.g. B06.04. */
  location: string | null;
  section: string | null;
};

/**
 * Where a finding is, on one line. The numbers are what makes the row actionable:
 * five of this plant's worst open findings sit on equipment all called "Belt
 * conveyor". The video, the email and the plain-text body all say it the same way.
 */
export function weeklyFindingWhere(f: WeeklyFinding): string {
  return [f.equipment, f.location, f.equipmentCode, f.section].filter(Boolean).join(" · ");
}

export type WeeklyReportVideoProps = {
  weekStart: string;
  weekEnd: string;
  preparedBy: string;
  totals: {
    completed: number;
    newFindings: number;
    newActions: number;
    closedActions: number;
    openFindings: number;
    openActions: number;
    overdueTasks: number;
  };
  previous: { completed: number; newFindings: number; newActions: number };
  bySection: WeeklyBucket[];
  byArea: WeeklyBucket[];
  topFindings: WeeklyFinding[];
  openBySeverity: Record<string, number>;
};

export const WEEKLY_REPORT_DEFAULTS: WeeklyReportVideoProps = {
  weekStart: "2026-08-30",
  weekEnd: "2026-09-05",
  preparedBy: "Inspection Team",
  totals: {
    completed: 42,
    newFindings: 9,
    newActions: 6,
    closedActions: 4,
    openFindings: 17,
    openActions: 11,
    overdueTasks: 3,
  },
  previous: { completed: 35, newFindings: 12, newActions: 8 },
  bySection: [
    { name: "Raw mills", completed: 12, findings: 3 },
    { name: "Kiln", completed: 9, findings: 2 },
    { name: "Cooler & gravill", completed: 7, findings: 1 },
    { name: "Bypass", completed: 6, findings: 2 },
    { name: "معدات عامة", completed: 5, findings: 1 },
  ],
  byArea: [
    { name: "Raw mills", completed: 18, findings: 4 },
    { name: "Kiln", completed: 14, findings: 3 },
    { name: "By-Pass, EP and RMs Bag Filter", completed: 10, findings: 2 },
  ],
  topFindings: [
    {
      code: "F-00042",
      title: "Excessive bearing vibration on the main drive",
      severity: "Critical",
      equipment: "Raw Mill 1",
      equipmentCode: "RM-016",
      location: "RM1",
      section: "Raw mills",
    },
    {
      code: "F-00039",
      title: "Oil leak from the gearbox seal",
      severity: "High",
      equipment: "Kiln Drive",
      equipmentCode: "KLN-012",
      location: null,
      section: "Kiln",
    },
    {
      code: "F-00036",
      title: "Torn bag filter compartment 4",
      severity: "High",
      equipment: "Bag Filter",
      equipmentCode: "BP-022",
      location: "K15",
      section: "Bypass",
    },
    {
      code: "F-00031",
      title: "Worn conveyor belt edge",
      severity: "Medium",
      equipment: "Belt conveyor",
      equipmentCode: "RM-007",
      location: "B06.04",
      section: "Raw materials",
    },
    {
      code: "F-00028",
      title: "Loose guard on the cooler fan",
      severity: "Medium",
      equipment: "Cooler fan V3",
      equipmentCode: "KLN-035",
      location: null,
      section: "Cooler & gravill",
    },
  ],
  openBySeverity: { Critical: 2, High: 5, Medium: 7, Low: 3 },
};

const SEVERITY_COLOR: Record<string, string> = {
  Critical: C.red,
  High: "#fb923c",
  Medium: C.amber,
  Low: C.green,
};

/** Frames → a 0..1 entrance ramp, delayed so items can cascade. */
function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200 } });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${C.navy} 0%, ${C.ink} 100%)`,
        fontFamily: FONT,
        color: C.white,
        padding: 90,
        // Scenes hold a title plus a variable number of rows; centring keeps the
        // block optically balanced instead of hanging off the top edge.
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function SceneTitle({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const enter = useEnter(delay);
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
        fontSize: 46,
        fontWeight: 700,
        marginBottom: 40,
      }}
    >
      {children}
    </div>
  );
}

function IntroScene({ weekStart, weekEnd, preparedBy }: WeeklyReportVideoProps) {
  const enter = useEnter();
  return (
    <Shell>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            textAlign: "center",
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 8, color: C.mist }}>CIMPOR AMREYAH</div>
          <div style={{ fontSize: 96, fontWeight: 700, marginTop: 22 }}>
            Weekly Inspection Report
          </div>
          <div style={{ fontSize: 40, marginTop: 26, color: C.indigo }}>
            {weekStart} → {weekEnd}
          </div>
          <div style={{ fontSize: 26, marginTop: 14, color: C.muted }}>
            Prepared by {preparedBy}
          </div>
        </div>
      </AbsoluteFill>
    </Shell>
  );
}

function Delta({ now, before, goodWhenUp }: { now: number; before: number; goodWhenUp: boolean }) {
  const diff = now - before;
  if (diff === 0) {
    return <div style={{ fontSize: 24, color: C.muted, marginTop: 12 }}>same as last week</div>;
  }
  const up = diff > 0;
  const good = up === goodWhenUp;
  return (
    <div style={{ fontSize: 26, color: good ? C.green : C.amber, marginTop: 12 }}>
      {up ? "▲" : "▼"} {Math.abs(diff)} vs last week
    </div>
  );
}

function BigStat({
  label,
  value,
  before,
  goodWhenUp,
  index,
}: {
  label: string;
  value: number;
  before: number;
  goodWhenUp: boolean;
  index: number;
}) {
  const enter = useEnter(index * 10);
  const shown = Math.round(interpolate(enter, [0, 1], [0, value]));
  return (
    <div
      style={{
        flex: 1,
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 32,
        padding: "56px 40px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 140, fontWeight: 700, lineHeight: 1, color: C.white }}>{shown}</div>
      <div style={{ fontSize: 30, color: C.mist, marginTop: 18 }}>{label}</div>
      <Delta now={value} before={before} goodWhenUp={goodWhenUp} />
    </div>
  );
}

function HeadlineScene({ totals, previous }: WeeklyReportVideoProps) {
  return (
    <Shell>
      <SceneTitle>This week at a glance</SceneTitle>
      <div style={{ display: "flex", gap: 40 }}>
        <BigStat
          label="Inspections completed"
          value={totals.completed}
          before={previous.completed}
          goodWhenUp
          index={0}
        />
        <BigStat
          label="New findings raised"
          value={totals.newFindings}
          before={previous.newFindings}
          goodWhenUp={false}
          index={1}
        />
        <BigStat
          label="Maintenance actions opened"
          value={totals.newActions}
          before={previous.newActions}
          goodWhenUp={false}
          index={2}
        />
      </div>
    </Shell>
  );
}

function Pill({
  label,
  value,
  color,
  index,
}: {
  label: string;
  value: number;
  color: string;
  index: number;
}) {
  const enter = useEnter(index * 8);
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 26,
        padding: "34px 44px",
        minWidth: 260,
      }}
    >
      <div style={{ fontSize: 76, fontWeight: 700, color }}>
        {Math.round(interpolate(enter, [0, 1], [0, value]))}
      </div>
      <div style={{ fontSize: 25, color: C.mist, marginTop: 8 }}>{label}</div>
    </div>
  );
}

function BacklogScene({ totals, openBySeverity }: WeeklyReportVideoProps) {
  const severities = ["Critical", "High", "Medium", "Low"].filter(
    (s) => (openBySeverity[s] ?? 0) > 0
  );
  return (
    <Shell>
      <SceneTitle>Still open</SceneTitle>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        <Pill label="Open findings" value={totals.openFindings} color={C.white} index={0} />
        <Pill label="Open actions" value={totals.openActions} color={C.white} index={1} />
        <Pill label="Overdue inspections" value={totals.overdueTasks} color={C.red} index={2} />
        <Pill label="Actions closed this week" value={totals.closedActions} color={C.green} index={3} />
      </div>
      {severities.length ? (
        <div style={{ display: "flex", gap: 24, marginTop: 46 }}>
          {severities.map((s, i) => (
            <Pill
              key={s}
              label={`${s} findings`}
              value={openBySeverity[s] ?? 0}
              color={SEVERITY_COLOR[s] ?? C.mist}
              index={4 + i}
            />
          ))}
        </div>
      ) : null}
    </Shell>
  );
}

function BarRow({
  item,
  max,
  index,
}: {
  item: WeeklyBucket;
  max: number;
  index: number;
}) {
  const enter = useEnter(index * 7);
  const width = interpolate(enter, [0, 1], [0, (item.completed / max) * 100]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: enter }}>
      <div
        style={{
          width: 400,
          fontSize: 26,
          color: C.mist,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.name}
      </div>
      <div style={{ flex: 1, height: 40, background: C.panel, borderRadius: 12 }}>
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            borderRadius: 12,
            background: `linear-gradient(90deg, ${C.indigo}, #a5b4fc)`,
          }}
        />
      </div>
      <div style={{ width: 130, fontSize: 28, fontWeight: 700 }}>{item.completed}</div>
      <div style={{ width: 210, fontSize: 24, color: item.findings ? C.amber : C.muted }}>
        {item.findings} finding{item.findings === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function BreakdownScene({ bySection, byArea }: WeeklyReportVideoProps) {
  // Sections are the finer cut; fall back to areas when the week only touched a
  // couple of them, so the scene is never a single lonely bar.
  const rows = (bySection.length >= 3 ? bySection : byArea).slice(0, 7);
  const max = Math.max(1, ...rows.map((r) => r.completed));
  return (
    <Shell>
      <SceneTitle>Where the work happened</SceneTitle>
      {rows.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {rows.map((r, i) => (
            <BarRow key={r.name} item={r} max={max} index={i} />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 34, color: C.muted }}>No inspections recorded this week.</div>
      )}
    </Shell>
  );
}

function FindingRow({ f, index }: { f: WeeklyFinding; index: number }) {
  const enter = useEnter(index * 9);
  const color = SEVERITY_COLOR[f.severity] ?? C.mist;
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-30, 0])}px)`,
        display: "flex",
        alignItems: "center",
        gap: 28,
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderLeft: `6px solid ${color}`,
        borderRadius: 20,
        padding: "20px 32px",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          minWidth: 130,
          textTransform: "uppercase",
        }}
      >
        {f.severity}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 28,
            lineHeight: 1.25,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {f.title}
        </div>
        <div style={{ fontSize: 21, lineHeight: 1.3, color: C.muted, marginTop: 4 }}>
          {weeklyFindingWhere(f)}
        </div>
      </div>
      <div style={{ fontSize: 24, color: C.mist }}>{f.code}</div>
    </div>
  );
}

function FindingsScene({ topFindings }: WeeklyReportVideoProps) {
  return (
    <Shell>
      <SceneTitle>Needs a decision</SceneTitle>
      {topFindings.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {topFindings.slice(0, 5).map((f, i) => (
            <FindingRow key={f.code} f={f} index={i} />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 34, color: C.green }}>No open findings. Nothing outstanding.</div>
      )}
    </Shell>
  );
}

function OutroScene({ weekStart, weekEnd }: WeeklyReportVideoProps) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Shell>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ opacity, textAlign: "center" }}>
          <div style={{ fontSize: 66, fontWeight: 700 }}>CPIIS</div>
          <div style={{ fontSize: 28, marginTop: 14, color: C.mist }}>
            Inspection Management System
          </div>
          <div style={{ fontSize: 24, marginTop: 34, color: C.muted }}>
            Full detail in the attached PDF · {weekStart} → {weekEnd}
          </div>
        </div>
      </AbsoluteFill>
    </Shell>
  );
}

export function WeeklyReportVideo(props: WeeklyReportVideoProps) {
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Sequence from={0} durationInFrames={INTRO}>
        <IntroScene {...props} />
      </Sequence>
      <Sequence from={AT_HEADLINE} durationInFrames={HEADLINE}>
        <HeadlineScene {...props} />
      </Sequence>
      <Sequence from={AT_BACKLOG} durationInFrames={BACKLOG}>
        <BacklogScene {...props} />
      </Sequence>
      <Sequence from={AT_BREAKDOWN} durationInFrames={BREAKDOWN}>
        <BreakdownScene {...props} />
      </Sequence>
      <Sequence from={AT_FINDINGS} durationInFrames={FINDINGS}>
        <FindingsScene {...props} />
      </Sequence>
      <Sequence from={AT_OUTRO} durationInFrames={OUTRO}>
        <OutroScene {...props} />
      </Sequence>
    </AbsoluteFill>
  );
}
