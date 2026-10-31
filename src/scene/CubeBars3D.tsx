import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Component, memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import type { QualityReductionEvent } from '../sim/types';
import { pct, tons } from '../ui/format';
import { AnchorOverlayProvider, AnchorProjector, useCreateAnchorRegistry, WorldAnchor } from './WorldAnchor';

class Static3DErrorBoundary extends Component<{ children: ReactNode; fallbackText: string }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex h-full items-center justify-center rounded bg-slate-100 px-3 py-2 text-xs text-slate-600">
          {this.props.fallbackText}
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 1. LEFT BAR: Minimalist Static 3D Stress Cube-Bars (Rotated 5-9%, Zero Wireframe)
// ============================================================================

const STRESS_COL_W = 1.56;
const STRESS_COL_H = 5.2;
const STRESS_GAP_X = 2.05;
// Zero rotation: completely flat/straight frontal view without pitch or yaw
const STRESS_ROT_Y = 0;

const unitBottomBoxGeo = (() => {
  const g = new THREE.BoxGeometry(STRESS_COL_W, 1, STRESS_COL_W);
  g.translate(0, 0.5, 0);
  return g;
})();

const emptyTrackMatLight = new THREE.MeshStandardMaterial({
  color: '#e2e8f0',
  roughness: 0.65,
  metalness: 0.05,
  flatShading: true,
});

function StaticStressCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / Math.max(1, size.height)));
    const halfW = 3.85;
    const halfH = 3.05;
    const dist = Math.max(halfW / Math.tan(hFov / 2), halfH / Math.tan(vFov / 2)) + 1.2;
    // Straight-on frontal view with zero rotation and zero tilt
    cam.position.set(0, 0, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function MinimalVerticalCubeBar({
  x,
  value,
  fillColor,
  runId,
}: {
  x: number;
  value: number;
  fillColor: string;
  runId: number;
}) {
  const activeRef = useRef<THREE.Mesh>(null);
  const remainRef = useRef<THREE.Mesh>(null);
  const currentRef = useRef(Math.min(1, Math.max(0, value)));
  const lastRunRef = useRef(runId);

  const fillMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: fillColor, roughness: 0.35, metalness: 0.1, flatShading: true }),
    [fillColor],
  );
  useEffect(() => () => fillMat.dispose(), [fillMat]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = Math.min(1, Math.max(0, value));
    if (lastRunRef.current !== runId && target === 0) {
      currentRef.current = 0;
      lastRunRef.current = runId;
    } else {
      lastRunRef.current = runId;
      currentRef.current = THREE.MathUtils.damp(currentRef.current, target, 15, dt);
    }

    const baseY = -STRESS_COL_H / 2;
    const activeH = Math.max(0.12, currentRef.current * STRESS_COL_H);
    if (activeRef.current) {
      activeRef.current.position.y = baseY;
      activeRef.current.scale.y = activeH;
    }

    const seam = 0.05;
    const remainH = STRESS_COL_H - activeH - seam;
    if (remainRef.current) {
      if (remainH > 0.06) {
        remainRef.current.visible = true;
        remainRef.current.position.y = baseY + activeH + seam;
        remainRef.current.scale.y = remainH;
      } else {
        remainRef.current.visible = false;
      }
    }
  });

  return (
    <group position={[x, 0, 0]} rotation={[0, STRESS_ROT_Y, 0]}>
      <mesh ref={activeRef} geometry={unitBottomBoxGeo} material={fillMat} scale={[1, 0.12, 1]} />
      <mesh
        ref={remainRef}
        geometry={unitBottomBoxGeo}
        material={emptyTrackMatLight}
        position={[0, -STRESS_COL_H / 2 + 0.17, 0]}
        scale={[1, STRESS_COL_H - 0.17, 1]}
      />
    </group>
  );
}

export const LeftStressBars3D = memo(function LeftStressBars3D({
  current,
  previous,
  capacityTons,
  runId,
}: {
  current: number;
  previous: number;
  capacityTons: number;
  runId: number;
}) {
  const currentPctNum = Math.round(current * 100);
  const previousPctNum = Math.round(previous * 100);

  return (
    <section aria-label="Indikator 3D Stress Current dan Stress Previous" className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-xs font-bold leading-tight text-slate-900">Stress Current</div>
          <div className="num text-[11px] font-medium text-slate-500">Maks {capacityTons} Ton</div>
        </div>
        <div>
          <div className="text-xs font-bold leading-tight text-slate-900">Stress Previous</div>
          <div className="num text-[11px] font-medium text-slate-500">Maks {capacityTons} Ton</div>
        </div>
      </div>

      <div className="pointer-events-none relative my-1.5 h-44 w-full select-none">
        <div className="absolute inset-0 overflow-hidden">
          <Static3DErrorBoundary fallbackText="Indikator 3D tidak tersedia">
            <Canvas
              dpr={[1, 2]}
              camera={{ fov: 24, near: 0.5, far: 100 }}
              gl={{ antialias: true }}
              onCreated={({ scene }) => {
                scene.background = new THREE.Color('#ffffff');
              }}
            >
              <ambientLight intensity={1.15} />
              <directionalLight position={[-8, 14, 11]} intensity={1.75} />
              <directionalLight position={[10, -4, 5]} intensity={0.4} />
              <StaticStressCamera />
              <MinimalVerticalCubeBar x={-STRESS_GAP_X} value={current} fillColor="#0284c7" runId={runId} />
              <MinimalVerticalCubeBar x={STRESS_GAP_X} value={previous} fillColor="#ea580c" runId={runId} />
            </Canvas>
          </Static3DErrorBoundary>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div
          role="meter"
          aria-label={`Stress Current: ${pct(current)} (${tons(current, capacityTons)} dari ${capacityTons} Ton)`}
          aria-valuemin={0}
          aria-valuemax={Math.max(100, currentPctNum)}
          aria-valuenow={currentPctNum}
          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center"
        >
          <div className="num text-base font-extrabold leading-none text-sky-700">{pct(current)}</div>
          <div className="num mt-0.5 whitespace-nowrap text-[11px] font-semibold text-slate-600">
            {tons(current, capacityTons)}
          </div>
        </div>

        <div
          role="meter"
          aria-label={`Stress Previous: ${pct(previous)} (${tons(previous, capacityTons)} dari ${capacityTons} Ton)`}
          aria-valuemin={0}
          aria-valuemax={Math.max(100, previousPctNum)}
          aria-valuenow={previousPctNum}
          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center"
        >
          <div className="num text-base font-extrabold leading-none text-amber-700">{pct(previous)}</div>
          <div className="num mt-0.5 whitespace-nowrap text-[11px] font-semibold text-slate-600">
            {tons(previous, capacityTons)}
          </div>
        </div>
      </div>
    </section>
  );
});

// ============================================================================
// 2. FOOTER: 3D Rounded Rectangle Quality Bar (Rotated 5-9%) + 3D Indicator
// ============================================================================

const QUALITY_LEN = 22.0;
const QUALITY_H = 1.32;
const QUALITY_D = 1.72;
const QUALITY_RADIUS = 0.44;
const QUALITY_Y = 0;

function createLeftAlignedRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const rad = Math.max(0.001, Math.min(r, w / 2, h / 2));
  const x = 0;
  const y = -h / 2;
  shape.moveTo(x + rad, y);
  shape.lineTo(x + w - rad, y);
  shape.absarc(x + w - rad, y + rad, rad, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - rad);
  shape.absarc(x + w - rad, y + h - rad, rad, 0, Math.PI / 2, false);
  shape.lineTo(x + rad, y + h);
  shape.absarc(x + rad, y + h - rad, rad, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + rad);
  shape.absarc(x + rad, y + rad, rad, Math.PI, (3 * Math.PI) / 2, false);
  return shape;
}

function makeRoundedRectGeometry(w: number, h: number, d: number, r: number): THREE.ExtrudeGeometry {
  const shape = createLeftAlignedRoundedRectShape(w, h, r);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geo.translate(0, 0, -d / 2);
  return geo;
}

const minThinCubeGeo = new THREE.BoxGeometry(0.32, QUALITY_H + 0.44, QUALITY_D + 0.38);

function qualityColors(q: number, minQuality: number) {
  if (q <= minQuality || q < 40) return { mesh: '#dc2626', ink: 'text-rose-700' };
  if (q < 70) return { mesh: '#d97706', ink: 'text-amber-700' };
  return { mesh: '#059669', ink: 'text-emerald-700' };
}

function StaticQualityCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / Math.max(1, size.height)));
    const halfW = 12.3;
    const halfH = 1.85;
    const dist = Math.max(halfW / Math.tan(hFov / 2), halfH / Math.tan(vFov / 2)) + 1.2;
    // Straight-on frontal view with zero rotation, zero pitch, and zero yaw
    cam.position.set(0, 0, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function RoundedHorizontalQualityMesh({
  quality,
  minQuality,
  runId,
}: {
  quality: number;
  minQuality: number;
  runId: number;
}) {
  const clamped = Math.min(100, Math.max(0, quality));
  const clampedMin = Math.min(100, Math.max(0, minQuality));
  const palette = qualityColors(clamped, clampedMin);

  const fillMesh = useRef<THREE.Mesh>(null);
  const minCubeMesh = useRef<THREE.Mesh>(null);

  const displayedRef = useRef(clamped);
  const lastLenRef = useRef<number>((clamped / 100) * QUALITY_LEN);
  const minPosRef = useRef(clampedMin);
  const lastRunRef = useRef(runId);

  // Full-track 3D rounded rectangle geometry
  const trackGeo = useMemo(
    () => makeRoundedRectGeometry(QUALITY_LEN, QUALITY_H, QUALITY_D, QUALITY_RADIUS),
    [],
  );
  useEffect(() => () => trackGeo.dispose(), [trackGeo]);

  // Initial fill geometry
  const initialFillGeo = useMemo(
    () => makeRoundedRectGeometry(Math.max(0.1, (clamped / 100) * QUALITY_LEN), QUALITY_H, QUALITY_D + 0.02, QUALITY_RADIUS),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const fillMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: palette.mesh, roughness: 0.32, metalness: 0.1, flatShading: true }),
    [palette.mesh],
  );
  const minCubeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3, metalness: 0.25, flatShading: true }),
    [],
  );

  useEffect(() => () => fillMat.dispose(), [fillMat]);
  useEffect(() => () => minCubeMat.dispose(), [minCubeMat]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (lastRunRef.current !== runId || clamped > displayedRef.current + 0.01) {
      displayedRef.current = clamped;
      lastRunRef.current = runId;
    } else {
      lastRunRef.current = runId;
      displayedRef.current = THREE.MathUtils.damp(displayedRef.current, clamped, 16, dt);
    }

    minPosRef.current = THREE.MathUtils.damp(minPosRef.current, clampedMin, 22, dt);

    const startX = -QUALITY_LEN / 2;
    const targetLen = Math.max(0.1, (displayedRef.current / 100) * QUALITY_LEN);

    // Smoothly update 3D rounded rectangle fill geometry when length changes
    if (Math.abs(targetLen - lastLenRef.current) > 0.04) {
      lastLenRef.current = targetLen;
      if (fillMesh.current) {
        const oldGeo = fillMesh.current.geometry;
        fillMesh.current.geometry = makeRoundedRectGeometry(
          targetLen,
          QUALITY_H,
          QUALITY_D + 0.02,
          QUALITY_RADIUS,
        );
        oldGeo?.dispose();
      }
    }

    if (fillMesh.current) {
      fillMesh.current.visible = clamped > 0.01;
    }

    if (minCubeMesh.current) {
      minCubeMesh.current.position.x = startX + (minPosRef.current / 100) * QUALITY_LEN;
    }
  });

  return (
    <group position={[0, QUALITY_Y, 0]} rotation={[0, 0, 0]}>
      {/* 3D Rounded Rectangle Track Background (Clean light mode, zero wireframe) */}
      <mesh
        geometry={trackGeo}
        material={emptyTrackMatLight}
        position={[-QUALITY_LEN / 2, 0, 0]}
        rotation={[0, 0, 0]}
      />

      {/* 3D Rounded Rectangle Active Quality Bar (Zero rotation on all axes) */}
      <mesh
        ref={fillMesh}
        geometry={initialFillGeo}
        material={fillMat}
        position={[-QUALITY_LEN / 2, 0, 0]}
        rotation={[0, 0, 0]}
      />

      {/* 3D Thin Cube Indicator for Kualitas Minimum Jembatan */}
      <mesh
        ref={minCubeMesh}
        geometry={minThinCubeGeo}
        material={minCubeMat}
        position={[-QUALITY_LEN / 2 + (clampedMin / 100) * QUALITY_LEN, 0, 0]}
        rotation={[0, 0, 0]}
        castShadow
      />
    </group>
  );
}

interface QualityPopoverItem {
  key: string;
  loss: number;
  qualityAfter: number;
}

export const FooterQualityBar3D = memo(function FooterQualityBar3D({
  quality,
  minQuality,
  events,
  runId,
}: {
  quality: number;
  minQuality: number;
  events: QualityReductionEvent[];
  runId: number;
}) {
  const registry = useCreateAnchorRegistry();
  const [popovers, setPopovers] = useState<QualityPopoverItem[]>([]);
  const seenRef = useRef<{ runId: number; count: number }>({ runId, count: 0 });
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

    if (events.length > seenRef.current.count) {
      const startIdx = seenRef.current.count;
      const newItems: QualityPopoverItem[] = [];
      for (let i = startIdx; i < events.length; i++) {
        const ev = events[i];
        if (ev.actualLoss > 0) {
          newItems.push({
            key: `${runId}-${ev.vehicleId}`,
            loss: ev.actualLoss,
            qualityAfter: ev.qualityAfter,
          });
        }
      }
      seenRef.current.count = events.length;

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
  }, [events, runId]);

  const clampedQuality = Math.min(100, Math.max(0, quality));
  const clampedMin = Math.min(100, Math.max(0, minQuality));
  const qTone = qualityColors(clampedQuality, clampedMin);
  const belowMin = clampedQuality <= clampedMin;

  return (
    <footer
      aria-label="Footer Kualitas Jembatan 3D"
      className="min-w-0 overflow-x-clip border-t border-slate-200 bg-white px-4 py-2.5 lg:px-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="meter"
          aria-label={`Kualitas Jembatan: ${clampedQuality.toFixed(2)}% (Minimum ${clampedMin}%)`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Number(clampedQuality.toFixed(2))}
          className="inline-flex flex-wrap items-baseline gap-2"
        >
          <span className="text-xs font-bold text-slate-800 sm:text-sm">Kualitas Jembatan</span>
          <span className={`num text-sm font-extrabold sm:text-base ${qTone.ink}`}>
            {clampedQuality.toFixed(2)}%
          </span>
          {belowMin && (
            <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-800">
              Di Bawah Minimum
            </span>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <span aria-hidden="true" className="inline-block h-3.5 w-1.5 rounded-[1px] bg-slate-900" />
          <span className="num">Batas Minimum: {clampedMin}%</span>
        </div>
      </div>

      <AnchorOverlayProvider registry={registry}>
        <div className="pointer-events-none relative mt-1 h-22 w-full select-none sm:h-24">
          <div className="absolute inset-0 overflow-hidden">
            <Static3DErrorBoundary fallbackText="Indikator Kualitas Jembatan 3D tidak tersedia">
              <Canvas
                dpr={[1, 2]}
                camera={{ fov: 2, near: 0.5, far: 120 }}
                gl={{ antialias: true }}
                onCreated={({ scene }) => {
                  scene.background = new THREE.Color('#ffffff');
                }}
              >
                <ambientLight intensity={1.15} />
                <directionalLight position={[10, 14, 12]} intensity={1.75} />
                <directionalLight position={[-10, -4, 6]} intensity={0.4} />
                <StaticQualityCamera />
                <AnchorProjector registry={registry} />
                <RoundedHorizontalQualityMesh quality={clampedQuality} minQuality={clampedMin} runId={runId} />
              </Canvas>
            </Static3DErrorBoundary>
          </div>

          {popovers.map((item, idx) => {
            const rawTipX = -QUALITY_LEN / 2 + (item.qualityAfter / 100) * QUALITY_LEN;
            const anchorX = Math.max(-8.6, Math.min(8.6, rawTipX));
            const heavy = item.loss >= 1;
            const stackOffsetPx = (popovers.length - 1 - idx) * 26;
            return (
              <WorldAnchor
                key={item.key}
                position={[anchorX, QUALITY_Y + QUALITY_H / 2 + 0.18, 0]}
                align="above"
              >
                <div
                  role="status"
                  aria-live="polite"
                  style={stackOffsetPx > 0 ? { marginBottom: `${stackOffsetPx}px` } : undefined}
                  className="quality-popover flex flex-col items-center transition-[margin] duration-200"
                >
                  <div
                    className={`num whitespace-nowrap rounded-md border border-rose-800 font-extrabold text-white shadow-sm ${
                      heavy ? 'bg-rose-700 px-2.5 py-0.5 text-xs sm:text-sm' : 'bg-rose-600 px-2 py-0.5 text-xs'
                    }`}
                  >
                    {'\u2212'}
                    {item.loss.toFixed(2)}%
                  </div>
                  <div
                    className={`h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent ${
                      heavy ? 'border-t-rose-700' : 'border-t-rose-600'
                    }`}
                  />
                </div>
              </WorldAnchor>
            );
          })}
        </div>
      </AnchorOverlayProvider>
    </footer>
  );
});
