'use client';

// COSTERA — Mini-graphiques SVG sans dépendance externe (harmonisés or/violet)

export function Sparkline({ data, height = 56, stroke = '#C8A45D', fill = true }: { data: number[]; height?: number; stroke?: string; fill?: boolean }) {
  if (data.length < 2) {
    return <div className="flex h-14 items-center text-xs text-body/40">Historique insuffisant</div>;
  }
  const width = 240;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const px = (i: number) => 4 + (i / (data.length - 1)) * (width - 8);
  const py = (v: number) => height - 6 - ((v - min) / range) * (height - 12);
  const points = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const area = `${points} ${px(data.length - 1)},${height} ${px(0)},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full" preserveAspectRatio="none">
      {fill ? <polygon points={area} fill={stroke} opacity={0.12} /> : null}
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={px(data.length - 1)} cy={py(data[data.length - 1])} r={3.5} fill={stroke} />
    </svg>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function Donut({ segments, centerValue, centerLabel }: { segments: DonutSegment[]; centerValue: string; centerLabel: string }) {
  const size = 168;
  const strokeW = 26;
  const r = (size - strokeW) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="relative inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFEAF5" strokeWidth={strokeW} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc}
            />
          );
          acc += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-lg font-bold text-royal-900">{centerValue}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-body/40">{centerLabel}</p>
        </div>
      </div>
    </div>
  );
}

export interface BarItem {
  label: string;
  value: number;
  display: string;
  sub?: string;
}

export function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium text-body/75">{item.label}</span>
            <span className="shrink-0 text-sm font-bold text-royal-900">
              {item.display}
              {item.sub ? <span className="ml-1 text-xs font-normal text-body/40">{item.sub}</span> : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-sand-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-royal-600 via-royal-500 to-gold-500"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
