import { BRIDGE_ENTRY_X, BRIDGE_LENGTH, MAX_CAPACITY_TONS } from './constants';
import { applyDamage } from './damage';
import type { CarryState, LoadTransition, ScenarioDef, SimSnapshot, VehicleSpec, VehicleState } from './types';

export interface SimCursor {
  eventIndex: number;
  stressLoad: number;
  stressMax: number;
  health: number;
  transitions: LoadTransition[];
}

export function vehicleSpeed(v: VehicleSpec): number {
  return BRIDGE_LENGTH / ((v.exitMs - v.entryMs) / 1000);
}

export function vehicleX(v: VehicleSpec, tMs: number): number {
  return BRIDGE_ENTRY_X + ((tMs - v.entryMs) / 1000) * vehicleSpeed(v);
}

// Center-point occupancy interval [entryMs, exitMs) corresponds to [BRIDGE_ENTRY_X, BRIDGE_EXIT_X).
export function isOnBridge(v: VehicleSpec, tMs: number): boolean {
  return v.entryMs <= tMs && tMs < v.exitMs;
}

export function vehicleState(v: VehicleSpec, tMs: number): VehicleState {
  const onBridge = isOnBridge(v, tMs);
  return {
    id: v.id,
    label: v.label,
    weightTons: v.weightTons,
    color: v.color,
    x: vehicleX(v, tMs),
    speed: vehicleSpeed(v),
    onBridge,
    phase: onBridge ? 'on-bridge' : tMs < v.entryMs ? 'approaching' : 'exited',
  };
}

export function totalWeightAt(s: ScenarioDef, tMs: number): number {
  return s.vehicles.reduce((sum, v) => (isOnBridge(v, tMs) ? sum + v.weightTons : sum), 0);
}

export function normalizedLoad(totalWeightTons: number): number {
  return Math.round((totalWeightTons / MAX_CAPACITY_TONS) * 1e6) / 1e6;
}

export function eventTimes(s: ScenarioDef): number[] {
  const set = new Set<number>();
  for (const v of s.vehicles) {
    set.add(v.entryMs);
    set.add(v.exitMs);
  }
  return [...set].sort((a, b) => a - b);
}

export function createCursor(carry: CarryState): SimCursor {
  return {
    eventIndex: 0,
    stressLoad: 0,
    stressMax: carry.stressMax,
    health: carry.health,
    transitions: [],
  };
}

// Processes only newly crossed occupancy timestamps so damage runs once per actual load transition.
export function advanceCursor(s: ScenarioDef, events: number[], cursor: SimCursor, tMs: number): SimCursor {
  let idx = cursor.eventIndex;
  if (idx >= events.length || events[idx] > tMs) return cursor;

  let load = cursor.stressLoad;
  let stressMax = cursor.stressMax;
  let health = cursor.health;
  const transitions = [...cursor.transitions];

  while (idx < events.length && events[idx] <= tMs) {
    const t = events[idx];
    const next = normalizedLoad(totalWeightAt(s, t));
    if (next !== load) {
      const r = applyDamage(health, load, next);
      health = r.health;
      stressMax = Math.max(stressMax, next);
      transitions.push({ timeMs: t, prev: load, next, reduction: r.reduction, healthAfter: health });
      load = next;
    }
    idx++;
  }

  return { eventIndex: idx, stressLoad: load, stressMax, health, transitions };
}

export function cursorToSnapshot(s: ScenarioDef, cursor: SimCursor, tMs: number): SimSnapshot {
  const vehicles = s.vehicles.map((v) => vehicleState(v, tMs));
  const totalWeightTons = totalWeightAt(s, tMs);
  return {
    timeMs: tMs,
    vehicles,
    occupantCount: vehicles.filter((v) => v.onBridge).length,
    totalWeightTons,
    stressLoad: cursor.stressLoad,
    stressMax: cursor.stressMax,
    health: cursor.health,
    transitions: cursor.transitions,
  };
}

export function computeSnapshot(s: ScenarioDef, carry: CarryState, tMs: number): SimSnapshot {
  const events = eventTimes(s);
  const cursor = advanceCursor(s, events, createCursor(carry), tMs);
  return cursorToSnapshot(s, cursor, tMs);
}

export function finalCarry(s: ScenarioDef, carry: CarryState): CarryState {
  const snap = computeSnapshot(s, carry, s.durationMs);
  return { stressMax: snap.stressMax, health: snap.health };
}
