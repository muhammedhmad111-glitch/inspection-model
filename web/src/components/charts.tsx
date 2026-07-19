// Lightweight, dependency-free, server-renderable SVG charts.
// Colors are passed as CSS color strings (hex or var(--…)).

export function RingGauge({
  value,
  size = 120,
  stroke = 12,
  color = "var(--brand-purple)",
  track = "var(--muted)",
  label,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold">{Math.round(clamped)}%</span>
        {label ? <span className="text-[11px] text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}

export type DonutSegment = { label: string; value: number; color: string };

export function Donut({
  segments,
  size = 160,
  stroke = 22,
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        {segments.map((seg) => {
          const len = (seg.value / total) * c;
          const el = (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-semibold">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type BarDatum = { label: string; value: number; secondary?: number };

export function HBars({
  data,
  color = "var(--brand-purple)",
  emptyText = "لا توجد بيانات",
}: {
  data: BarDatum[];
  color?: string;
  emptyText?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="truncate text-muted-foreground">{d.label}</span>
            <span className="font-semibold">{d.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  data,
  color = "var(--primary)",
  height = 40,
  width = 120,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendLines({
  labels,
  series,
  height = 170,
}: {
  labels: string[];
  series: { name: string; color: string; data: number[] }[];
  height?: number;
}) {
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const n = labels.length;
  const step = n > 1 ? 100 / (n - 1) : 0;
  const y = (v: number) => 100 - (v / max) * 96 - 2;
  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {[25, 50, 75].map((g) => (
          <line
            key={g}
            x1="0"
            y1={g}
            x2="100"
            y2={g}
            stroke="var(--border)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {series.map((s) => (
          <polyline
            key={s.name}
            points={s.data.map((v, i) => `${i * step},${y(v)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex gap-4">
          {series.map((s) => (
            <span
              key={s.name}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          {labels.map((l, i) => (
            <span key={`${l}-${i}`}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VBars({
  data,
  height = 160,
  color = "var(--brand-purple)",
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg transition-all"
              style={{
                height: `${Math.max(4, (d.value / max) * (height - 30))}px`,
                backgroundColor: color,
              }}
              title={`${d.value}`}
            />
          </div>
          <span className="text-[11px] font-semibold">{d.value}</span>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
