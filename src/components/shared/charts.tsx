import { chart } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/* Dependency-free SVG charts. Responsive via viewBox; labelled for a11y. */

function scale(vals: number[], pad = 0.12) {
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const span = max - min || 1;
  return { min: min - span * 0 , max: max + span * pad, span: span * (1 + pad) };
}

export function Sparkline({
  data, color = chart.series[0], className, fill = true,
}: { data: number[]; color?: string; className?: string; fill?: boolean }) {
  const w = 100, h = 32;
  const { max } = scale(data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / range) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      {fill && <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity={0.12} />}
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AreaChart({
  data, labels, color = chart.series[0], height = 220, formatY = (n: number) => String(n), className, ariaLabel,
}: { data: number[]; labels: string[]; color?: string; height?: number; formatY?: (n: number) => string; className?: string; ariaLabel: string }) {
  const w = 600, h = height, pl = 44, pr = 8, pt = 12, pb = 26;
  const { max } = scale(data, 0.08);
  const iw = w - pl - pr, ih = h - pt - pb;
  const x = (i: number) => pl + (i / (data.length - 1)) * iw;
  const y = (v: number) => pt + ih - (v / max) * ih;
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const every = Math.ceil(labels.length / 6);
  const gid = `ag-${Math.abs(Math.round(data[0] * 7 + data.length))}-${color.slice(1)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} role="img" aria-label={ariaLabel} style={{ height: "auto" }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pl} x2={w - pr} y1={y(t)} y2={y(t)} stroke={chart.grid} strokeDasharray={t === 0 ? undefined : "3 4"} />
          <text x={pl - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={chart.axis}>{formatY(t)}</text>
        </g>
      ))}
      <path d={`${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 4.5 : 0} fill={color} stroke="#fff" strokeWidth={2}>
          <title>{`${labels[i]}: ${formatY(v)}`}</title>
        </circle>
      ))}
      {labels.map((l, i) => i % every === 0 && (
        <text key={i} x={x(i)} y={h - 6} textAnchor="middle" fontSize="11" fill={chart.axis}>{l}</text>
      ))}
    </svg>
  );
}

export function BarChart({
  data, labels, color = chart.series[1], height = 200, formatY = (n: number) => String(n), className, ariaLabel, highlightLast,
}: { data: number[]; labels: string[]; color?: string; height?: number; formatY?: (n: number) => string; className?: string; ariaLabel: string; highlightLast?: boolean }) {
  const w = 600, h = height, pl = 44, pr = 8, pt = 10, pb = 26;
  const { max } = scale(data, 0.1);
  const iw = w - pl - pr, ih = h - pt - pb;
  const bw = iw / data.length;
  const ticks = [0, 0.5, 1].map((t) => t * max);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-full", className)} role="img" aria-label={ariaLabel} style={{ height: "auto" }}>
      {ticks.map((t) => {
        const yy = pt + ih - (t / max) * ih;
        return (
          <g key={t}>
            <line x1={pl} x2={w - pr} y1={yy} y2={yy} stroke={chart.grid} strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={pl - 8} y={yy + 4} textAnchor="end" fontSize="11" fill={chart.axis}>{formatY(t)}</text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const bh = (v / max) * ih;
        const last = highlightLast && i === data.length - 1;
        return (
          <g key={i}>
            <rect x={pl + i * bw + bw * 0.2} y={pt + ih - bh} width={bw * 0.6} height={Math.max(bh, 1)} rx={0} fill={last ? chart.series[0] : color} opacity={last ? 1 : 0.9}>
              <title>{`${labels[i]}: ${formatY(v)}`}</title>
            </rect>
            <text x={pl + i * bw + bw / 2} y={h - 6} textAnchor="middle" fontSize="11" fill={chart.axis}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  data, size = 148, thickness = 20, center, className,
}: { data: { label: string; value: number; color?: string }[]; size?: number; thickness?: number; center?: React.ReactNode; className?: string }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  const arcs = data.map((d) => (d.value / total) * c);
  const starts = arcs.map((_, i) => arcs.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={data.map((d) => `${d.label} ${d.value}`).join(", ")} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={chart.grid} strokeWidth={thickness} />
        {data.map((d, i) => {
          const len = arcs[i];
          return (
            <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color ?? chart.series[i % chart.series.length]}
              strokeWidth={thickness} strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`} strokeDashoffset={-starts[i]}>
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
        })}
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}

export function Legend({ data }: { data: { label: string; value?: string; color?: string }[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-2.5">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color ?? chart.series[i % chart.series.length] }} />
          <span className="min-w-0 flex-1 truncate text-muted">{d.label}</span>
          {d.value && <span className="font-medium tabular">{d.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Horizontal bar rows (top products, sellers…) */
export function HBars({ rows, format }: { rows: { label: string; value: number; sub?: string }[]; format: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 font-semibold tabular">{format(r.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-subtle">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          {r.sub && <p className="mt-1 text-xs text-muted">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
