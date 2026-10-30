import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ROAD_END_X, ROAD_START_X, VEHICLE_LENGTH } from '../sim/constants';
import { vehicleState } from '../sim/engine';
import type { VehicleSpec } from '../sim/types';
import { simStore } from '../useSim';

const HALF_LEN = VEHICLE_LENGTH / 2;
const WHEEL_R = 0.26;
const FADE = 2.0;

function makeChassisGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-HALF_LEN, 0.2);
  s.lineTo(HALF_LEN, 0.2);
  s.lineTo(HALF_LEN, 0.52);
  s.lineTo(0.52, 0.62);
  s.lineTo(0.22, 1.02);
  s.lineTo(-0.46, 1.02);
  s.lineTo(-0.76, 0.64);
  s.lineTo(-HALF_LEN, 0.56);
  s.closePath();

  const g = new THREE.ExtrudeGeometry(s, { depth: 1.22, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
  g.translate(0, 0, -0.61);
  g.computeVertexNormals();
  return g;
}

function makeSideGlassGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0.44, 0.65);
  s.lineTo(0.18, 0.96);
  s.lineTo(-0.42, 0.96);
  s.lineTo(-0.66, 0.66);
  s.closePath();

  const g = new THREE.ExtrudeGeometry(s, { depth: 1.29, bevelEnabled: false });
  g.translate(0, 0, -0.645);
  return g;
}

const geo = {
  chassis: makeChassisGeometry(),
  sideGlass: makeSideGlassGeometry(),
  windshield: new THREE.BoxGeometry(0.06, 0.38, 1.06),
  rearGlass: new THREE.BoxGeometry(0.06, 0.36, 1.06),
  bumper: new THREE.BoxGeometry(0.09, 0.14, 1.24),
  wheel: new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.22, 12),
  hub: new THREE.BoxGeometry(0.24, 0.24, 0.24),
  lamp: new THREE.BoxGeometry(0.05, 0.1, 0.24),
  centerPin: new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8),
  plate: new THREE.BoxGeometry(VEHICLE_LENGTH + 0.32, 0.02, 1.56),
};

const mat = {
  glass: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2, metalness: 0.45 }),
  bumper: new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.8 }),
  tire: new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.9, flatShading: true }),
  hub: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.4, metalness: 0.3 }),
  head: new THREE.MeshBasicMaterial({ color: '#fef3c7' }),
  tail: new THREE.MeshBasicMaterial({ color: '#dc2626' }),
  pinIdle: new THREE.MeshBasicMaterial({ color: '#64748b' }),
  pinActive: new THREE.MeshBasicMaterial({ color: '#1d5fd1' }),
  plate: new THREE.MeshBasicMaterial({ color: '#1d5fd1', transparent: true, opacity: 0.32, depthWrite: false }),
};

const WHEELS: [number, number][] = [
  [0.64, 0.58],
  [0.64, -0.58],
  [-0.64, 0.58],
  [-0.64, -0.58],
];

// Places the car directly from elapsed simulation time so motion is frame-rate independent.
export function Car({ spec }: { spec: VehicleSpec }) {
  const group = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const plate = useRef<THREE.Mesh>(null);
  const pin = useRef<THREE.Mesh>(null);
  const paint = useMemo(
    () => new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.42, metalness: 0.16, flatShading: true }),
    [spec.color],
  );
  useEffect(() => () => paint.dispose(), [paint]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const v = vehicleState(spec, simStore.liveElapsedMs());
    const fromStart = v.x - ROAD_START_X;
    const toEnd = ROAD_END_X - v.x;
    const visible = fromStart > 0 && toEnd > 0;
    g.visible = visible;
    if (!visible) return;

    const s = Math.min(1, fromStart / FADE, toEnd / FADE);
    g.scale.setScalar(s);
    g.position.x = v.x;

    const spin = -(v.x - ROAD_START_X) / WHEEL_R;
    wheels.current.forEach((w) => {
      if (w) w.rotation.z = spin;
    });
    if (plate.current) plate.current.visible = v.onBridge;
    if (pin.current) pin.current.material = v.onBridge ? mat.pinActive : mat.pinIdle;
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={plate} geometry={geo.plate} material={mat.plate} position={[0, 0.055, 0]} />
      <mesh geometry={geo.chassis} material={paint} castShadow />
      <mesh geometry={geo.sideGlass} material={mat.glass} />
      <mesh geometry={geo.windshield} material={mat.glass} position={[0.37, 0.82, 0]} rotation={[0, 0, 0.64]} />
      <mesh geometry={geo.rearGlass} material={mat.glass} position={[-0.61, 0.82, 0]} rotation={[0, 0, -0.66]} />
      <mesh geometry={geo.bumper} material={mat.bumper} position={[HALF_LEN + 0.02, 0.25, 0]} />
      <mesh geometry={geo.bumper} material={mat.bumper} position={[-HALF_LEN - 0.02, 0.27, 0]} />

      {/* Center reference marker at local x = 0 */}
      <mesh ref={pin} geometry={geo.centerPin} material={mat.pinIdle} position={[0, 1.11, 0]} />

      {[0.38, -0.38].map((z) => (
        <group key={z}>
          <mesh geometry={geo.lamp} material={mat.head} position={[HALF_LEN + 0.02, 0.43, z]} />
          <mesh geometry={geo.lamp} material={mat.tail} position={[-HALF_LEN - 0.02, 0.45, z]} />
        </group>
      ))}

      {WHEELS.map(([x, z], i) => (
        <group key={i} position={[x, WHEEL_R, z]} ref={(el) => void (wheels.current[i] = el)}>
          <mesh geometry={geo.wheel} material={mat.tire} rotation={[Math.PI / 2, 0, 0]} castShadow />
          <mesh geometry={geo.hub} material={mat.hub} />
        </group>
      ))}
    </group>
  );
}
