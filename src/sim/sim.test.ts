import { describe, expect, it, vi } from 'vitest';
import { BRIDGE_ENTRY_X, BRIDGE_EXIT_X, ROAD_END_X, ROAD_START_X, VEHICLE_LENGTH } from './constants';
import * as damage from './damage';
import { applyDamage, faktorPengurang, transitionReduction } from './damage';
import { computeSnapshot, finalCarry, normalizedLoad, vehicleX } from './engine';
import { SCENARIOS } from './scenarios';
import { FRESH_CARRY, SimStore, type ClockDeps } from './store';
import type { ScenarioDef } from './types';

function everyMs(s: ScenarioDef, fn: (t: number) => void) {
  for (let t = 0; t <= s.durationMs; t++) fn(t);
}

describe('core calculations', () => {
  it.each([
    [0, 0, 0],
    [1, 1, 10],
    [2, 2, 20],
    [3, 3, 30],
    [4, 4, 40],
    [5, 5, 50],
  ])('%i vehicles = %i tons = %i%% Stress Load', (vehicles, tons, pct) => {
    expect(normalizedLoad(tons)).toBe(pct / 100);
    expect(normalizedLoad(vehicles) * 100).toBe(pct);
  });

  it('Stress Load follows occupancy, Stress Max never decreases, Bridge Health stays in [0, 100] and never regenerates', () => {
    let carry = FRESH_CARRY;
    for (const id of [1, 2, 3] as const) {
      const s = SCENARIOS[id];
      let prevMax = carry.stressMax;
      let prevHealth = carry.health;
      everyMs(s, (t) => {
        const snap = computeSnapshot(s, carry, t);
        expect(snap.stressLoad).toBe(normalizedLoad(snap.occupantCount));
        expect(snap.stressMax).toBeGreaterThanOrEqual(prevMax);
        expect(snap.stressMax).toBeGreaterThanOrEqual(snap.stressLoad);
        expect(snap.health).toBeLessThanOrEqual(prevHealth);
        expect(snap.health).toBeGreaterThanOrEqual(0);
        expect(snap.health).toBeLessThanOrEqual(100);
        prevMax = snap.stressMax;
        prevHealth = snap.health;
      });
      carry = finalCarry(s, carry);
    }
  });

  it('Stress Load decreases when vehicles exit and waiting vehicles outside do not contribute', () => {
    const s = SCENARIOS[2];
    expect(computeSnapshot(s, FRESH_CARRY, 0).stressLoad).toBe(0);
    expect(computeSnapshot(s, FRESH_CARRY, 199).stressLoad).toBe(0);
    expect(computeSnapshot(s, FRESH_CARRY, 200).stressLoad).toBe(0.1);
    expect(computeSnapshot(s, FRESH_CARRY, 4999).stressLoad).toBe(0.5);
    expect(computeSnapshot(s, FRESH_CARRY, 5000).stressLoad).toBe(0.4);
  });
});

describe('damage model boundary tests (Section 10)', () => {
  it.each([
    [0.0, 0.1, 0.0],
    [0.1, 0.2, 0.0],
    [0.2, 0.21, 0.3],
    [0.38, 0.38, null],
    [0.38, 0.39, 0.5],
    [0.43, 0.43, null],
    [0.43, 0.44, 2.0],
    [0.62, 0.62, null],
    [0.62, 0.63, 4.8],
    [0.7, 0.7, null],
    [0.7, 0.71, 16.5],
    [0.5, 0.4, 0.17],
    [0.5, 0.5, null],
  ])('prev=%f, current=%f -> expected=%s', (prev, cur, expected) => {
    expect(transitionReduction(prev, cur)).toBe(expected);
    expect(applyDamage(100, prev, cur).reduction).toBe(expected ?? 0);
  });

  it('inclusive upper bounds on actual upward transitions match Python <= operators', () => {
    expect(faktorPengurang(0.1, 0.38)).toBe(0.3);
    expect(faktorPengurang(0.38, 0.43)).toBe(0.5);
    expect(faktorPengurang(0.43, 0.62)).toBe(2.0);
    expect(faktorPengurang(0.62, 0.7)).toBe(4.8);
    expect(faktorPengurang(0.7, 1.0)).toBe(16.5);
  });

  it('clamps Bridge Health strictly to [0, 100]', () => {
    expect(applyDamage(10, 0.7, 0.71).health).toBe(0);
    expect(applyDamage(100, 0.0, 0.1).health).toBe(100);
    expect(applyDamage(100, 0.5, 0.4).health).toBe(99.83);
  });
});

describe('scenario 1: sequential vehicles', () => {
  const s = SCENARIOS[1];

  it('never allows more than one vehicle on the bridge and returns to 0% between crossings', () => {
    let sawTen = 0;
    let sawZeroBetween = 0;
    everyMs(s, (t) => {
      const snap = computeSnapshot(s, FRESH_CARRY, t);
      expect(snap.occupantCount).toBeLessThanOrEqual(1);
      if (snap.stressLoad === 0.1) sawTen++;
      if (t > 1560 && t < 6440 && snap.stressLoad === 0) sawZeroBetween++;
    });
    expect(sawTen).toBeGreaterThan(0);
    expect(sawZeroBetween).toBeGreaterThan(0);
  });

  it('ends with Stress Load 0%, Stress Max 10%, and 5 crossing cycles', () => {
    const end = computeSnapshot(s, FRESH_CARRY, s.durationMs);
    expect(end.occupantCount).toBe(0);
    expect(end.stressLoad).toBe(0);
    expect(end.stressMax).toBe(0.1);
    expect(end.health).toBe(99.15);
    expect(end.transitions).toHaveLength(10);
  });
});

describe('scenario 2: overlapping vehicles', () => {
  const s = SCENARIOS[2];

  it('uses exact specified entry and exit times', () => {
    expect(s.vehicles.map((v) => v.entryMs)).toEqual([200, 1000, 1800, 2600, 3400]);
    expect(s.vehicles.map((v) => v.exitMs)).toEqual([5000, 5700, 6400, 7100, 7800]);
  });

  it('reaches 5 simultaneous vehicles (50% Stress Load) and exits completely before 8 s', () => {
    let maxOccupants = 0;
    everyMs(s, (t) => {
      maxOccupants = Math.max(maxOccupants, computeSnapshot(s, FRESH_CARRY, t).occupantCount);
    });
    expect(maxOccupants).toBe(5);
    expect(computeSnapshot(s, FRESH_CARRY, 4000).stressLoad).toBe(0.5);

    const end = computeSnapshot(s, FRESH_CARRY, s.durationMs);
    expect(end.occupantCount).toBe(0);
    expect(end.stressLoad).toBe(0);
    expect(end.stressMax).toBe(0.5);
    expect(end.health).toBe(96.35);
    expect(end.transitions).toHaveLength(10);
  });
});

describe('scenario 3: sequential vehicles after previous stress', () => {
  it('carries Stress Max (50%) and Bridge Health in Guided Mode while crossing one at a time', () => {
    const afterS1 = finalCarry(SCENARIOS[1], FRESH_CARRY);
    const afterS2 = finalCarry(SCENARIOS[2], afterS1);
    expect(afterS1).toEqual({ stressMax: 0.1, health: 99.15 });
    expect(afterS2).toEqual({ stressMax: 0.5, health: 95.5 });

    const s = SCENARIOS[3];
    everyMs(s, (t) => {
      const snap = computeSnapshot(s, afterS2, t);
      expect(snap.occupantCount).toBeLessThanOrEqual(1);
      expect(snap.stressMax).toBe(0.5);
    });
    const end = computeSnapshot(s, afterS2, s.durationMs);
    expect(end.stressLoad).toBe(0);
    expect(end.stressMax).toBe(0.5);
    expect(end.health).toBe(94.65);
  });

  it('uses distinct vehicle IDs from Scenario 1', () => {
    const ids1 = new Set(SCENARIOS[1].vehicles.map((v) => v.id));
    expect(SCENARIOS[3].vehicles.some((v) => ids1.has(v.id))).toBe(false);
  });
});

describe('vehicle kinematics and bumper clearance', () => {
  const halfCar = VEHICLE_LENGTH / 2;

  it.each([1, 2, 3] as const)('scenario %i: monotonic +x movement, zero visual overlap, clean bridge at t=0 and t=8s', (id) => {
    const s = SCENARIOS[id];
    const vs = s.vehicles;

    // No car bumper intrudes onto the span at t=0 or remains on it at t=8000ms.
    for (const v of vs) {
      expect(vehicleX(v, 0) + halfCar).toBeLessThan(BRIDGE_ENTRY_X);
      expect(vehicleX(v, s.durationMs) - halfCar).toBeGreaterThan(BRIDGE_EXIT_X);
    }

    let prevX = vs.map((v) => vehicleX(v, 0));
    everyMs(s, (t) => {
      const xs = vs.map((v) => vehicleX(v, t));
      xs.forEach((x, i) => expect(x).toBeGreaterThanOrEqual(prevX[i]));
      const visible = (x: number) => x > ROAD_START_X - VEHICLE_LENGTH && x < ROAD_END_X + VEHICLE_LENGTH;
      for (let i = 0; i + 1 < xs.length; i++) {
        if (visible(xs[i]) && visible(xs[i + 1])) {
          expect(xs[i] - xs[i + 1]).toBeGreaterThan(VEHICLE_LENGTH);
        }
      }
      prevX = xs;
    });
  });
});

function fakeDeps() {
  let now = 0;
  let nextId = 1;
  const frames = new Map<number, () => void>();
  const deps: ClockDeps = {
    now: () => now,
    requestFrame: (cb) => {
      const id = nextId++;
      frames.set(id, cb);
      return id;
    },
    cancelFrame: (id) => void frames.delete(id),
  };
  const advance = (ms: number, step = 16) => {
    for (let t = 0; t < ms; t += step) {
      now += Math.min(step, ms - t);
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, cb]) => cb());
    }
  };
  return { deps, advance, pendingFrames: () => frames.size };
}

describe('playback and single-loop guarantees', () => {
  it('calls applyDamage strictly once per actual Stress Load transition across 500+ animation frames', () => {
    const spy = vi.spyOn(damage, 'applyDamage');
    const f = fakeDeps();
    const store = new SimStore(f.deps);
    store.setMode('independent');
    store.start(2);
    f.advance(8500, 16);
    expect(store.getState().status).toBe('finished');
    expect(spy).toHaveBeenCalledTimes(10);
    spy.mockRestore();
  });

  it('pause freezes simulation time and vehicle positions; resume continues from exact paused state', () => {
    const f = fakeDeps();
    const store = new SimStore(f.deps);
    store.start(1);
    f.advance(1000);
    store.pause();
    const paused = store.getState();
    f.advance(3000);
    expect(store.getState().elapsedMs).toBe(paused.elapsedMs);
    expect(store.getState().snapshot.vehicles).toEqual(paused.snapshot.vehicles);
    expect(f.pendingFrames()).toBe(0);

    store.resume();
    f.advance(500);
    expect(store.getState().elapsedMs).toBe(paused.elapsedMs + 500);
  });

  it('reset restores all initial values and stops active loops', () => {
    const f = fakeDeps();
    const store = new SimStore(f.deps);
    store.start(1);
    f.advance(8500);
    store.start(2);
    f.advance(4000);
    store.reset();

    const s = store.getState();
    expect(s.status).toBe('idle');
    expect(s.scenarioId).toBe(1);
    expect(s.elapsedMs).toBe(0);
    expect(s.guidedCompleted).toBe(0);
    expect(s.snapshot.stressLoad).toBe(0);
    expect(s.snapshot.stressMax).toBe(0);
    expect(s.snapshot.health).toBe(100);
    expect(store.activeLoops).toBe(0);
  });

  it('produces identical deterministic results across different frame rates and on replay', () => {
    const runGuided = (step: number) => {
      const f = fakeDeps();
      const store = new SimStore(f.deps);
      for (const id of [1, 2, 3] as const) {
        expect(store.canStart(id)).toBe(true);
        store.start(id);
        f.advance(8500, step);
        expect(store.getState().status).toBe('finished');
      }
      return store.getState().snapshot;
    };

    const at60fps = runGuided(16);
    const at144fps = runGuided(7);
    expect(at60fps.health).toBe(94.65);
    expect(at60fps.stressMax).toBe(0.5);
    expect(at144fps).toEqual(at60fps);

    const f = fakeDeps();
    const store = new SimStore(f.deps);
    store.start(1);
    f.advance(8500);
    store.start(2);
    f.advance(8500);
    const firstRun = store.getState().snapshot;
    store.replay();
    expect(store.getState().snapshot.health).toBe(99.15);
    f.advance(8500);
    expect(store.getState().snapshot).toEqual(firstRun);
  });

  it('prevents duplicate loops and starts fresh on every Independent Mode run', () => {
    const f = fakeDeps();
    const store = new SimStore(f.deps);
    expect(store.canStart(2)).toBe(false);
    expect(store.canStart(3)).toBe(false);

    store.setMode('independent');
    store.start(3);
    store.start(3);
    store.start(2);
    expect(f.pendingFrames()).toBe(1);
    expect(store.activeLoops).toBe(1);

    f.advance(8500);
    expect(store.getState().snapshot.stressMax).toBe(0.5);
    expect(store.getState().snapshot.health).toBe(96.35);

    store.start(3);
    f.advance(8500);
    expect(store.getState().snapshot.stressMax).toBe(0.1);
    expect(store.getState().snapshot.health).toBe(99.15);
  });
});
