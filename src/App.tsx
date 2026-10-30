import { useEffect, useState } from 'react';
import { BridgeScene } from './scene/BridgeScene';
import { ModeToggle, PlaybackControls, ScenarioList } from './ui/Controls';
import { HealthBar } from './ui/HealthBar';
import { ModelNotes, SceneReadout, Timeline, TransitionLog } from './ui/Panels';
import { StressBars } from './ui/StressBars';
import { simStore, useSimState } from './useSim';

export default function App() {
  const state = useSimState();
  const { snapshot } = state;
  const [cameraReset, setCameraReset] = useState(0);

  useEffect(() => {
    // Pause when the tab hides so wall-clock delta never jumps across backgrounded frames.
    const onVisibility = () => {
      if (document.hidden) simStore.pause();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target instanceof Element && e.target.closest('button, input, summary'))) return;
      const s = simStore.getState().status;
      if (s === 'running') simStore.pause();
      else if (s === 'paused') simStore.resume();
      else return;
      e.preventDefault();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-white lg:h-dvh lg:overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 lg:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Bridge Stress Simulation</h1>
          <span className="rounded border border-edge bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-800">
            Kapasitas Maksimum: 10 Ton
          </span>
          <p className="w-full text-xs text-slate-600 sm:w-auto">
            Educational 3D vehicle-overlap simulation, not a structural engineering analysis tool.
          </p>
        </div>
        <ModeToggle mode={state.mode} />
      </header>

      <main className="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_264px] lg:min-h-0 lg:grid-cols-[356px_minmax(0,1fr)_272px]">
        {/* Scene: non-interactive tab-wise so DOM focus order stays strictly linear across breakpoints */}
        <section
          className="relative h-[38dvh] min-h-[250px] border-b border-slate-200 md:col-start-1 md:row-start-1 md:h-[46dvh] md:min-h-[340px] lg:col-start-2 lg:row-start-1 lg:h-auto lg:border-b-0"
          aria-label="3D bridge simulation scene"
        >
          <BridgeScene scenarioId={state.scenarioId} runId={state.runId} resetSignal={cameraReset} />
          <SceneReadout
            scenarioId={state.scenarioId}
            status={state.status}
            elapsedMs={state.elapsedMs}
            occupants={snapshot.occupantCount}
            weight={snapshot.totalWeightTons}
          />
          <Timeline scenarioId={state.scenarioId} elapsedMs={state.elapsedMs} />
        </section>

        {/* Monitoring: vertical Stress Load & Stress Max above bottom-right horizontal Bridge Health */}
        <aside
          className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-white p-4 md:col-start-2 md:row-start-1 md:border-l lg:col-start-3 lg:row-start-1 lg:min-h-0 lg:border-b-0"
          aria-label="Bridge stress and health indicators"
        >
          <div className="flex h-60 md:h-auto md:min-h-0 md:flex-1">
            <StressBars load={snapshot.stressLoad} max={snapshot.stressMax} />
          </div>
          <div className="border-t border-slate-200 pt-3">
            <HealthBar health={snapshot.health} startHealth={state.carryIn.health} />
          </div>
        </aside>

        {/* Controls, Scenarios, and Transition Log */}
        <aside
          className="grid grid-cols-1 gap-4 p-4 md:col-span-2 md:grid-cols-2 md:items-start lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-0 lg:flex-col lg:items-stretch lg:overflow-y-auto lg:border-r lg:border-slate-200"
          aria-label="Scenario selection and playback controls"
        >
          <div className="flex flex-col gap-4">
            <PlaybackControls state={state} onResetCamera={() => setCameraReset((c) => c + 1)} />
            <ScenarioList state={state} />
          </div>
          <div className="flex flex-col gap-4">
            <TransitionLog transitions={snapshot.transitions} />
            <ModelNotes />
          </div>
        </aside>
      </main>
    </div>
  );
}
