import { useEffect, useState } from 'react';
import { BridgeScene } from './scene/BridgeScene';
import { PlaybackControls, ScenarioList } from './ui/Controls';
import { SceneReadout } from './ui/Panels';
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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Bridge Stress Simulation</h1>
          <span className="rounded border border-edge bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-800">
            Kapasitas Maksimum: 10 Ton
          </span>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[296px_minmax(0,1fr)]">
        {/* Unified 3D Viewport: Bridge, Cars, Right-Side 3D Stress Cube-Bars, Bottom-Center 3D Bridge Health Cube-Bar */}
        <section
          className="relative h-[54dvh] min-h-[340px] border-b border-slate-200 lg:col-start-2 lg:row-start-1 lg:h-auto lg:border-b-0"
          aria-label="3D bridge, stress cube-bars, and bridge health simulation scene"
        >
          <BridgeScene
            scenarioId={state.scenarioId}
            runId={state.runId}
            resetSignal={cameraReset}
            stressLoad={snapshot.stressLoad}
            stressMax={snapshot.stressMax}
            health={snapshot.health}
            carryInHealth={state.carryIn.health}
            transitions={snapshot.transitions}
          />
          <SceneReadout
            scenarioId={state.scenarioId}
            status={state.status}
            elapsedMs={state.elapsedMs}
            occupants={snapshot.occupantCount}
            weight={snapshot.totalWeightTons}
          />
        </section>

        {/* Left Bar: Scenario titles + Start buttons & Playback controls */}
        <aside
          className="flex flex-col gap-4 bg-slate-50/70 p-4 lg:col-start-1 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-slate-200"
          aria-label="Scenario selection and playback controls"
        >
          <ScenarioList state={state} />
          <PlaybackControls state={state} onResetCamera={() => setCameraReset((c) => c + 1)} />
        </aside>
      </main>
    </div>
  );
}
