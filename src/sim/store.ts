import { INITIAL_HEALTH } from './constants';
import { advanceCursor, createCursor, cursorToSnapshot, eventTimes, type SimCursor } from './engine';
import { SCENARIOS } from './scenarios';
import type { CarryState, PlaybackStatus, ScenarioId, SimSnapshot } from './types';

export interface SimState {
  scenarioId: ScenarioId;
  status: PlaybackStatus;
  elapsedMs: number;
  carryIn: CarryState;
  completedRuns: number;
  snapshot: SimSnapshot;
  runId: number;
}

export interface ClockDeps {
  now: () => number;
  requestFrame: (cb: () => void) => number;
  cancelFrame: (id: number) => void;
}

export const FRESH_CARRY: CarryState = { stressMax: 0, health: INITIAL_HEALTH };

const browserDeps: ClockDeps = {
  now: () => performance.now(),
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (id) => cancelAnimationFrame(id),
};

// Owns the single simulation clock, incremental event cursor, and active rAF handle.
export class SimStore {
  private state: SimState;
  private listeners = new Set<() => void>();
  private frameId: number | null = null;
  private accumulatedMs = 0;
  private resumedAt = 0;
  private events: number[] = [];
  private cursor: SimCursor = createCursor(FRESH_CARRY);

  constructor(private deps: ClockDeps = browserDeps) {
    this.state = this.resetTo(1, 0);
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getState = () => this.state;

  get activeLoops(): number {
    return this.frameId === null ? 0 : 1;
  }

  liveElapsedMs(): number {
    if (this.state.status !== 'running') return this.state.elapsedMs;
    const dur = SCENARIOS[this.state.scenarioId].durationMs;
    return Math.min(dur, Math.max(0, this.accumulatedMs + (this.deps.now() - this.resumedAt)));
  }

  canStart(_id: ScenarioId): boolean {
    const { status } = this.state;
    return status === 'idle' || status === 'finished';
  }

  start(id: ScenarioId) {
    if (!this.canStart(id)) return;
    const s = this.state;
    const carryIn =
      s.completedRuns > 0
        ? { stressMax: s.snapshot.stressMax, health: s.snapshot.health }
        : FRESH_CARRY;
    this.begin(id, carryIn);
  }

  pause() {
    if (this.state.status !== 'running') return;
    const elapsed = this.liveElapsedMs();
    this.stopLoop();
    this.accumulatedMs = elapsed;
    const scenario = SCENARIOS[this.state.scenarioId];
    this.cursor = advanceCursor(scenario, this.events, this.cursor, elapsed);
    this.set({
      ...this.state,
      status: 'paused',
      elapsedMs: elapsed,
      snapshot: cursorToSnapshot(scenario, this.cursor, elapsed),
    });
  }

  resume() {
    if (this.state.status !== 'paused') return;
    this.resumedAt = this.deps.now();
    this.set({ ...this.state, status: 'running' });
    this.startLoop();
  }

  replay() {
    const s = this.state;
    if (s.status === 'idle') return;
    this.begin(s.scenarioId, s.carryIn);
  }

  reset() {
    this.stopLoop();
    this.set(this.resetTo(1, this.state.runId + 1));
  }

  tick() {
    if (this.state.status !== 'running') return;
    const scenario = SCENARIOS[this.state.scenarioId];
    const dur = scenario.durationMs;
    const elapsed = this.liveElapsedMs();
    this.cursor = advanceCursor(scenario, this.events, this.cursor, elapsed);

    if (elapsed >= dur) {
      this.stopLoop();
      this.accumulatedMs = dur;
      const s = this.state;
      this.set({
        ...s,
        status: 'finished',
        elapsedMs: dur,
        snapshot: cursorToSnapshot(scenario, this.cursor, dur),
        completedRuns: s.completedRuns + 1,
      });
      return;
    }

    this.set({
      ...this.state,
      elapsedMs: elapsed,
      snapshot: cursorToSnapshot(scenario, this.cursor, elapsed),
    });
  }

  dispose() {
    this.stopLoop();
    this.listeners.clear();
  }

  private begin(id: ScenarioId, carryIn: CarryState) {
    this.stopLoop();
    this.accumulatedMs = 0;
    this.resumedAt = this.deps.now();
    const scenario = SCENARIOS[id];
    this.events = eventTimes(scenario);
    this.cursor = advanceCursor(scenario, this.events, createCursor(carryIn), 0);
    this.set({
      ...this.state,
      scenarioId: id,
      status: 'running',
      elapsedMs: 0,
      carryIn,
      snapshot: cursorToSnapshot(scenario, this.cursor, 0),
      runId: this.state.runId + 1,
    });
    this.startLoop();
  }

  private resetTo(id: ScenarioId, runId: number): SimState {
    this.accumulatedMs = 0;
    const scenario = SCENARIOS[id];
    this.events = eventTimes(scenario);
    this.cursor = advanceCursor(scenario, this.events, createCursor(FRESH_CARRY), 0);
    return {
      scenarioId: id,
      status: 'idle',
      elapsedMs: 0,
      carryIn: FRESH_CARRY,
      completedRuns: 0,
      snapshot: cursorToSnapshot(scenario, this.cursor, 0),
      runId,
    };
  }

  private loop = () => {
    this.frameId = null;
    this.tick();
    if (this.state.status === 'running') this.frameId = this.deps.requestFrame(this.loop);
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
