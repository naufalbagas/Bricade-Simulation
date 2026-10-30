import { eventTimes } from '../sim/engine';
import { SCENARIOS } from '../sim/scenarios';
import type { LoadTransition, PlaybackStatus, ScenarioId } from '../sim/types';
import { pct, seconds, weightTonsText } from './format';

const STATUS_TEXT: Record<PlaybackStatus, string> = {
  idle: 'Ready',
  running: 'Running',
  paused: 'Paused',
  finished: 'Finished',
};

export function SceneReadout({
  scenarioId,
  status,
  elapsedMs,
  occupants,
  weight,
}: {
  scenarioId: ScenarioId;
  status: PlaybackStatus;
  elapsedMs: number;
  occupants: number;
  weight: number;
}) {
  const rows: [string, string][] = [
    ['Elapsed time', `${seconds(elapsedMs)} / ${seconds(SCENARIOS[scenarioId].durationMs)}`],
    ['Vehicles on bridge', `${occupants} ${occupants === 1 ? 'vehicle' : 'vehicles'}`],
    ['Current weight', weightTonsText(weight)],
  ];

  return (
    <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-lg border border-edge bg-white/95 px-3 py-2 text-xs shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-900">
          Scenario {scenarioId}: {SCENARIOS[scenarioId].title}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
            status === 'running'
              ? 'bg-load text-white'
              : status === 'paused'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-slate-200 text-slate-800'
          }`}
        >
          {STATUS_TEXT[status]}
        </span>
      </div>
      <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-600">{k}</dt>
            <dd className="num font-semibold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Timeline({ scenarioId, elapsedMs }: { scenarioId: ScenarioId; elapsedMs: number }) {
  const sc = SCENARIOS[scenarioId];
  const ticks = eventTimes(sc);
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-2.5 rounded-md bg-white/90 px-2.5 py-1.5">
      <div className="relative h-1.5 rounded-full bg-slate-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
          style={{ width: `${Math.min(100, (elapsedMs / sc.durationMs) * 100)}%` }}
        />
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-load"
            style={{ left: `${(t / sc.durationMs) * 100}%` }}
          />
        ))}
      </div>
      <div className="num mt-1 flex justify-between gap-2 text-[11px] text-slate-600">
        <span>0.00 s</span>
        <span className="truncate">Blue ticks mark entry and exit boundaries</span>
        <span>8.00 s</span>
      </div>
    </div>
  );
}

export function TransitionLog({ transitions }: { transitions: LoadTransition[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900">Stress Load Transitions</h2>
      <p className="text-[11px] text-slate-600">Recorded once per actual load change, never per animation frame.</p>
      {transitions.length === 0 ? (
        <p className="mt-2 rounded-md border border-dashed border-edge bg-slate-50 px-3 py-2 text-xs text-slate-600">
          No transitions recorded yet. Press Start to watch each vehicle entry and exit update load and health.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
          <table className="num w-full text-xs">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-2 py-1.5 font-semibold">Time</th>
                <th className="px-2 py-1.5 font-semibold">Transition</th>
                <th className="px-2 py-1.5 text-right font-semibold">Loss</th>
                <th className="px-2 py-1.5 text-right font-semibold">Health</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((t) => (
                <tr key={t.timeMs} className="border-t border-slate-200">
                  <td className="px-2 py-1">{seconds(t.timeMs)}</td>
                  <td className="px-2 py-1">
                    {pct(t.prev)} {'\u2192'} {pct(t.next)}
                  </td>
                  <td className={`px-2 py-1 text-right ${t.reduction > 0 ? 'font-semibold text-[#b91c1c]' : 'text-slate-600'}`}>
                    {t.reduction > 0 ? `\u2212${t.reduction.toFixed(2)}` : '0.00'}
                  </td>
                  <td className="px-2 py-1 text-right font-medium text-slate-900">{t.healthAfter.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ModelNotes() {
  const bands: [string, string][] = [
    ['Load increases, up to 20%', '0.00'],
    ['Load increases, > 20% to 38%', '0.30'],
    ['Load increases, > 38% to 43%', '0.50'],
    ['Load increases, > 43% to 62%', '2.00'],
    ['Load increases, > 62% to 70%', '4.80'],
    ['Load increases, > 70% to 100%', '16.50'],
    ['Any load decrease', '0.17'],
  ];
  return (
    <details className="rounded-lg border border-edge bg-white p-3 text-xs">
      <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-load">
        Simulation rules and custom damage model
      </summary>
      <div className="mt-2 space-y-2 leading-relaxed text-slate-700">
        <p>
          Each car weighs 1 ton and counts toward Stress Load while its center pin is between the two blue gate lines on the 10-ton
          bridge deck. Drag on the 3D scene to orbit or zoom; press Space to pause or resume.
        </p>
        <table className="num w-full">
          <tbody>
            {bands.map(([k, v]) => (
              <tr key={k} className="border-t border-slate-200">
                <td className="py-1">{k}</td>
                <td className="py-1 text-right font-semibold">{'\u2212'}{v} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-slate-600">
          Educational model only: this formula illustrates cumulative load wear and is not a real structural engineering calculation.
        </p>
      </div>
    </details>
  );
}
