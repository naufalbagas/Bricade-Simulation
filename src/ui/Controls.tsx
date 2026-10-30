import { SCENARIO_ORDER, SCENARIOS } from '../sim/scenarios';
import type { SimState } from '../sim/store';
import { simStore } from '../useSim';

const btnBase =
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-load disabled:pointer-events-none disabled:opacity-40';

export const btn = {
  primary: `${btnBase} bg-slate-900 text-white hover:bg-slate-700`,
  secondary: `${btnBase} border border-edge bg-white text-slate-900 hover:bg-slate-100`,
};

export function ScenarioList({ state }: { state: SimState }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-sm font-semibold text-slate-900">Scenarios</h2>

      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-3 lg:flex lg:flex-col">
        {SCENARIO_ORDER.map((id) => {
          const sc = SCENARIOS[id];
          const current = state.scenarioId === id;
          const activeRun = current && (state.status === 'running' || state.status === 'paused');
          const canStart = simStore.canStart(id);

          return (
            <article
              key={id}
              className={`flex flex-col justify-between gap-2.5 rounded-lg border p-3 transition-colors ${
                current ? 'border-slate-900 bg-white' : 'border-slate-300 bg-white'
              }`}
              aria-current={current ? 'true' : undefined}
            >
              <h3 className="text-sm leading-snug font-semibold text-slate-900">
                <span className="num mr-1 text-slate-600">{id}.</span>
                {sc.title}
              </h3>

              <button
                type="button"
                aria-label={`Start Scenario ${id}: ${sc.title}`}
                className={`${btn.primary} w-full`}
                disabled={!canStart}
                onClick={() => simStore.start(id)}
              >
                {activeRun ? (state.status === 'paused' ? 'Paused' : 'Running') : 'Start'}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function PlaybackControls({ state, onResetCamera }: { state: SimState; onResetCamera: () => void }) {
  const { status } = state;

  return (
    <div className="space-y-2 border-t border-slate-200 pt-3" aria-label="Playback controls">
      <div className="grid grid-cols-2 gap-2">
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
