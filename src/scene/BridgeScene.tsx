import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { VehicleEntity } from '../sim/types';
import { Bridge } from './Bridge';
import { Car } from './Car';

const TARGET = new THREE.Vector3(-1.0, -0.15, 0);
const VIEW_DIR = new THREE.Vector3(-0.32, 0.26, 1).normalize();
const FIT_HALF_WIDTH = 17.0;
const FIT_HALF_HEIGHT = 5.5;

function CameraRig({ resetSignal }: { resetSignal: number }) {
  const { camera, gl, size } = useThree();
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / Math.max(1, size.height)));
    const dist = Math.max(FIT_HALF_WIDTH / Math.tan(hFov / 2), FIT_HALF_HEIGHT / Math.tan(vFov / 2)) + 0.8;
    cam.position.copy(TARGET).addScaledVector(VIEW_DIR, dist);
    cam.lookAt(TARGET);
    controls.target.copy(TARGET);
    controls.minDistance = dist * 0.45;
    controls.maxDistance = dist * 1.6;
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
        <div role="alert" className="flex h-full items-center justify-center bg-slate-100 p-6 text-center">
          <div className="max-w-sm rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">Tampilan 3D WebGL tidak dapat dimuat</p>
            <p className="mt-1 text-xs text-slate-500">
              Aktifkan akselerasi perangkat keras pada browser untuk menampilkan jembatan 3D.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const BridgeScene = memo(function BridgeScene({
  vehicles,
  capacityTons,
  runId,
  resetSignal,
}: {
  vehicles: VehicleEntity[];
  capacityTons: number;
  runId: number;
  resetSignal: number;
}) {
  const [ready, setReady] = useState(false);

  return (
    <SceneErrorBoundary>
      <div className="relative h-full w-full overflow-hidden bg-slate-100">
        {!ready && (
          <div
            role="status"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-100 text-xs text-slate-500"
          >
            Menyiapkan model jembatan 3D...
          </div>
        )}
        <div className="absolute inset-0 overflow-hidden">
          <Canvas
            shadows="percentage"
            dpr={[1, 2]}
            camera={{ fov: 16, near: 0.5, far: 600 }}
            gl={{ antialias: true }}
            onCreated={({ scene }) => {
              scene.background = new THREE.Color('#f8fafc');
              setReady(true);
            }}
          >
            <hemisphereLight args={['#ffffff', '#cbd5e1', 1.25]} />
            <directionalLight
              position={[18, 30, 20]}
              intensity={2.1}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-28}
              shadow-camera-right={28}
              shadow-camera-top={14}
              shadow-camera-bottom={-14}
              shadow-camera-near={1}
              shadow-camera-far={100}
              shadow-bias={-0.0004}
            />
            <CameraRig resetSignal={resetSignal} />
            <group position={[0, -4, 0]}> 
              <Bridge capacityTons={capacityTons} />
              {vehicles.map((v) => (
                <Car key={`${runId}-${v.id}`} vehicleId={v.id} color={v.color} />
              ))}
            </group>
          </Canvas>
        </div>
      </div>
    </SceneErrorBoundary>
  );
});
