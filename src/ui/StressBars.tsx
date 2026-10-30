import { MAX_CAPACITY_TONS } from '../sim/constants';
import { pct, tons } from './format';

const GRID = Array.from({ length: MAX_CAPACITY_TONS - 1 }, (_, i) => (i + 1) * 10);

function VerticalBar({
  label,
  hint,
  value,
  fillClass,
  textClass,
  peakMarker,
}: {
  label: string;
  hint: string;
  value: number;
  fillClass: string;
  textClass: string;
  peakMarker?: number;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5">
      <div className="text-center">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        <div className="text-[11px] leading-tight text-slate-600">{hint}</div>
      </div>

      <div className="num text-[11px] font-medium text-slate-600">10 tons</div>

      <div
        role="meter"
        aria-label={`${label}: ${pct(value)} (${tons(value)} of ${MAX_CAPACITY_TONS} tons)`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        className="relative min-h-[112px] w-16 flex-1 overflow-hidden rounded-md border border-edge bg-slate-50"
      >
        <div
          className={`absolute inset-x-0 bottom-0 ${fillClass} transition-[height] duration-200 ease-out`}
          style={{ height: `${clamped * 100}%` }}
        />
        {GRID.map((g) => (
          <div
            key={g}
            className={`absolute inset-x-0 h-px ${g === 50 ? 'bg-slate-500/65' : 'bg-slate-400/35'}`}
            style={{ bottom: `${g}%` }}
          />
        ))}
        {peakMarker !== undefined && peakMarker > 0 && (
          <div
            className="absolute inset-x-0 h-[3px] bg-peak-fill transition-[bottom] duration-200 ease-out"
            style={{ bottom: `calc(${Math.min(1, peakMarker) * 100}% - 1.5px)` }}
            title={`Peak recorded: ${pct(peakMarker)}`}
          />
        )}
      </div>

      <div className="num text-[11px] font-medium text-slate-600">0 tons</div>

      <div className="text-center">
        <div className={`num text-2xl font-bold leading-none ${textClass}`}>{pct(value)}</div>
        <div className="num mt-1 text-xs font-medium text-slate-700">{tons(value)}</div>
      </div>
    </div>
  );
}

export function StressBars({ load, max }: { load: number; max: number }) {
  return (
    <div className="flex min-h-0 flex-1 gap-3">
      <VerticalBar
        label="Stress Load"
        hint="Current deck load"
        value={load}
        fillClass="bg-load"
        textClass="text-load"
        peakMarker={max}
      />
      <VerticalBar
        label="Stress Max"
        hint="Peak recorded load"
        value={max}
        fillClass="bg-peak-fill"
        textClass="text-peak-ink"
      />
    </div>
  );
}
