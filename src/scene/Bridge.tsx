import { useMemo } from 'react';
import * as THREE from 'three';
import { BRIDGE_ENTRY_X, BRIDGE_EXIT_X, BRIDGE_LENGTH, ROAD_END_X, ROAD_START_X } from '../sim/constants';
import { CapacitySign } from './CapacitySign';

const STEEL = '#3b4452';
const CONCRETE = '#aeb5be';
const CONCRETE_DARK = '#8f98a3';
const ASPHALT = '#323840';
const BANK_TOP = '#ece9e2';
const BANK_WALL = '#d8d3c8';
const WATER = '#b8d4e8';
const RIVERBED = '#ded8cc';

const DECK_WIDTH = 4.4;
const ROAD_WIDTH = 3.2;
const ARCH_Z = 2.02;
const ARCH_HEIGHT = 5.0;
const ARCH_SEGMENTS = 16;
const DIORAMA_DEPTH = 9.4;
const VALLEY_FLOOR = -3.4;

const archY = (x: number) => ARCH_HEIGHT * (1 - (x / (BRIDGE_LENGTH / 2)) ** 2);

function Beam({
  from,
  to,
  z,
  size = 0.34,
}: {
  from: [number, number];
  to: [number, number];
  z: number;
  size?: number;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  return (
    <mesh position={[(x1 + x2) / 2, (y1 + y2) / 2, z]} rotation={[0, 0, angle]} castShadow>
      <boxGeometry args={[len + 0.03, size, size]} />
      <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.3} flatShading />
    </mesh>
  );
}

function Arch({ z }: { z: number }) {
  const points = useMemo(() => {
    const half = BRIDGE_LENGTH / 2;
    return Array.from({ length: ARCH_SEGMENTS + 1 }, (_, i) => {
      const x = -half + (i / ARCH_SEGMENTS) * BRIDGE_LENGTH;
      return [x, archY(x) + 0.16] as [number, number];
    });
  }, []);
  return (
    <group>
      {points.slice(0, -1).map((p, i) => (
        <Beam key={i} from={p} to={points[i + 1]} z={z} />
      ))}
    </group>
  );
}

function Hangers() {
  const xs = [-10.4, -7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8, 10.4];
  return (
    <group>
      {xs.flatMap((x) =>
        [-ARCH_Z, ARCH_Z].map((z) => {
          const top = archY(x) + 0.12;
          return (
            <mesh key={`${x}:${z}`} position={[x, top / 2 + 0.08, z]} castShadow>
              <boxGeometry args={[0.07, top - 0.08, 0.07]} />
              <meshStandardMaterial color={STEEL} roughness={0.45} metalness={0.35} />
            </mesh>
          );
        }),
      )}
      {[-5.2, 0, 5.2].map((x) => (
        <mesh key={x} position={[x, archY(x) + 0.16, 0]} castShadow>
          <boxGeometry args={[0.22, 0.22, ARCH_Z * 2]} />
          <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Embankment({ side }: { side: -1 | 1 }) {
  const inner = side < 0 ? BRIDGE_ENTRY_X - 0.65 : BRIDGE_EXIT_X + 0.65;
  const outer = side < 0 ? ROAD_START_X : ROAD_END_X;
  const width = Math.abs(outer - inner);
  const cx = (inner + outer) / 2;
  const h = -VALLEY_FLOOR;
  return (
    <group>
      <mesh position={[cx, -h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, h, DIORAMA_DEPTH]} />
        <meshStandardMaterial color={BANK_WALL} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[cx, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, DIORAMA_DEPTH]} />
        <meshStandardMaterial color={BANK_TOP} roughness={0.95} />
      </mesh>
    </group>
  );
}

function ThresholdGate({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, ROAD_WIDTH]} />
        <meshBasicMaterial color="#1d5fd1" />
      </mesh>
      {[-DECK_WIDTH / 2 + 0.2, DECK_WIDTH / 2 - 0.2].map((z) => (
        <mesh key={z} position={[0, 0.42, z]} castShadow>
          <boxGeometry args={[0.16, 0.46, 0.16]} />
          <meshStandardMaterial color="#1d5fd1" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function DirectionChevron({ x }: { x: number }) {
  return (
    <group position={[x, 0.044, 0]}>
      <mesh position={[0, 0, -0.22]} rotation={[-Math.PI / 2, 0, -0.52]}>
        <planeGeometry args={[0.55, 0.09]} />
        <meshBasicMaterial color="#cbd5e1" />
      </mesh>
      <mesh position={[0, 0, 0.22]} rotation={[-Math.PI / 2, 0, 0.52]}>
        <planeGeometry args={[0.55, 0.09]} />
        <meshBasicMaterial color="#cbd5e1" />
      </mesh>
    </group>
  );
}

export function Bridge() {
  const roadLength = ROAD_END_X - ROAD_START_X;
  const edgeLine = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f1f5f9' }), []);
  const chevrons = [-22, -17, -7, 0, 7, 17, 22];

  return (
    <group>
      {/* Subtle ground shadow catcher beneath the cross-section plinth */}
      <mesh position={[0, VALLEY_FLOOR - 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadLength + 12, DIORAMA_DEPTH + 10]} />
        <shadowMaterial opacity={0.09} />
      </mesh>

      {/* Cross-section plinth base */}
      <mesh position={[0, VALLEY_FLOOR - 0.1, 0]} receiveShadow>
        <boxGeometry args={[roadLength, 0.2, DIORAMA_DEPTH]} />
        <meshStandardMaterial color={CONCRETE_DARK} roughness={0.9} />
      </mesh>

      <Embankment side={-1} />
      <Embankment side={1} />

      {/* Riverbed and calm water channel */}
      <mesh position={[0, VALLEY_FLOOR + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BRIDGE_LENGTH + 1.3, DIORAMA_DEPTH]} />
        <meshStandardMaterial color={RIVERBED} roughness={1} />
      </mesh>
      <mesh position={[0, VALLEY_FLOOR + 0.48, 0]} receiveShadow>
        <boxGeometry args={[BRIDGE_LENGTH + 1.3, 0.9, DIORAMA_DEPTH - 0.04]} />
        <meshStandardMaterial color={WATER} roughness={0.28} metalness={0.05} transparent opacity={0.82} />
      </mesh>

      {/* Abutment piers */}
      {[BRIDGE_ENTRY_X, BRIDGE_EXIT_X].map((x) => (
        <mesh key={x} position={[x, (VALLEY_FLOOR - 0.55) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.35, -VALLEY_FLOOR - 0.55, DECK_WIDTH + 0.7]} />
          <meshStandardMaterial color={CONCRETE_DARK} roughness={0.88} flatShading />
        </mesh>
      ))}

      {/* Main bridge deck slab */}
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[BRIDGE_LENGTH + 0.9, 0.6, DECK_WIDTH]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.82} flatShading />
      </mesh>

      {/* Single one-way asphalt lane */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[roadLength, 0.04, ROAD_WIDTH]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.94} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[0, 0.043, s * (ROAD_WIDTH / 2 - 0.11)]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={edgeLine}
        >
          <planeGeometry args={[roadLength, 0.07]} />
        </mesh>
      ))}
      {chevrons.map((x) => (
        <DirectionChevron key={x} x={x} />
      ))}

      <ThresholdGate x={BRIDGE_ENTRY_X} />
      <ThresholdGate x={BRIDGE_EXIT_X} />

      {/* Span curbs and side guardrails */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0, 0.1, s * (DECK_WIDTH / 2 - 0.2)]} castShadow>
            <boxGeometry args={[BRIDGE_LENGTH + 0.9, 0.2, 0.4]} />
            <meshStandardMaterial color={CONCRETE} roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.76, s * ARCH_Z]} castShadow>
            <boxGeometry args={[BRIDGE_LENGTH, 0.07, 0.07]} />
            <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.3} />
          </mesh>
        </group>
      ))}

      <Arch z={-ARCH_Z} />
      <Arch z={ARCH_Z} />
      <Hangers />

      <CapacitySign position={[BRIDGE_ENTRY_X - 4.4, 0, -2.9]} rotationY={0.18} />
    </group>
  );
}
