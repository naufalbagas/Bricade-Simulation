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
    description:
      'Five 1-ton cars cross one at a time. Each car waits until the previous car clears the span, keeping Stress Load at 10% during crossings and 0% between them.',
    durationMs: SCENARIO_DURATION_MS,
    vehicles: sequential('S1', COLORS_A),
  },
  2: {
    id: 2,
    title: 'Overlapping Vehicles',
    description:
      'Five 1-ton cars enter at 0.8 s intervals without waiting. All five occupy the bridge together from 3.4 s to 5.0 s (50% Stress Load), then exit sequentially.',
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
    description:
      'Five new 1-ton cars cross one at a time at 10% Stress Load. In Guided Mode, Stress Max (50%) and prior Bridge Health carry over from Scenario 2.',
    durationMs: SCENARIO_DURATION_MS,
    vehicles: sequential('S3', COLORS_B),
  },
};

export const SCENARIO_ORDER: ScenarioId[] = [1, 2, 3];
