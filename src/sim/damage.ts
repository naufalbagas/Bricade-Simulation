// Ported 1:1 from Darren's Python faktor_pengurang(nilai_prev, nilai_curr).
// Called strictly once per vehicle at the moment that vehicle enters the bridge,
// with nilaiPrev = Stress Previous and nilaiCurr = Stress Current (including the entering vehicle).
export function faktorPengurang(nilaiPrev: number, nilaiCurr: number): number {
  if (nilaiCurr >= nilaiPrev) {
    if (0.2 < nilaiCurr && nilaiCurr <= 0.38) return 0.3;
    else if (0.38 < nilaiCurr && nilaiCurr <= 0.43) return 0.5;
    else if (0.43 < nilaiCurr && nilaiCurr <= 0.62) return 2.0;
    else if (0.62 < nilaiCurr && nilaiCurr <= 0.7) return 4.8;
    else if (0.7 < nilaiCurr) return 16.5;
  }
  // Returns 0.17 when nilaiCurr <= 0.20 or nilaiCurr < nilaiPrev.
  return 0.17;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function applyEntryDamage(
  quality: number,
  stressPrevious: number,
  stressCurrent: number,
): { quality: number; reduction: number; actualLoss: number } {
  const reduction = faktorPengurang(stressPrevious, stressCurrent);
  const nextQuality = Math.round(clamp(quality - reduction, 0, 100) * 1e6) / 1e6;
  const actualLoss = Math.round((quality - nextQuality) * 1e6) / 1e6;
  return { quality: nextQuality, reduction, actualLoss };
}
