import type { CSSProperties } from 'react';
import {
  MAX_BRIDGE_CAPACITY_TONS,
  MAX_QUALITY_THRESHOLD,
  MIN_BRIDGE_CAPACITY_TONS,
  MIN_QUALITY_THRESHOLD,
} from '../sim/constants';
import { simStore } from '../useSim';

export function BridgePropertiesCard({
  capacityTons,
  minQuality,
}: {
  capacityTons: number;
  minQuality: number;
}) {
  const capPct =
    ((capacityTons - MIN_BRIDGE_CAPACITY_TONS) /
      (MAX_BRIDGE_CAPACITY_TONS - MIN_BRIDGE_CAPACITY_TONS)) *
    100;
  const minQualPct =
    ((minQuality - MIN_QUALITY_THRESHOLD) / (MAX_QUALITY_THRESHOLD - MIN_QUALITY_THRESHOLD)) * 100;

  return (
    <div
      aria-label="Properties Jembatan"
      onPointerDown={(e) => e.stopPropagation()}
      className="border-t border-slate-200 bg-white px-4 py-3 lg:absolute lg:left-3 lg:top-3 lg:z-20 lg:w-72 lg:rounded-lg lg:border lg:border-slate-200 lg:bg-white/95 lg:p-3 lg:shadow-md"
    >
      <h2 className="text-xs font-bold text-slate-900 sm:text-sm">Properties Jembatan</h2>

      <div className="mt-2.5 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2 lg:flex lg:flex-col lg:gap-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="bridge-capacity" className="text-xs font-semibold text-slate-700">
              Kapasitas
            </label>
            <span className="num text-xs font-bold text-slate-900">{capacityTons} Ton</span>
          </div>
          <input
            id="bridge-capacity"
            type="range"
            min={MIN_BRIDGE_CAPACITY_TONS}
            max={MAX_BRIDGE_CAPACITY_TONS}
            step={1}
            value={capacityTons}
            style={{ '--slider-pct': `${capPct.toFixed(1)}%` } as CSSProperties}
            onChange={(ev) => simStore.setCapacityTons(Number(ev.target.value))}
            className="prop-slider"
          />
          <div className="num -mt-1.5 flex justify-between text-[10px] font-medium text-slate-500">
            <span>{MIN_BRIDGE_CAPACITY_TONS} Ton</span>
            <span>{MAX_BRIDGE_CAPACITY_TONS} Ton</span>
          </div>
        </div>

        <div className="pt-1 sm:pt-0 lg:pt-1">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="bridge-min-quality" className="text-xs font-semibold text-slate-700">
              Kualitas Minimum Jembatan
            </label>
            <span className="num text-xs font-bold text-slate-900">{minQuality}%</span>
          </div>
          <input
            id="bridge-min-quality"
            type="range"
            min={MIN_QUALITY_THRESHOLD}
            max={MAX_QUALITY_THRESHOLD}
            step={1}
            value={minQuality}
            style={{ '--slider-pct': `${minQualPct.toFixed(1)}%` } as CSSProperties}
            onChange={(ev) => simStore.setMinQuality(Number(ev.target.value))}
            className="prop-slider"
          />
          <div className="num -mt-1.5 flex justify-between text-[10px] font-medium text-slate-500">
            <span>{MIN_QUALITY_THRESHOLD}%</span>
            <span>{MAX_QUALITY_THRESHOLD}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
