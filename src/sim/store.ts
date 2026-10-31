import {
  advanceEngineByMs,
  createInitialEngineState,
  engineToSnapshot,
  setEngineCapacityTons,
  setEngineMinQuality,
  spawnVehicleInEngine,
  type EngineState,
} from './engine';
import type { SimSnapshot, SimStatus, VehicleEntity, VehicleSpawnInput } from './types';

export interface SimState {
  status: SimStatus;
  snapshot: SimSnapshot;
  runId: number;
}

export interface ClockDeps {
  now: () => number;
  requestFrame: (cb: () => void) => number;
  cancelFrame: (id: number) => void;
  rng?: () => number;
}

const browserDeps: ClockDeps = {
  now: () => performance.now(),
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (id) => cancelAnimationFrame(id),
  rng: () => Math.random(),
};

const MAX_FRAME_DELTA_MS = 100;

// Owns the single simulation clock, active rAF loop, bridge properties, and live vehicle entity lookup.
export class SimStore {
  private engine: EngineState;
  private state: SimState;
  private listeners = new Set<() => void>();
  private frameId: number | null = null;
  private lastTickAt = 0;
  private subMsRemainder = 0;

  constructor(private deps: ClockDeps = browserDeps) {
    this.engine = createInitialEngineState();
    this.state = {
      status: 'idle',
      snapshot: engineToSnapshot(this.engine),
      runId: 0,
    };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getState = () => this.state;

  get activeLoops(): number {
    return this.frameId === null ? 0 : 1;
  }

  getVehicleById(id: number): VehicleEntity | undefined {
    return this.engine.vehicles.find((v) => v.id === id);
  }

  syncClock() {
    this.lastTickAt = this.deps.now();
  }

  setCapacityTons(capacityTons: number) {
    const nextEngine = setEngineCapacityTons(this.engine, capacityTons);
    if (nextEngine.capacityTons === this.engine.capacityTons) return;
    this.engine = nextEngine;
    this.set({
      ...this.state,
      snapshot: engineToSnapshot(this.engine),
    });
  }

  setMinQuality(minQuality: number) {
    const nextEngine = setEngineMinQuality(this.engine, minQuality);
    if (nextEngine.minQuality === this.engine.minQuality) return;
    this.engine = nextEngine;
    this.set({
      ...this.state,
      snapshot: engineToSnapshot(this.engine),
    });
  }

  spawnVehicle(input: VehicleSpawnInput) {
    this.engine = spawnVehicleInEngine(this.engine, input, this.deps.rng ?? Math.random);
    const wasIdle = this.state.status === 'idle';
    this.set({
      ...this.state,
      status: 'running',
      snapshot: engineToSnapshot(this.engine),
    });
    if (wasIdle || this.frameId === null) {
      this.lastTickAt = this.deps.now();
      this.subMsRemainder = 0;
      this.startLoop();
    }
  }

  reset() {
    this.stopLoop();
    this.engine = createInitialEngineState({
      capacityTons: this.engine.capacityTons,
      minQuality: this.engine.minQuality,
    });
    this.subMsRemainder = 0;
    this.set({
      status: 'idle',
      snapshot: engineToSnapshot(this.engine),
      runId: this.state.runId + 1,
    });
  }

  tick() {
    if (this.state.status !== 'running') return;

    const now = this.deps.now();
    const rawDelta = Math.max(0, Math.min(MAX_FRAME_DELTA_MS, now - this.lastTickAt));
    this.lastTickAt = now;

    const totalMs = rawDelta + this.subMsRemainder;
    const wholeMs = Math.floor(totalMs);
    this.subMsRemainder = totalMs - wholeMs;

    if (wholeMs > 0) {
      const { state: nextEngine, discreteChanged } = advanceEngineByMs(this.engine, wholeMs);
      this.engine = nextEngine;

      if (this.engine.vehicles.length === 0) {
        this.stopLoop();
        this.subMsRemainder = 0;
        this.set({
          ...this.state,
          status: 'idle',
          snapshot: engineToSnapshot(this.engine),
        });
        return;
      }

      if (discreteChanged) {
        this.set({
          ...this.state,
          snapshot: engineToSnapshot(this.engine),
        });
      }
    }
  }

  dispose() {
    this.stopLoop();
    this.listeners.clear();
  }

  private loop = () => {
    this.frameId = null;
    this.tick();
    if (this.state.status === 'running') {
      this.frameId = this.deps.requestFrame(this.loop);
    }
  };

  private startLoop() {
    this.stopLoop();
    this.frameId = this.deps.requestFrame(this.loop);
  }

  private stopLoop() {
    if (this.frameId !== null) {
      this.deps.cancelFrame(this.frameId);
      this.frameId = null;
    }
  }

  private set(next: SimState) {
    this.state = next;
    this.listeners.forEach((fn) => fn());
  }
}
