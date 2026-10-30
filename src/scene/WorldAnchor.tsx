import { useFrame } from '@react-three/fiber';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';

export interface AnchorItem {
  world: THREE.Vector3;
  el: HTMLDivElement | null;
}

export type AnchorRegistry = Set<AnchorItem>;

const AnchorRegistryContext = createContext<AnchorRegistry | null>(null);

export function useCreateAnchorRegistry(): AnchorRegistry {
  return useMemo(() => new Set<AnchorItem>(), []);
}

export function AnchorOverlayProvider({
  registry,
  children,
}: {
  registry: AnchorRegistry;
  children: ReactNode;
}) {
  return <AnchorRegistryContext.Provider value={registry}>{children}</AnchorRegistryContext.Provider>;
}

const scratch = new THREE.Vector3();

// Projects registered 3D world coordinates directly to screen-space transforms inside rAF.
export function AnchorProjector({ registry }: { registry: AnchorRegistry }) {
  useFrame(({ camera, size }) => {
    const uiScale = Math.min(1, Math.max(0.56, size.width / 820));
    for (const item of registry) {
      const el = item.el;
      if (!el) continue;
      scratch.copy(item.world).project(camera);
      if (scratch.z > 1) {
        el.style.opacity = '0';
        continue;
      }
      const x = (scratch.x * 0.5 + 0.5) * size.width;
      const y = (-scratch.y * 0.5 + 0.5) * size.height;
      el.style.opacity = '1';
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${uiScale.toFixed(3)})`;
    }
  });
  return null;
}

export function WorldAnchor({
  position,
  align = 'center',
  children,
}: {
  position: [number, number, number];
  align?: 'above' | 'below' | 'center';
  children: ReactNode;
}) {
  const registry = useContext(AnchorRegistryContext);
  const elRef = useRef<HTMLDivElement | null>(null);
  const item = useMemo<AnchorItem>(
    () => ({ world: new THREE.Vector3(position[0], position[1], position[2]), el: null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    item.world.set(position[0], position[1], position[2]);
  }, [item, position]);

  useEffect(() => {
    if (!registry) return;
    item.el = elRef.current;
    registry.add(item);
    return () => {
      registry.delete(item);
    };
  }, [registry, item]);

  const offsetClass =
    align === 'above'
      ? '-translate-x-1/2 -translate-y-full'
      : align === 'below'
        ? '-translate-x-1/2'
        : '-translate-x-1/2 -translate-y-1/2';

  const originStyle =
    align === 'above' ? '50% 100%' : align === 'below' ? '50% 0%' : '50% 50%';

  return (
    <div
      ref={elRef}
      style={{ opacity: 0, left: 0, top: 0, transformOrigin: originStyle, willChange: 'transform' }}
      className="pointer-events-none absolute select-none"
    >
      <div className={offsetClass}>{children}</div>
    </div>
  );
}
