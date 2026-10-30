import { eventTimes } from '../sim/engine';
import { SCENARIOS } from '../sim/scenarios';
import type { PlaybackStatus, ScenarioId } from '../sim/types';
import { seconds, weightTonsText } from './format';

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
  const sc = SCENARIOS[scenarioId];
  const ticks = eventTimes(sc);
  const rows: [string, string][] = [
    ['Time', `${seconds(elapsedMs)} / ${seconds(sc.durationMs)}`],
    ['On bridge', `${occupants} ${occupants === 1 ? 'car' : 'cars'} (${weightTonsText(weight)})`],
  ];

  return (
    <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-lg border border-edge bg-white/95 px-3 py-2 text-xs shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-900">
          {scenarioId}. {sc.title}
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
      <div className="relative mt-2 h-1.5 rounded-full bg-slate-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-slate-900"
          style={{ width: `${Math.min(100, (elapsedMs / sc.durationMs) * 100)}%` }}
        />
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-load"
            style={{ left: `${(t / sc.durationMs) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
