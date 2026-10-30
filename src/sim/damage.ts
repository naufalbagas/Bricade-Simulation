// Direct port of `faktor_pengurang` (custom educational model, not structural analysis).
// Inputs are normalized decimals (0.10 = 10%); output is percentage-point health loss.
export function faktorPengurang(nilaiPrev: number, nilaiSekarang: number): number {
  if (nilaiSekarang >= nilaiPrev) {
    if (0.2 < nilaiSekarang && nilaiSekarang <= 0.38) return 0.3;
    if (0.38 < nilaiSekarang && nilaiSekarang <= 0.43) return 0.5;
    if (0.43 < nilaiSekarang && nilaiSekarang <= 0.62) return 2.0;
    if (0.62 < nilaiSekarang && nilaiSekarang <= 0.7) return 4.8;
    if (0.7 < nilaiSekarang && nilaiSekarang <= 1.0) return 16.5;
    return 0.0;
  }
  if (nilaiSekarang < nilaiPrev) return 0.17;
  return 0.0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Skips `faktorPengurang` when Stress Load has not changed, returning null for no call.
export function transitionReduction(prev: number, next: number): number | null {
  if (prev === next) return null;
  return faktorPengurang(prev, next);
}

// Rounds to 1e-6 so repeated 0.17 deductions do not accumulate float drift.
export function applyDamage(health: number, prev: number, next: number): { health: number; reduction: number } {
  const reduction = transitionReduction(prev, next) ?? 0;
  const raw = clamp(health - reduction, 0, 100);
  return { health: Math.round(raw * 1e6) / 1e6, reduction };
}
