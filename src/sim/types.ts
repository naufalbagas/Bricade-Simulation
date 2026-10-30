export type ScenarioId = 1 | 2 | 3;

export type SimMode = 'guided' | 'independent';

export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'finished';

// Integer milliseconds relative to scenario start keep boundary comparisons exact.
export interface VehicleSpec {
  id: string;
  label: string;
  weightTons: number;
  entryMs: number;
  exitMs: number;
  color: string;
}

export type VehiclePhase = 'approaching' | 'on-bridge' | 'exited';

export interface VehicleState {
  id: string;
  label: string;
  weightTons: number;
  color: string;
  x: number;
  speed: number;
  onBridge: boolean;
  phase: VehiclePhase;
}

export interface ScenarioDef {
  id: ScenarioId;
  title: string;
  description: string;
  durationMs: number;
  vehicles: VehicleSpec[];
}

export interface CarryState {
  stressMax: number;
  health: number;
}

export interface LoadTransition {
  timeMs: number;
  prev: number;
  next: number;
  reduction: number;
  healthAfter: number;
}

export interface SimSnapshot {
  timeMs: number;
  vehicles: VehicleState[];
  occupantCount: number;
  totalWeightTons: number;
  stressLoad: number;
  stressMax: number;
  health: number;
  transitions: LoadTransition[];
}
