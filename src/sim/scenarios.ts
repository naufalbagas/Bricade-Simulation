import { SCENARIO_DURATION_MS, VEHICLE_WEIGHT_TONS } from './constants';
import type { ScenarioDef, ScenarioId, VehicleSpec } from './types';

// Five 1.36 s crossings separated by 0.20 s clear-deck handoffs fit cleanly in [0.20 s, 7.80 s].
// During each 0.20 s handoff the exiting car's rear bumper clears the span before the next car enters.
const SEQ_FIRST_ENTRY_MS = 200;
const SEQ_CROSSING_MS = 1360;
const SEQ_HANDOFF_GAP_MS = 200;

function sequential(prefix: string, colors: string[]): VehicleSpec[] {
  const stepMs = SEQ_CROSSING_MS + SEQ_HANDOFF_GAP_MS;
  return colors.map((color, i) => {
    const entryMs = SEQ_FIRST_ENTRY_MS + i * stepMs;
    return {
      id: `${prefix}-V${i + 1}`,
      label: `V${i + 1}`,
      weightTons: VEHICLE_WEIGHT_TONS,
      entryMs,
      exitMs: entryMs + SEQ_CROSSING_MS,
      color,
    };
  });
}

const OVERLAP_ENTRY_MS = [200, 1000, 1800, 2600, 3400];
const OVERLAP_EXIT_MS = [5000, 5700, 6400, 7100, 7800];

const COLORS_A = ['#b91c1c', '#0f766e', '#ca8a04', '#334155', '#9d174d'];
const COLORS_B = ['#15803d', '#1e3a8a', '#b45309', '#475569', '#881337'];

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  1: {
    id: 1,
    title: 'Sequential Vehicles',
    durationMs: SCENARIO_DURATION_MS,
    vehicles: sequential('S1', COLORS_A),
  },
  2: {
    id: 2,
    title: 'Overlapping Vehicles',
    durationMs: SCENARIO_DURATION_MS,
    vehicles: OVERLAP_ENTRY_MS.map((entryMs, i) => ({
      id: `S2-V${i + 1}`,
      label: `V${i + 1}`,
      weightTons: VEHICLE_WEIGHT_TONS,
      entryMs,
      exitMs: OVERLAP_EXIT_MS[i],
      color: COLORS_A[i],
    })),
  },
  3: {
    id: 3,
    title: 'Sequential Vehicles After Previous Stress',
    durationMs: SCENARIO_DURATION_MS,
    vehicles: sequential('S3', COLORS_B),
  },
};

export const SCENARIO_ORDER: ScenarioId[] = [1, 2, 3];
