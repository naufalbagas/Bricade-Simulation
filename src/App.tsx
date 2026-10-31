import { useEffect, useState } from 'react';
import { BridgeScene } from './scene/BridgeScene';
import { FooterQualityBar3D } from './scene/CubeBars3D';
import { LeftBarControls } from './ui/Controls';
import { BridgePropertiesCard } from './ui/Panels';
import { simStore, useSimState } from './useSim';

export default function App() {
  const state = useSimState();
  const { snapshot } = state;
  const [cameraReset, setCameraReset] = useState(0);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) simStore.syncClock();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-100 text-slate-900 lg:h-dvh lg:overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Bridge Stress Simulation</h1>
          <span className="num rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
            Kapasitas Maksimum: {snapshot.capacityTons} Ton
          </span>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[316px_minmax(0,1fr)]">
        {/* Right Column: Rotatable 3D Bridge Stage + Properties Jembatan + Non-Rotatable 3D Footer Kualitas Jembatan */}
        <div className="flex min-w-0 flex-col lg:col-start-2 lg:row-start-1 lg:min-h-0">
          <section
            className="relative flex min-w-0 flex-col bg-slate-100 lg:block lg:h-auto lg:min-h-0 lg:flex-1"
            aria-label="Viewport simulasi 3D jembatan dan properties jembatan"
          >
            <div className="h-[290px] w-full overflow-hidden sm:h-[360px] lg:h-full">
              <BridgeScene
                vehicles={snapshot.vehicles}
                capacityTons={snapshot.capacityTons}
                runId={state.runId}
                resetSignal={cameraReset}
              />
            </div>
            <BridgePropertiesCard
              capacityTons={snapshot.capacityTons}
              minQuality={snapshot.minQuality}
            />
          </section>

          <FooterQualityBar3D
            quality={snapshot.quality}
            minQuality={snapshot.minQuality}
            events={snapshot.events}
            runId={state.runId}
          />
        </div>

        {/* Full-Height Left Bar: Extends All the Way to Bottom (Footer Never Overlaps Left Bar) */}
        <aside
          className="flex min-w-0 flex-col border-t border-slate-200 bg-white p-4 pb-5 shadow-sm lg:col-start-1 lg:row-start-1 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-t-0 lg:pb-4"
          aria-label="Panel input kendaraan, indikator 3D stress bar statis, dan reset"
        >
          <LeftBarControls
            stressCurrent={snapshot.stressCurrent}
            stressPrevious={snapshot.stressPrevious}
            capacityTons={snapshot.capacityTons}
            runId={state.runId}
            onResetCamera={() => setCameraReset((c) => c + 1)}
          />
        </aside>
      </main>
    </div>
  );
}
