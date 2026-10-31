import { useMemo } from 'react';
import * as THREE from 'three';
import { BRIDGE_ENTRY_X, BRIDGE_EXIT_X, BRIDGE_LENGTH, ROAD_END_X, ROAD_START_X } from '../sim/constants';
import { CapacitySign } from './CapacitySign';

const CONCRETE = '#cbd5e1';
const CONCRETE_DARK = '#94a3b8';
const ASPHALT = '#334155';
const BANK_TOP = '#e2e8f0';
const BANK_WALL = '#cbd5e1';
const WATER = '#38bdf8';
const RIVERBED = '#94a3b8';

const DECK_WIDTH = 4.4;
const ROAD_WIDTH = 3.2;
const DIORAMA_DEPTH = 9.4;
const VALLEY_FLOOR = -3.4;

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
        <meshStandardMaterial color={BANK_WALL} roughness={0.92} flatShading />
      </mesh>
      <mesh position={[cx, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, DIORAMA_DEPTH]} />
        <meshStandardMaterial color={BANK_TOP} roughness={0.9} />
      </mesh>
    </group>
  );
}

function ThresholdGate({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, ROAD_WIDTH]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      {[-DECK_WIDTH / 2 + 0.2, DECK_WIDTH / 2 - 0.2].map((z) => (
        <mesh key={z} position={[0, 0.42, z]} castShadow>
          <boxGeometry args={[0.16, 0.46, 0.16]} />
          <meshStandardMaterial color="#64748b" roughness={0.5} />
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
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0, 0.22]} rotation={[-Math.PI / 2, 0, 0.52]}>
        <planeGeometry args={[0.55, 0.09]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

export function Bridge({ capacityTons }: { capacityTons: number }) {
  const roadLength = ROAD_END_X - ROAD_START_X;
  const edgeLine = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff' }), []);
  const chevrons = [-18, -7, 0, 7, 18];

  return (
    <group>
      {/* Ground shadow receiver beneath the cross-section plinth */}
      <mesh position={[0, VALLEY_FLOOR - 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadLength + 12, DIORAMA_DEPTH + 10]} />
        <shadowMaterial opacity={0.2} />
      </mesh>

      {/* Cross-section plinth base */}
      <mesh position={[0, VALLEY_FLOOR - 0.1, 0]} receiveShadow>
        <boxGeometry args={[roadLength, 0.2, DIORAMA_DEPTH]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
      </mesh>

      <Embankment side={-1} />
      <Embankment side={1} />

      {/* Riverbed and calm water channel */}
      <mesh position={[0, VALLEY_FLOOR + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BRIDGE_LENGTH + 1.3, DIORAMA_DEPTH]} />
        <meshStandardMaterial color={RIVERBED} roughness={0.9} />
      </mesh>
      <mesh position={[0, VALLEY_FLOOR + 0.48, 0]} receiveShadow>
        <boxGeometry args={[BRIDGE_LENGTH + 1.3, 0.9, DIORAMA_DEPTH - 0.04]} />
        <meshStandardMaterial color={WATER} roughness={0.15} metalness={0.1} transparent opacity={0.88} />
      </mesh>

      {/* Abutment piers */}
      {[BRIDGE_ENTRY_X, BRIDGE_EXIT_X].map((x) => (
        <mesh key={x} position={[x, (VALLEY_FLOOR - 0.55) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.35, -VALLEY_FLOOR - 0.55, DECK_WIDTH + 0.7]} />
          <meshStandardMaterial color={CONCRETE_DARK} roughness={0.85} flatShading />
        </mesh>
      ))}

      {/* Main bridge deck girder slab */}
      <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[BRIDGE_LENGTH + 0.9, 0.6, DECK_WIDTH]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.8} flatShading />
      </mesh>

      {/* Single one-way asphalt lane */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[roadLength, 0.04, ROAD_WIDTH]} />
        <meshStandardMaterial color={ASPHALT} roughness={0.92} />
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

      {/* Bridge deck curbs and sleek low safety guardrails */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0, 0.12, s * (DECK_WIDTH / 2 - 0.2)]} castShadow receiveShadow>
            <boxGeometry args={[BRIDGE_LENGTH + 0.9, 0.24, 0.38]} />
            <meshStandardMaterial color={CONCRETE} roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.32, s * (DECK_WIDTH / 2 - 0.2)]} castShadow>
            <boxGeometry args={[BRIDGE_LENGTH + 0.9, 0.08, 0.08]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      ))}

      <CapacitySign capacityTons={capacityTons} position={[BRIDGE_ENTRY_X - 1.8, 0, -2.7]} rotationY={0.15} />
    </group>
  );
}
