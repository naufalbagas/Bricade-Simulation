export type SimStatus = 'idle' | 'running';

export interface VehicleSpawnInput {
  weightTons: number;
  speedKmh: number;
  color?: string;
}

export interface VehicleEntity {
  id: number;
  weightTons: number;
  speedKmh: number;
  speedUnitsPerSec: number;
  color: string;
  x: number;
  distanceTraveled: number;
  hasEnteredBridge: boolean;
  onBridge: boolean;
}

export interface QualityReductionEvent {
  vehicleId: number;
  reduction: number;
  actualLoss: number;
  qualityAfter: number;
  stressCurrent: number;
  stressPrevious: number;
}

export interface SimSnapshot {
  vehicles: VehicleEntity[];
  occupantCount: number;
  totalWeightTons: number;
  capacityTons: number;
  minQuality: number;
  stressCurrent: number;
  stressPrevious: number;
  quality: number;
  events: QualityReductionEvent[];
}
