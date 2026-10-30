import { SCENARIO_ORDER, SCENARIOS } from '../sim/scenarios';
import type { SimState } from '../sim/store';
import type { ScenarioId, SimMode } from '../sim/types';
import { simStore } from '../useSim';

const btnBase =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-all active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-load disabled:pointer-events-none disabled:opacity-40';

export const btn = {
  primary: `${btnBase} bg-slate-900 text-white hover:bg-slate-700`,
  secondary: `${btnBase} border border-edge bg-white text-slate-900 hover:bg-slate-100`,
};

export function ModeToggle({ mode }: { mode: SimMode }) {
  const options: { id: SimMode; label: string }[] = [
    { id: 'guided', label: 'Guided Mode' },
    { id: 'independent', label: 'Independent Mode' },
  ];
  return (
    <div role="radiogroup" aria-label="Simulation mode" className="inline-flex gap-1 rounded-md border border-edge bg-slate-50 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={mode === o.id}
          onClick={() => simStore.setMode(o.id)}
          className={`min-h-11 rounded px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-load ${
            mode === o.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200/70'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function guidedStatus(s: SimState, id: ScenarioId): string {
  if (id <= s.guidedCompleted) return 'Completed';
  if (id === s.scenarioId && (s.status === 'running' || s.status === 'paused')) return 'Active';
  if (id === s.guidedCompleted + 1) return 'Ready next';
  return `Runs after ${id - 1}`;
}

export function PlaybackControls({ state, onResetCamera }: { state: SimState; onResetCamera: () => void }) {
  const { status, mode, scenarioId, guidedCompleted } = state;
  const nextGuided = (guidedCompleted + 1) as ScenarioId;
  const startTarget: ScenarioId | null =
    mode === 'guided'
      ? guidedCompleted < 3 && simStore.canStart(nextGuided)
        ? nextGuided
        : null
      : status === 'idle' || status === 'finished'
        ? scenarioId
        : null;

  return (
    <div className="space-y-2" aria-label="Playback controls">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className={btn.primary}
          disabled={startTarget === null}
          onClick={() => startTarget && simStore.start(startTarget)}
        >
          {startTarget ? `Start ${startTarget}` : 'Start'}
        </button>
        <button type="button" className={btn.secondary} disabled={status !== 'running'} onClick={() => simStore.pause()}>
          Pause
        </button>
        <button type="button" className={btn.secondary} disabled={status !== 'paused'} onClick={() => simStore.resume()}>
          Resume
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={btn.secondary} disabled={status === 'idle'} onClick={() => simStore.replay()}>
          Replay
        </button>
        <button type="button" className={btn.secondary} onClick={() => simStore.reset()}>
          Reset
        </button>
        <button type="button" className={btn.secondary} onClick={onResetCamera}>
          Center 3D
        </button>
      </div>
    </div>
  );
}

export function ScenarioList({ state }: { state: SimState }) {
  const guided = state.mode === 'guided';
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Scenarios</h2>
        <span className="text-[11px] text-slate-600">{guided ? 'Ordered 1 \u2192 2 \u2192 3' : 'Fresh state per run'}</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">
        {guided
          ? 'Stress Max and Bridge Health carry over across Scenarios 1, 2, and 3. Press Reset to restart the chain.'
          : 'Run any scenario in isolation. Each run starts at 0% Stress Load, 0% Stress Max, and 100% Bridge Health.'}
      </p>

      {SCENARIO_ORDER.map((id) => {
        const sc = SCENARIOS[id];
        const current = state.scenarioId === id;
        const canSelect = simStore.canSelect(id);
        return (
          <article
            key={id}
            className={`rounded-lg border p-3 transition-colors ${
              current ? 'border-slate-900 bg-slate-50' : 'border-slate-300 bg-white'
            }`}
            aria-current={current ? 'true' : undefined}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                <span className="num text-slate-600">{id}.</span> {sc.title}
              </h3>
              {guided && (
                <span className="shrink-0 rounded bg-slate-200/80 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                  {guidedStatus(state, id)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{sc.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                className={btn.primary}
                disabled={!simStore.canStart(id)}
                onClick={() => simStore.start(id)}
              >
                Start scenario {id}
              </button>
              {!current && canSelect && (
                <button type="button" className={btn.secondary} onClick={() => simStore.select(id)}>
                  Select {id}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
