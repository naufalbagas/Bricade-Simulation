import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const BOARD_W = 6.2;
const BOARD_H = 1.65;

function makeSignTexture(capacityTons: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 272;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(17, 17, canvas.width - 34, 18);

  ctx.fillStyle = '#475569';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 52px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('Kapasitas Maksimum:', canvas.width / 2, 108);
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 78px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(`${capacityTons} Ton`, canvas.width / 2, 194);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function CapacitySign({
  capacityTons,
  position,
  rotationY = 0,
}: {
  capacityTons: number;
  position: [number, number, number];
  rotationY?: number;
}) {
  const texture = useMemo(() => makeSignTexture(capacityTons), [capacityTons]);
  useEffect(() => () => texture.dispose(), [texture]);
  const postH = 2.25;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-BOARD_W / 2 + 0.65, BOARD_W / 2 - 0.65].map((x) => (
        <mesh key={x} position={[x, postH / 2, -0.05]} castShadow>
          <boxGeometry args={[0.13, postH, 0.13]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.55} metalness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, postH + BOARD_H / 2 - 0.18, 0.02]} castShadow>
        <boxGeometry args={[BOARD_W + 0.12, BOARD_H + 0.12, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      <mesh position={[0, postH + BOARD_H / 2 - 0.18, 0.065]}>
        <planeGeometry args={[BOARD_W, BOARD_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}
