import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { MAX_CAPACITY_TONS } from '../sim/constants';
import type { LoadTransition } from '../sim/types';
import { pct, tons } from '../ui/format';
import { WorldAnchor } from './WorldAnchor';

export const STRESS_LOAD_X = 27.4;
export const STRESS_MAX_X = 36.0;
export const STRESS_BASE_Y = -3.16;
export const STRESS_COL_H = 8.4;
export const STRESS_COL_W = 2.4;

export const HEALTH_POS: [number, number, number] = [0, -7.6, 1.2];
export const HEALTH_LEN = 22.0;
export const HEALTH_H = 1.34;
export const HEALTH_D = 1.74;

function rectLoopGeometry(w: number, d: number, axis: 'y' | 'x'): THREE.BufferGeometry {
  const hw = w / 2;
  const hd = d / 2;
  const pts =
    axis === 'y'
      ? [
          new THREE.Vector3(-hw, 0, -hd),
          new THREE.Vector3(hw, 0, -hd),
          new THREE.Vector3(hw, 0, hd),
          new THREE.Vector3(-hw, 0, hd),
        ]
      : [
          new THREE.Vector3(0, -hw, -hd),
          new THREE.Vector3(0, hw, -hd),
          new THREE.Vector3(0, hw, hd),
          new THREE.Vector3(0, -hw, hd),
        ];
  const positions: number[] = [];
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

const verticalFillGeo = (() => {
  const g = new THREE.BoxGeometry(STRESS_COL_W - 0.18, 1, STRESS_COL_W - 0.18);
  g.translate(0, 0.5, 0);
  return g;
})();

const verticalFillEdges = new THREE.EdgesGeometry(verticalFillGeo);

const verticalCageGeo = new THREE.BoxGeometry(STRESS_COL_W + 0.06, STRESS_COL_H, STRESS_COL_W + 0.06);
const verticalCageEdges = new THREE.EdgesGeometry(verticalCageGeo);
const verticalTickLoop = rectLoopGeometry(STRESS_COL_W + 0.08, STRESS_COL_W + 0.08, 'y');
const peakRingLoop = rectLoopGeometry(STRESS_COL_W + 0.24, STRESS_COL_W + 0.24, 'y');

const horizontalFillGeo = (() => {
  const g = new THREE.BoxGeometry(1, HEALTH_H - 0.14, HEALTH_D - 0.14);
  g.translate(0.5, 0, 0);
  return g;
})();

const horizontalFillEdges = new THREE.EdgesGeometry(horizontalFillGeo);

const horizontalCageGeo = new THREE.BoxGeometry(HEALTH_LEN + 0.14, HEALTH_H + 0.08, HEALTH_D + 0.08);
const horizontalCageEdges = new THREE.EdgesGeometry(horizontalCageGeo);
const horizontalTickLoop = rectLoopGeometry(HEALTH_H + 0.1, HEALTH_D + 0.1, 'x');

const TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const sharedLineMat = {
  cage: new THREE.LineBasicMaterial({ color: '#64748b' }),
  tickMinor: new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.7 }),
  tickMid: new THREE.LineBasicMaterial({ color: '#334155' }),
  loadEdge: new THREE.LineBasicMaterial({ color: '#173f8a' }),
  maxEdge: new THREE.LineBasicMaterial({ color: '#8a3400' }),
  peakRing: new THREE.LineBasicMaterial({ color: '#d95b00' }),
};

function VerticalCubeColumn({
  x,
  value,
  fillColor,
  edgeMat,
  peakMarker,
  runId,
}: {
  x: number;
  value: number;
  fillColor: string;
  edgeMat: THREE.LineBasicMaterial;
  peakMarker?: number;
  runId: number;
}) {
  const fillGroup = useRef<THREE.Group>(null);
  const peakLine = useRef<THREE.LineSegments>(null);
  const currentRef = useRef(Math.min(1, Math.max(0, value)));
  const peakRef = useRef(Math.min(1, Math.max(0, peakMarker ?? 0)));
  const lastRunRef = useRef(runId);

  const fillMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: fillColor, roughness: 0.36, metalness: 0.1, flatShading: true }),
    [fillColor],
  );
  useEffect(() => () => fillMat.dispose(), [fillMat]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = Math.min(1, Math.max(0, value));
    if (lastRunRef.current !== runId && target === 0) {
      currentRef.current = 0;
      peakRef.current = 0;
      lastRunRef.current = runId;
    } else {
      lastRunRef.current = runId;
      currentRef.current = THREE.MathUtils.damp(currentRef.current, target, 15, dt);
    }

    if (fillGroup.current) {
      const h = Math.max(0.05, currentRef.current * STRESS_COL_H);
      fillGroup.current.scale.y = h;
    }

    if (peakLine.current) {
      const pTarget = Math.min(1, Math.max(0, peakMarker ?? 0));
      peakRef.current = THREE.MathUtils.damp(peakRef.current, pTarget, 15, dt);
      peakLine.current.visible = pTarget > target + 0.005;
      peakLine.current.position.y = STRESS_BASE_Y + peakRef.current * STRESS_COL_H;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      {/* Pedestal block */}
      <mesh position={[0, STRESS_BASE_Y - 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[STRESS_COL_W + 0.68, 0.24, STRESS_COL_W + 0.68]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.78} flatShading />
      </mesh>

      {/* Outer 10-ton capacity 3D cube-bar chamber */}
      <group position={[0, STRESS_BASE_Y + STRESS_COL_H / 2, 0]}>
        <mesh geometry={verticalCageGeo}>
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.34} roughness={0.9} depthWrite={false} />
        </mesh>
        <lineSegments geometry={verticalCageEdges} material={sharedLineMat.cage} />
      </group>

      {/* 1-ton (10%) 3D cube calibration loops */}
      {TICKS.map((t) => (
        <lineSegments
          key={t}
          geometry={verticalTickLoop}
          material={t === 5 ? sharedLineMat.tickMid : sharedLineMat.tickMinor}
          position={[0, STRESS_BASE_Y + (t / 10) * STRESS_COL_H, 0]}
        />
      ))}

      {/* Growing 3D volumetric cube-bar fill */}
      <group ref={fillGroup} position={[0, STRESS_BASE_Y, 0]} scale={[1, 0.05, 1]}>
        <mesh geometry={verticalFillGeo} material={fillMat} castShadow receiveShadow />
        <lineSegments geometry={verticalFillEdges} material={edgeMat} />
      </group>

      {/* Subtle wireframe watermark ring on Stress Load when below peak */}
      {peakMarker !== undefined && (
        <lineSegments
          ref={peakLine}
          geometry={peakRingLoop}
          material={sharedLineMat.peakRing}
          position={[0, STRESS_BASE_Y, 0]}
          visible={false}
        />
      )}
    </group>
  );
}

export function StressCubeBars3D({
  load,
  max,
  runId,
}: {
  load: number;
  max: number;
  runId: number;
}) {
  const centerX = (STRESS_LOAD_X + STRESS_MAX_X) / 2;
  const spanW = STRESS_MAX_X - STRESS_LOAD_X + STRESS_COL_W + 2.4;

  return (
    <group>
      {/* Subtle ground shadow catcher beneath the right-side stress gauge station */}
      <mesh position={[centerX, -3.62, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[spanW + 4, 8.5]} />
        <shadowMaterial opacity={0.09} />
      </mesh>

      {/* Shared cross-section plinth matching bridge datum */}
      <mesh position={[centerX, -3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[spanW, 0.22, 4.6]} />
        <meshStandardMaterial color="#8f98a3" roughness={0.9} flatShading />
      </mesh>

      <VerticalCubeColumn
        x={STRESS_LOAD_X}
        value={load}
        fillColor="#1d5fd1"
        edgeMat={sharedLineMat.loadEdge}
        peakMarker={max}
        runId={runId}
      />

      <VerticalCubeColumn
        x={STRESS_MAX_X}
        value={max}
        fillColor="#d95b00"
        edgeMat={sharedLineMat.maxEdge}
        runId={runId}
      />
    </group>
  );
}

function healthColors(h: number) {
  if (h >= 70) return { mesh: '#059669', edge: '#064e3b', ink: 'text-[#047857]' };
  if (h >= 40) return { mesh: '#d97706', edge: '#78350f', ink: 'text-[#b45309]' };
  return { mesh: '#dc2626', edge: '#7f1d1d', ink: 'text-[#b91c1c]' };
}

export function HealthCubeBar3D({ health, runId }: { health: number; runId: number }) {
  const clamped = Math.min(100, Math.max(0, health));
  const palette = healthColors(clamped);

  const fillGroup = useRef<THREE.Group>(null);
  const lossGroup = useRef<THREE.Group>(null);
  const displayedRef = useRef(clamped);
  const trailRef = useRef(clamped);
  const lastRunRef = useRef(runId);

  const fillMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.mesh, roughness: 0.36, metalness: 0.1, flatShading: true }),
    [palette.mesh],
  );
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: palette.edge }), [palette.edge]);
  const lossMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.35, flatShading: true }),
    [],
  );

  useEffect(() => () => fillMat.dispose(), [fillMat]);
  useEffect(() => () => edgeMat.dispose(), [edgeMat]);
  useEffect(() => () => lossMat.dispose(), [lossMat]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (lastRunRef.current !== runId || clamped > displayedRef.current + 0.01) {
      displayedRef.current = clamped;
      trailRef.current = clamped;
      lastRunRef.current = runId;
    } else {
      lastRunRef.current = runId;
      displayedRef.current = THREE.MathUtils.damp(displayedRef.current, clamped, 16, dt);
      trailRef.current = THREE.MathUtils.damp(trailRef.current, clamped, 3.2, dt);
    }

    const fillLen = Math.max(0.04, (displayedRef.current / 100) * HEALTH_LEN);
    if (fillGroup.current) {
      fillGroup.current.scale.x = fillLen;
    }

    if (lossGroup.current) {
      const trailLen = (trailRef.current / 100) * HEALTH_LEN;
      const diff = trailLen - fillLen;
      if (diff > 0.025) {
        lossGroup.current.visible = true;
        lossGroup.current.position.x = -HEALTH_LEN / 2 + fillLen;
        lossGroup.current.scale.x = diff;
      } else {
        lossGroup.current.visible = false;
      }
    }
  });

  return (
    <group position={HEALTH_POS}>
      {/* Subtle ground shadow catcher beneath horizontal health bar */}
      <mesh position={[0, -HEALTH_H / 2 - 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HEALTH_LEN + 3.5, HEALTH_D + 2.6]} />
        <shadowMaterial opacity={0.08} />
      </mesh>

      {/* Low-poly support rail and cradle piers */}
      <mesh position={[0, -HEALTH_H / 2 - 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[HEALTH_LEN + 0.9, 0.16, HEALTH_D + 0.45]} />
        <meshStandardMaterial color="#8f98a3" roughness={0.9} flatShading />
      </mesh>
      {[-8.2, 0, 8.2].map((sx) => (
        <mesh key={sx} position={[sx, -HEALTH_H / 2 - 0.11, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.16, HEALTH_D + 0.28]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} flatShading />
        </mesh>
      ))}

      {/* Outer 100% capacity horizontal 3D cube-bar casing */}
      <mesh geometry={horizontalCageGeo}>
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.38} roughness={0.9} depthWrite={false} />
      </mesh>
      <lineSegments geometry={horizontalCageEdges} material={sharedLineMat.cage} />

      {/* 10% horizontal calibration loops */}
      {TICKS.map((t) => (
        <lineSegments
          key={t}
          geometry={horizontalTickLoop}
          material={t === 5 ? sharedLineMat.tickMid : sharedLineMat.tickMinor}
          position={[-HEALTH_LEN / 2 + (t / 10) * HEALTH_LEN, 0, 0]}
        />
      ))}

      {/* Active horizontal 3D health cube-bar fill */}
      <group ref={fillGroup} position={[-HEALTH_LEN / 2, 0, 0]} scale={[HEALTH_LEN, 1, 1]}>
        <mesh geometry={horizontalFillGeo} material={fillMat} castShadow receiveShadow />
        <lineSegments geometry={horizontalFillEdges} material={edgeMat} />
      </group>

      {/* Transient 3D crimson damage slice when health drops */}
      <group ref={lossGroup} position={[HEALTH_LEN / 2, 0, 0]} scale={[0.01, 0.98, 0.98]} visible={false}>
        <mesh geometry={horizontalFillGeo} material={lossMat} />
      </group>
    </group>
  );
}

interface HealthPopoverItem {
  key: string;
  loss: number;
  healthAfter: number;
}

export function CubeBarsHudOverlay({
  load,
  max,
  health,
  carryInHealth,
  transitions,
  runId,
}: {
  load: number;
  max: number;
  health: number;
  carryInHealth: number;
  transitions: LoadTransition[];
  runId: number;
}) {
  const [popovers, setPopovers] = useState<HealthPopoverItem[]>([]);
  const seenRef = useRef<{ runId: number; count: number }>({ runId, count: transitions.length });
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (seenRef.current.runId !== runId) {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      seenRef.current = { runId, count: 0 };
      setPopovers([]);
    }

    if (transitions.length > seenRef.current.count) {
      const startIdx = seenRef.current.count;
      const newItems: HealthPopoverItem[] = [];
      for (let i = startIdx; i < transitions.length; i++) {
        const prevHealth = i === 0 ? carryInHealth : transitions[i - 1].healthAfter;
        const actualLoss = Math.round((prevHealth - transitions[i].healthAfter) * 1e6) / 1e6;
        if (actualLoss > 0) {
          newItems.push({
            key: `${runId}-${transitions[i].timeMs}`,
            loss: actualLoss,
            healthAfter: transitions[i].healthAfter,
          });
        }
      }
      seenRef.current.count = transitions.length;

      if (newItems.length > 0) {
        setPopovers((prev) => [...prev.slice(-3), ...newItems]);
        newItems.forEach((item) => {
          const tid = window.setTimeout(() => {
            setPopovers((prev) => prev.filter((p) => p.key !== item.key));
          }, 1450);
          timersRef.current.push(tid);
        });
      }
    }
  }, [transitions, carryInHealth, runId]);

  const clampedHealth = Math.min(100, Math.max(0, health));
  const hTone = healthColors(clampedHealth);

  return (
    <>
      {/* Stress Load 3D Cube-Bar Title & Live Value */}
      <WorldAnchor position={[STRESS_LOAD_X, STRESS_BASE_Y + STRESS_COL_H + 0.35, 0]} align="above">
        <div className="rounded bg-white/92 px-1.5 py-0.5 text-center">
          <div className="whitespace-nowrap text-xs font-bold leading-tight text-slate-900">Stress Load</div>
          <div className="num text-[10px] font-medium leading-tight text-slate-600">Max 10t</div>
        </div>
      </WorldAnchor>

      <WorldAnchor position={[STRESS_LOAD_X, -3.72, 0]} align="below">
        <div
          role="meter"
          aria-label={`Stress Load: ${pct(load)} (${tons(load)} of ${MAX_CAPACITY_TONS} tons)`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(load * 100)}
          className="rounded-md border border-slate-300 bg-white/95 px-2.5 py-1 text-center shadow-xs"
        >
          <div className="num text-base font-extrabold leading-none text-load">{pct(load)}</div>
          <div className="num mt-0.5 whitespace-nowrap text-[11px] font-semibold text-slate-700">{tons(load)}</div>
        </div>
      </WorldAnchor>

      {/* Stress Max 3D Cube-Bar Title & Live Value */}
      <WorldAnchor position={[STRESS_MAX_X, STRESS_BASE_Y + STRESS_COL_H + 0.35, 0]} align="above">
        <div className="rounded bg-white/92 px-1.5 py-0.5 text-center">
          <div className="whitespace-nowrap text-xs font-bold leading-tight text-slate-900">Stress Max</div>
          <div className="num text-[10px] font-medium leading-tight text-slate-600">Max 10t</div>
        </div>
      </WorldAnchor>

      <WorldAnchor position={[STRESS_MAX_X, -3.72, 0]} align="below">
        <div
          role="meter"
          aria-label={`Stress Max: ${pct(max)} (${tons(max)} of ${MAX_CAPACITY_TONS} tons)`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(max * 100)}
          className="rounded-md border border-slate-300 bg-white/95 px-2.5 py-1 text-center shadow-xs"
        >
          <div className="num text-base font-extrabold leading-none text-peak-ink">{pct(max)}</div>
          <div className="num mt-0.5 whitespace-nowrap text-[11px] font-semibold text-slate-700">{tons(max)}</div>
        </div>
      </WorldAnchor>

      {/* Bridge Health 3D Horizontal Cube-Bar Readout (Centered Below Bridge) */}
      <WorldAnchor position={[0, HEALTH_POS[1] - HEALTH_H / 2 - 0.5, HEALTH_POS[2]]} align="below">
        <div
          role="meter"
          aria-label={`Bridge Health: ${clampedHealth.toFixed(2)}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Number(clampedHealth.toFixed(2))}
          className="inline-flex items-baseline gap-2 rounded-md border border-slate-300 bg-white/95 px-3 py-1 shadow-xs"
        >
          <span className="whitespace-nowrap text-xs font-bold text-slate-900 sm:text-sm">Bridge Health</span>
          <span className={`num whitespace-nowrap text-sm font-extrabold sm:text-base ${hTone.ink}`}>
            {clampedHealth.toFixed(2)}%
          </span>
        </div>
      </WorldAnchor>

      {/* Animated Pop-Over Badges on Bridge Health Reduction */}
      {popovers.map((item) => {
        const rawTipX = -HEALTH_LEN / 2 + (item.healthAfter / 100) * HEALTH_LEN;
        const anchorX = Math.max(-8.5, Math.min(9.5, rawTipX));
        const heavy = item.loss >= 1;
        return (
          <WorldAnchor
            key={item.key}
            position={[anchorX, HEALTH_POS[1] + HEALTH_H / 2 + 0.16, HEALTH_POS[2]]}
            align="above"
          >
            <div role="status" aria-live="polite" className="health-popover flex flex-col items-center">
              <div
                className={`num whitespace-nowrap rounded-md border border-[#7f1d1d] font-extrabold text-white shadow-sm ${
                  heavy ? 'bg-[#991b1b] px-2.5 py-1 text-xs sm:text-sm' : 'bg-[#b91c1c] px-2 py-0.5 text-xs'
                }`}
              >
                {'\u2212'}
                {item.loss.toFixed(2)}%
              </div>
              <div
                className={`h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent ${
                  heavy ? 'border-t-[#991b1b]' : 'border-t-[#b91c1c]'
                }`}
              />
            </div>
          </WorldAnchor>
        );
      })}
    </>
  );
}
