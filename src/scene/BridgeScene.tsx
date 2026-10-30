import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SCENARIOS } from '../sim/scenarios';
import type { LoadTransition, ScenarioId } from '../sim/types';
import { Bridge } from './Bridge';
import { Car } from './Car';
import { CubeBarsHudOverlay, HealthCubeBar3D, StressCubeBars3D } from './CubeBars3D';
import { AnchorOverlayProvider, AnchorProjector, useCreateAnchorRegistry } from './WorldAnchor';

const TARGET = new THREE.Vector3(7.6, -1.35, 0);
const VIEW_DIR = new THREE.Vector3(-0.18, 0.36, 1).normalize();
const FIT_HALF_WIDTH = 33.8;
const FIT_HALF_HEIGHT = 11.4;

function CameraRig({ resetSignal }: { resetSignal: number }) {
  const { camera, gl, size } = useThree();
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / Math.max(1, size.height)));
    const dist = Math.max(FIT_HALF_WIDTH / Math.tan(hFov / 2), FIT_HALF_HEIGHT / Math.tan(vFov / 2)) + 3.0;
    cam.position.copy(TARGET).addScaledVector(VIEW_DIR, dist);
    cam.lookAt(TARGET);
    controls.target.copy(TARGET);
    controls.minDistance = dist * 0.5;
    controls.maxDistance = dist * 1.45;
    controls.update();
  }, [camera, controls, size.width, size.height, resetSignal]);

  useEffect(() => {
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minPolarAngle = 0.4;
    controls.maxPolarAngle = 1.42;
    controls.minAzimuthAngle = -0.85;
    controls.maxAzimuthAngle = 0.85;
    return () => controls.dispose();
  }, [controls]);

  useFrame(() => controls.update());
  return null;
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="flex h-full items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-sm rounded-lg border border-[#738093] bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">3D WebGL view could not start</p>
            <p className="mt-1 text-xs text-slate-600">
              Enable hardware acceleration in your browser to view the 3D bridge and gauges.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const BridgeScene = memo(function BridgeScene({
  scenarioId,
  runId,
  resetSignal,
  stressLoad,
  stressMax,
  health,
  carryInHealth,
  transitions,
}: {
  scenarioId: ScenarioId;
  runId: number;
  resetSignal: number;
  stressLoad: number;
  stressMax: number;
  health: number;
  carryInHealth: number;
  transitions: LoadTransition[];
}) {
  const [ready, setReady] = useState(false);
  const registry = useCreateAnchorRegistry();
  const vehicles = SCENARIOS[scenarioId].vehicles;

  return (
    <SceneErrorBoundary>
      <AnchorOverlayProvider registry={registry}>
        <div className="relative h-full w-full overflow-hidden bg-white">
          {!ready && (
            <div
              role="status"
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white text-xs text-slate-600"
            >
              Preparing 3D bridge model...
            </div>
          )}
          <Canvas
            shadows="percentage"
            dpr={[1, 2]}
            camera={{ fov: 28, near: 0.5, far: 450 }}
            gl={{ antialias: true }}
            onCreated={({ scene }) => {
              scene.background = new THREE.Color('#ffffff');
              setReady(true);
            }}
          >
            <hemisphereLight args={['#ffffff', '#dad5cc', 1.65]} />
            <directionalLight
              position={[18, 30, 20]}
              intensity={2.15}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-30}
              shadow-camera-right={44}
              shadow-camera-top={16}
              shadow-camera-bottom={-18}
              shadow-camera-near={1}
              shadow-camera-far={110}
              shadow-bias={-0.0004}
            />
            <CameraRig resetSignal={resetSignal} />
            <AnchorProjector registry={registry} />
            <Bridge />
            <StressCubeBars3D load={stressLoad} max={stressMax} runId={runId} />
            <HealthCubeBar3D health={health} runId={runId} />
            {vehicles.map((v) => (
              <Car key={`${runId}-${v.id}`} spec={v} />
            ))}
          </Canvas>

          {ready && (
            <CubeBarsHudOverlay
              load={stressLoad}
              max={stressMax}
              health={health}
              carryInHealth={carryInHealth}
              transitions={transitions}
              runId={runId}
            />
          )}
        </div>
      </AnchorOverlayProvider>
    </SceneErrorBoundary>
  );
});
