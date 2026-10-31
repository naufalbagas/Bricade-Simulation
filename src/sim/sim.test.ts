import { describe, expect, it, vi } from 'vitest';
import {
  BRIDGE_ENTRY_X,
  BRIDGE_EXIT_X,
  DEFAULT_BRIDGE_CAPACITY_TONS,
  DEFAULT_MIN_QUALITY,
  INITIAL_QUALITY,
  MAX_BRIDGE_CAPACITY_TONS,
  MIN_BRIDGE_CAPACITY_TONS,
  MIN_VEHICLE_GAP,
  ROAD_START_X,
  VEHICLE_LENGTH,
} from './constants';
import * as damage from './damage';
import { applyEntryDamage, faktorPengurang } from './damage';
import { normalizedLoad } from './engine';
import { SimStore, type ClockDeps } from './store';

function fakeDeps(seed = 1) {
  let now = 0;
  let nextId = 1;
  let rngState = seed;
  const frames = new Map<number, () => void>();

  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0;
    return rngState / 0x100000000;
  };

  const deps: ClockDeps = {
    now: () => now,
    requestFrame: (cb) => {
      const id = nextId++;
      frames.set(id, cb);
      return id;
    },
    cancelFrame: (id) => void frames.delete(id),
    rng,
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

describe('Darren faktorPengurang & applyEntryDamage logic', () => {
  it.each([
    [0.0, 0.1, 0.17],
    [0.1, 0.2, 0.17],
    [0.2, 0.21, 0.3],
    [0.2, 0.38, 0.3],
    [0.38, 0.38, 0.3],
    [0.38, 0.39, 0.5],
    [0.38, 0.43, 0.5],
    [0.43, 0.43, 0.5],
    [0.43, 0.44, 2.0],
    [0.43, 0.62, 2.0],
    [0.62, 0.62, 2.0],
    [0.62, 0.63, 4.8],
    [0.62, 0.7, 4.8],
    [0.7, 0.7, 4.8],
    [0.7, 0.71, 16.5],
    [0.7, 1.2, 16.5],
    // When nilaiCurr < nilaiPrev, always returns 0.17 regardless of bracket
    [0.5, 0.4, 0.17],
    [0.75, 0.65, 0.17],
    [0.35, 0.1, 0.17],
  ])('faktorPengurang(prev=%f, cur=%f) -> %f', (prev, cur, expected) => {
    expect(faktorPengurang(prev, cur)).toBe(expected);
  });

  it('clamps Kualitas Jembatan strictly within [0, 100]', () => {
    const zeroed = applyEntryDamage(10, 0.5, 0.8);
    expect(zeroed.quality).toBe(0);
    expect(zeroed.reduction).toBe(16.5);
    expect(zeroed.actualLoss).toBe(10);

    const alreadyZero = applyEntryDamage(0, 0.8, 0.8);
    expect(alreadyZero.quality).toBe(0);
    expect(alreadyZero.actualLoss).toBe(0);
  });
});

describe('entry-only Kualitas Jembatan reduction & Stress Current accumulation', () => {
  it('reduces Kualitas Jembatan strictly ONCE when a vehicle enters and NEVER when it exits', () => {
    const spy = vi.spyOn(damage, 'applyEntryDamage');
    const f = fakeDeps();
    const store = new SimStore(f.deps);

    store.spawnVehicle({ weightTons: 3, speedKmh: 36 });

    f.advance(800, 10);
    expect(store.getState().snapshot.stressCurrent).toBe(0);
    expect(store.getState().snapshot.quality).toBe(100);
    expect(spy).toHaveBeenCalledTimes(0);

    f.advance(200, 10);
    expect(store.getState().snapshot.occupantCount).toBe(1);
    expect(store.getState().snapshot.stressCurrent).toBe(0.3);
    expect(store.getState().snapshot.stressPrevious).toBe(0.3);
    expect(store.getState().snapshot.quality).toBe(99.7);
    expect(spy).toHaveBeenCalledTimes(1);

    f.advance(2000, 10);
    expect(store.getState().snapshot.occupantCount).toBe(1);
    expect(store.getState().snapshot.quality).toBe(99.7);
    expect(spy).toHaveBeenCalledTimes(1);

    f.advance(600, 10);
    expect(store.getState().snapshot.occupantCount).toBe(0);
    expect(store.getState().snapshot.stressCurrent).toBe(0);
    expect(store.getState().snapshot.stressPrevious).toBe(0.3);
    expect(store.getState().snapshot.quality).toBe(99.7);
    expect(spy).toHaveBeenCalledTimes(1);

    f.advance(1000, 10);
    expect(store.getState().status).toBe('idle');
    expect(store.activeLoops).toBe(0);
    expect(store.getState().snapshot.vehicles).toHaveLength(0);
    expect(store.getState().snapshot.quality).toBe(99.7);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it('accumulates Stress Current = totalWeight / capacityTons and compares against Stress Previous on each entry', () => {
    const spy = vi.spyOn(damage, 'applyEntryDamage');
    const f = fakeDeps();
    const store = new SimStore(f.deps);

    expect(DEFAULT_BRIDGE_CAPACITY_TONS).toBe(10);
    expect(normalizedLoad(2.5, 10)).toBe(0.25);
    expect(normalizedLoad(25, 50)).toBe(0.5);

    store.spawnVehicle({ weightTons: 2.5, speedKmh: 36 });
    f.advance(500, 10);
    store.spawnVehicle({ weightTons: 2.5, speedKmh: 36 });

    f.advance(1200, 10);
    const bothSnap = store.getState().snapshot;
    expect(bothSnap.occupantCount).toBe(2);
    expect(bothSnap.totalWeightTons).toBe(5);
    expect(bothSnap.stressCurrent).toBe(0.5);
    expect(bothSnap.stressPrevious).toBe(0.5);
    expect(bothSnap.quality).toBe(97.7);
    expect(spy).toHaveBeenCalledTimes(2);

    f.advance(4000, 10);
    expect(store.getState().snapshot.occupantCount).toBe(0);
    expect(store.getState().snapshot.stressCurrent).toBe(0);
    expect(store.getState().snapshot.stressPrevious).toBe(0.5);
    expect(store.getState().snapshot.quality).toBe(97.7);
    expect(spy).toHaveBeenCalledTimes(2);

    // Third car (3.5 Ton) enters an empty bridge: current 0.35 < previous 0.5 -> 0.17,
    // then Stress Previous is overwritten with Stress Current (0.35), even though it is lower.
    store.spawnVehicle({ weightTons: 3.5, speedKmh: 36 });
    f.advance(5000, 10);
    expect(store.getState().snapshot.stressCurrent).toBe(0);
    expect(store.getState().snapshot.stressPrevious).toBe(0.35);
    expect(store.getState().snapshot.quality).toBe(97.53);
    expect(spy).toHaveBeenCalledTimes(3);

    // Fourth car (3.5 Ton): current 0.35 >= previous 0.35 and in (0.20, 0.38] -> 0.3.
    store.spawnVehicle({ weightTons: 3.5, speedKmh: 36 });
    f.advance(5000, 10);
    expect(store.getState().snapshot.stressPrevious).toBe(0.35);
    expect(store.getState().snapshot.quality).toBe(97.23);
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenLastCalledWith(97.53, 0.35, 0.35);

    spy.mockRestore();
  });

  it('keeps Stress Previous unchanged on exit and when Kapasitas changes; only entries update it', () => {
    const f = fakeDeps();
    const store = new SimStore(f.deps);

    store.spawnVehicle({ weightTons: 6, speedKmh: 36 });
    f.advance(1200, 10);
    expect(store.getState().snapshot.stressCurrent).toBe(0.6);
    expect(store.getState().snapshot.stressPrevious).toBe(0.6);

    store.setCapacityTons(20);
    expect(store.getState().snapshot.stressCurrent).toBe(0.3);
    expect(store.getState().snapshot.stressPrevious).toBe(0.6);

    f.advance(5000, 10);
    expect(store.getState().snapshot.stressCurrent).toBe(0);
    expect(store.getState().snapshot.stressPrevious).toBe(0.6);
  });
});

describe('Properties Jembatan: dynamic Kapasitas (10-100) & Kualitas Minimum Jembatan', () => {
  it('clamps Kapasitas to [10, 100] and recalculates Stress Current dynamically against custom capacity', () => {
    const f = fakeDeps();
    const store = new SimStore(f.deps);

    expect(store.getState().snapshot.capacityTons).toBe(10);
    expect(store.getState().snapshot.minQuality).toBe(DEFAULT_MIN_QUALITY);

    store.setCapacityTons(3);
    expect(store.getState().snapshot.capacityTons).toBe(MIN_BRIDGE_CAPACITY_TONS);
    store.setCapacityTons(250);
    expect(store.getState().snapshot.capacityTons).toBe(MAX_BRIDGE_CAPACITY_TONS);

    // Set capacity to 50 Ton, spawn a 25 Ton truck -> 25 / 50 = 50% Stress Current -> -2.0% quality
    store.setCapacityTons(50);
    store.spawnVehicle({ weightTons: 25, speedKmh: 36 });
    f.advance(1200, 10);

    expect(store.getState().snapshot.stressCurrent).toBe(0.5);
    expect(store.getState().snapshot.stressPrevious).toBe(0.5);
    expect(store.getState().snapshot.quality).toBe(98);

    // Drag capacity up to 100 Ton while the 25 Ton truck is still on the bridge -> Stress Current becomes 25%
    store.setCapacityTons(100);
    expect(store.getState().snapshot.stressCurrent).toBe(0.25);
    expect(store.getState().snapshot.stressPrevious).toBe(0.5);
  });

  it('updates Kualitas Minimum Jembatan in [0, 100] and preserves Properties Jembatan across Reset', () => {
    const f = fakeDeps();
    const store = new SimStore(f.deps);

    store.setCapacityTons(40);
    store.setMinQuality(55);
    expect(store.getState().snapshot.minQuality).toBe(55);

    store.setMinQuality(-10);
    expect(store.getState().snapshot.minQuality).toBe(0);
    store.setMinQuality(130);
    expect(store.getState().snapshot.minQuality).toBe(100);

    store.setMinQuality(45);
    store.spawnVehicle({ weightTons: 20, speedKmh: 36 });
    f.advance(1200, 10);
    expect(store.getState().snapshot.quality).toBe(98);

    store.reset();
    const after = store.getState().snapshot;
    expect(after.capacityTons).toBe(40);
    expect(after.minQuality).toBe(45);
    expect(after.quality).toBe(100);
    expect(after.stressCurrent).toBe(0);
    expect(after.stressPrevious).toBe(0);
  });
});

describe('speed kinematics, random colors, spacing, determinism, and Reset', () => {
  it('crosses faster when Kecepatan is higher', () => {
    const runSingle = (speedKmh: number) => {
      const f = fakeDeps();
      const store = new SimStore(f.deps);
      store.spawnVehicle({ weightTons: 1, speedKmh });
      let ms = 0;
      while (store.getState().status === 'running' && ms < 30000) {
        f.advance(10, 10);
        ms += 10;
      }
      return ms;
    };

    const slowMs = runSingle(30);
    const fastMs = runSingle(60);
    expect(fastMs).toBeLessThan(slowMs);
    expect(slowMs / fastMs).toBeCloseTo(2, 1);
  });

  it('assigns random valid hex colors and prevents bumper overlap when rapid-spawning or trailing slower cars', () => {
    const f = fakeDeps(42);
    const store = new SimStore(f.deps);

    store.spawnVehicle({ weightTons: 1, speedKmh: 25 });
    store.spawnVehicle({ weightTons: 1.5, speedKmh: 70 });
    store.spawnVehicle({ weightTons: 2, speedKmh: 90 });
    store.spawnVehicle({ weightTons: 1, speedKmh: 50 });

    const initialVehicles = store.getState().snapshot.vehicles;
    expect(initialVehicles).toHaveLength(4);
    const colors = initialVehicles.map((v) => v.color);
    colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
    for (let i = 1; i < colors.length; i++) {
      expect(colors[i]).not.toBe(colors[i - 1]);
    }

    for (let t = 0; t < 9000; t += 20) {
      f.advance(20, 20);
      const vs = store.getState().snapshot.vehicles;
      for (let i = 0; i + 1 < vs.length; i++) {
        expect(vs[i].x - vs[i + 1].x).toBeGreaterThanOrEqual(MIN_VEHICLE_GAP - 1e-6);
        expect(vs[i].x - vs[i + 1].x).toBeGreaterThan(VEHICLE_LENGTH);
      }
    }

    expect(ROAD_START_X).toBeLessThan(BRIDGE_ENTRY_X);
    expect(BRIDGE_ENTRY_X).toBeLessThan(BRIDGE_EXIT_X);
  });

  it('produces identical results across 60fps (16ms) and 144fps (7ms) frame steps', () => {
    const simulate = (frameStep: number) => {
      const f = fakeDeps(99);
      const store = new SimStore(f.deps);
      store.spawnVehicle({ weightTons: 2.2, speedKmh: 45 });
      f.advance(420, frameStep);
      store.spawnVehicle({ weightTons: 3.1, speedKmh: 55 });
      f.advance(6000, frameStep);
      return store.getState().snapshot;
    };

    const snap60 = simulate(16);
    const snap144 = simulate(7);
    expect(snap60.quality).toBeLessThan(INITIAL_QUALITY);
    expect(snap144).toEqual(snap60);
  });

  it('Reset restores Kualitas Jembatan to 100%, Stress Current & Stress Previous to 0%, clears vehicles, and stops loop', () => {
    const f = fakeDeps();
    const store = new SimStore(f.deps);

    store.spawnVehicle({ weightTons: 6.5, speedKmh: 50 });
    f.advance(1200, 16);
    expect(store.getState().snapshot.stressPrevious).toBe(0.65);
    expect(store.getState().snapshot.quality).toBe(95.2);
    expect(store.activeLoops).toBe(1);

    const prevRunId = store.getState().runId;
    store.reset();

    const after = store.getState();
    expect(after.status).toBe('idle');
    expect(after.runId).toBe(prevRunId + 1);
    expect(after.snapshot.vehicles).toHaveLength(0);
    expect(after.snapshot.occupantCount).toBe(0);
    expect(after.snapshot.totalWeightTons).toBe(0);
    expect(after.snapshot.stressCurrent).toBe(0);
    expect(after.snapshot.stressPrevious).toBe(0);
    expect(after.snapshot.quality).toBe(100);
    expect(after.snapshot.events).toHaveLength(0);
    expect(store.activeLoops).toBe(0);
  });
});
