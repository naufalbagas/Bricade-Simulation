import {
  BRIDGE_ENTRY_X,
  BRIDGE_EXIT_X,
  DEFAULT_BRIDGE_CAPACITY_TONS,
  DEFAULT_MIN_QUALITY,
  INITIAL_QUALITY,
  MAX_BRIDGE_CAPACITY_TONS,
  MAX_QUALITY_THRESHOLD,
  MIN_BRIDGE_CAPACITY_TONS,
  MIN_QUALITY_THRESHOLD,
  MIN_VEHICLE_GAP,
  ROAD_END_X,
  ROAD_START_X,
} from './constants';
import { applyEntryDamage, clamp } from './damage';
import type { QualityReductionEvent, SimSnapshot, VehicleEntity, VehicleSpawnInput } from './types';

export interface EngineState {
  nextVehicleId: number;
  lastHue: number | null;
  vehicles: VehicleEntity[];
  capacityTons: number;
  minQuality: number;
  stressCurrent: number;
  stressPrevious: number;
  quality: number;
  events: QualityReductionEvent[];
}

export function kmhToUnitsPerSec(speedKmh: number): number {
  return speedKmh / 3.6;
}

export function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function normalizedLoad(
  totalWeightTons: number,
  capacityTons: number = DEFAULT_BRIDGE_CAPACITY_TONS,
): number {
  return round6(totalWeightTons / capacityTons);
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function randomVehicleColor(
  rng: () => number,
  lastHue: number | null,
): { color: string; hue: number } {
  const hue = lastHue === null ? rng() * 360 : (lastHue + 48 + rng() * 264) % 360;
  const saturation = 64 + rng() * 18;
  const lightness = 36 + rng() * 12;
  return { color: hslToHex(hue, saturation, lightness), hue };
}

export function createInitialEngineState(overrides?: {
  capacityTons?: number;
  minQuality?: number;
}): EngineState {
  const capacityTons = clamp(
    Math.round(overrides?.capacityTons ?? DEFAULT_BRIDGE_CAPACITY_TONS),
    MIN_BRIDGE_CAPACITY_TONS,
    MAX_BRIDGE_CAPACITY_TONS,
  );
  const minQuality = clamp(
    Math.round(overrides?.minQuality ?? DEFAULT_MIN_QUALITY),
    MIN_QUALITY_THRESHOLD,
    MAX_QUALITY_THRESHOLD,
  );
  return {
    nextVehicleId: 1,
    lastHue: null,
    vehicles: [],
    capacityTons,
    minQuality,
    stressCurrent: 0,
    stressPrevious: 0,
    quality: INITIAL_QUALITY,
    events: [],
  };
}

function activeBridgeWeight(vehicles: VehicleEntity[]): number {
  let sum = 0;
  for (const v of vehicles) {
    if (v.onBridge) sum += v.weightTons;
  }
  return round6(sum);
}

export function setEngineCapacityTons(state: EngineState, rawCapacity: number): EngineState {
  const capacityTons = clamp(
    Math.round(rawCapacity),
    MIN_BRIDGE_CAPACITY_TONS,
    MAX_BRIDGE_CAPACITY_TONS,
  );
  // Stress Previous only changes on vehicle entry, so it is left untouched here.
  const stressCurrent = normalizedLoad(activeBridgeWeight(state.vehicles), capacityTons);
  return {
    ...state,
    capacityTons,
    stressCurrent,
  };
}

export function setEngineMinQuality(state: EngineState, rawMinQuality: number): EngineState {
  const minQuality = clamp(
    Math.round(rawMinQuality),
    MIN_QUALITY_THRESHOLD,
    MAX_QUALITY_THRESHOLD,
  );
  return {
    ...state,
    minQuality,
  };
}

export function spawnVehicleInEngine(
  state: EngineState,
  input: VehicleSpawnInput,
  rng: () => number = Math.random,
): EngineState {
  const picked = input.color
    ? { color: input.color, hue: state.lastHue }
    : randomVehicleColor(rng, state.lastHue);

  const minExistingX = state.vehicles.reduce((min, v) => Math.min(min, v.x), Infinity);
  const startX =
    state.vehicles.length === 0
      ? ROAD_START_X + 0.05
      : Math.min(ROAD_START_X + 0.05, minExistingX - MIN_VEHICLE_GAP);

  const entity: VehicleEntity = {
    id: state.nextVehicleId,
    weightTons: round6(input.weightTons),
    speedKmh: round6(input.speedKmh),
    speedUnitsPerSec: kmhToUnitsPerSec(input.speedKmh),
    color: picked.color,
    x: startX,
    distanceTraveled: 0,
    hasEnteredBridge: false,
    onBridge: false,
  };

  return {
    ...state,
    nextVehicleId: state.nextVehicleId + 1,
    lastHue: picked.hue,
    vehicles: [...state.vehicles, entity],
  };
}

// Advances simulation by integer milliseconds (1 ms fixed micro-steps) for frame-rate independence.
export function advanceEngineByMs(
  state: EngineState,
  stepsMs: number,
): { state: EngineState; discreteChanged: boolean } {
  if (stepsMs <= 0 || state.vehicles.length === 0) {
    return { state, discreteChanged: false };
  }

  let vehicles = state.vehicles.map((v) => ({ ...v }));
  const capacityTons = state.capacityTons;
  let stressCurrent = state.stressCurrent;
  let stressPrevious = state.stressPrevious;
  let quality = state.quality;
  let events = state.events;
  let discreteChanged = false;

  const dtSec = 0.001;

  for (let step = 0; step < stepsMs; step++) {
    if (vehicles.length === 0) break;

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const desiredNextX = v.x + v.speedUnitsPerSec * dtSec;
      const clampedNextX =
        i === 0 ? desiredNextX : Math.min(desiredNextX, vehicles[i - 1].x - MIN_VEHICLE_GAP);
      const deltaX = Math.max(0, clampedNextX - v.x);
      v.x = clampedNextX;
      v.distanceTraveled += deltaX;
    }

    // Check bridge entries & exits in front-to-back order.
    let occupancyChanged = false;

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];

      // Entry: triggers strictly once per vehicle when center reaches BRIDGE_ENTRY_X.
      if (!v.hasEnteredBridge && v.x >= BRIDGE_ENTRY_X) {
        v.hasEnteredBridge = true;
        v.onBridge = v.x < BRIDGE_EXIT_X;
        occupancyChanged = true;

        // 1. Stress Current = total weight on bridge (including this entering vehicle) / capacity.
        stressCurrent = normalizedLoad(activeBridgeWeight(vehicles), capacityTons);
        // 2-3. Compare Stress Previous with Stress Current and reduce quality once.
        const comparedPrevious = stressPrevious;
        const dmg = applyEntryDamage(quality, comparedPrevious, stressCurrent);
        quality = dmg.quality;
        // 4. After the reduction, Stress Previous takes the value of Stress Current.
        stressPrevious = stressCurrent;

        const ev: QualityReductionEvent = {
          vehicleId: v.id,
          reduction: dmg.reduction,
          actualLoss: dmg.actualLoss,
          qualityAfter: quality,
          stressCurrent,
          stressPrevious: comparedPrevious,
        };
        events = [...events, ev];
        discreteChanged = true;
      } else if (v.onBridge && v.x >= BRIDGE_EXIT_X) {
        // Exit: reduces Stress Current only; quality and Stress Previous do NOT change on exit.
        v.onBridge = false;
        occupancyChanged = true;
        discreteChanged = true;
      }
    }

    if (occupancyChanged) {
      stressCurrent = normalizedLoad(activeBridgeWeight(vehicles), capacityTons);
    }

    // Despawn vehicles that have exited past the end of the approach road.
    const beforeCount = vehicles.length;
    vehicles = vehicles.filter((v) => v.x < ROAD_END_X);
    if (vehicles.length !== beforeCount) {
      discreteChanged = true;
    }
  }

  return {
    state: {
      ...state,
      vehicles,
      stressCurrent,
      stressPrevious,
      quality,
      events,
    },
    discreteChanged,
  };
}

export function engineToSnapshot(state: EngineState): SimSnapshot {
  const totalWeightTons = activeBridgeWeight(state.vehicles);
  const occupantCount = state.vehicles.filter((v) => v.onBridge).length;
  return {
    vehicles: state.vehicles,
    occupantCount,
    totalWeightTons,
    capacityTons: state.capacityTons,
    minQuality: state.minQuality,
    stressCurrent: state.stressCurrent,
    stressPrevious: state.stressPrevious,
    quality: state.quality,
    events: state.events,
  };
}
