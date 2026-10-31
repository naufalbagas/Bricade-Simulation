import { useState, type FormEvent } from 'react';
import { LeftStressBars3D } from '../scene/CubeBars3D';
import {
  DEFAULT_SPEED_KMH,
  DEFAULT_WEIGHT_TONS,
  MAX_SPEED_KMH,
  MAX_WEIGHT_TONS,
  MIN_SPEED_KMH,
  MIN_WEIGHT_TONS,
} from '../sim/constants';
import { simStore } from '../useSim';

const btnBase =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:pointer-events-none disabled:opacity-40';

export const btn = {
  primary: `${btnBase} bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-slate-900 shadow-sm`,
  secondary: `${btnBase} border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 shadow-sm`,
};

function parseDecimal(raw: string): number {
  const cleaned = raw.trim().replace(',', '.');
  if (cleaned === '') return Number.NaN;
  return Number(cleaned);
}

export function LeftBarControls({
  stressCurrent,
  stressPrevious,
  capacityTons,
  runId,
  onResetCamera,
}: {
  stressCurrent: number;
  stressPrevious: number;
  capacityTons: number;
  runId: number;
  onResetCamera: () => void;
}) {
  const [weightInput, setWeightInput] = useState(String(DEFAULT_WEIGHT_TONS));
  const [speedInput, setSpeedInput] = useState(String(DEFAULT_SPEED_KMH));
  const [weightError, setWeightError] = useState<string | null>(null);
  const [speedError, setSpeedError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const weight = parseDecimal(weightInput);
    const speed = parseDecimal(speedInput);

    let nextWeightErr: string | null = null;
    let nextSpeedErr: string | null = null;

    if (!Number.isFinite(weight) || weight < MIN_WEIGHT_TONS || weight > MAX_WEIGHT_TONS) {
      nextWeightErr = `Masukkan beban antara ${MIN_WEIGHT_TONS} dan ${MAX_WEIGHT_TONS} Ton.`;
    }
    if (!Number.isFinite(speed) || speed < MIN_SPEED_KMH || speed > MAX_SPEED_KMH) {
      nextSpeedErr = `Masukkan kecepatan antara ${MIN_SPEED_KMH} dan ${MAX_SPEED_KMH} km/jam.`;
    }

    setWeightError(nextWeightErr);
    setSpeedError(nextSpeedErr);

    if (nextWeightErr || nextSpeedErr) return;

    simStore.spawnVehicle({ weightTons: weight, speedKmh: speed });
  };

  const handleReset = () => {
    setWeightError(null);
    setSpeedError(null);
    simStore.reset();
    onResetCamera();
  };

  return (
    <div className="flex flex-1 flex-col gap-3.5">
      {/* Section Atas (Utama): Form Input Beban (Ton) & Kecepatan */}
      <section aria-labelledby="vehicle-form-heading" className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
        <h2 id="vehicle-form-heading" className="text-sm font-semibold text-slate-900">
          Input Kendaraan
        </h2>

        <form onSubmit={handleSubmit} noValidate className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <label htmlFor="weight-tons" className="block text-xs font-semibold text-slate-700">
                Beban (Ton)
              </label>
              <input
                id="weight-tons"
                name="weightTons"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={MIN_WEIGHT_TONS}
                max={MAX_WEIGHT_TONS}
                value={weightInput}
                onChange={(ev) => {
                  setWeightInput(ev.target.value);
                  if (weightError) setWeightError(null);
                }}
                aria-invalid={Boolean(weightError)}
                aria-describedby={weightError ? 'weight-error' : 'weight-hint'}
                className="num mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:text-sm"
              />
              {weightError ? (
                <p id="weight-error" role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                  {weightError}
                </p>
              ) : (
                <p id="weight-hint" className="mt-1 text-xs text-slate-500">
                  Rentang {MIN_WEIGHT_TONS} sampai {MAX_WEIGHT_TONS} Ton
                </p>
              )}
            </div>

            <div>
              <label htmlFor="speed-kmh" className="block text-xs font-semibold text-slate-700">
                Kecepatan (km/jam)
              </label>
              <input
                id="speed-kmh"
                name="speedKmh"
                type="number"
                inputMode="decimal"
                step="1"
                min={MIN_SPEED_KMH}
                max={MAX_SPEED_KMH}
                value={speedInput}
                onChange={(ev) => {
                  setSpeedInput(ev.target.value);
                  if (speedError) setSpeedError(null);
                }}
                aria-invalid={Boolean(speedError)}
                aria-describedby={speedError ? 'speed-error' : 'speed-hint'}
                className="num mt-1 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:text-sm"
              />
              {speedError ? (
                <p id="speed-error" role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                  {speedError}
                </p>
              ) : (
                <p id="speed-hint" className="mt-1 text-xs text-slate-500">
                  Rentang {MIN_SPEED_KMH} sampai {MAX_SPEED_KMH} km/jam
                </p>
              )}
            </div>
          </div>

          <button type="submit" className={`${btn.primary} w-full`}>
            Kirim Kendaraan
          </button>
        </form>
      </section>

      {/* Static Non-Rotatable 3D Stress Cube-Bars (Minimalist, Zero Wireframe, Rotated 5-9%) */}
      <LeftStressBars3D
        current={stressCurrent}
        previous={stressPrevious}
        capacityTons={capacityTons}
        runId={runId}
      />

      {/* Section Bawah: Tombol Reset */}
      <section aria-label="Reset simulasi" className="mt-auto border-t border-slate-200 pt-3">
        <button type="button" className={`${btn.secondary} w-full`} onClick={handleReset}>
          Reset
        </button>
      </section>
    </div>
  );
}
