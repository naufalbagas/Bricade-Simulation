import { DEFAULT_BRIDGE_CAPACITY_TONS } from '../sim/constants';

export const pct = (normalized: number) => {
  const raw = Math.round(normalized * 1000) / 10;
  return Number.isInteger(raw) ? `${raw.toFixed(0)}%` : `${raw.toFixed(1)}%`;
};

export const tons = (normalized: number, capacityTons: number = DEFAULT_BRIDGE_CAPACITY_TONS) => {
  const value = Math.round(normalized * capacityTons * 100) / 100;
  return `${Number.isInteger(value * 10) ? value.toFixed(1) : value.toFixed(2)} Ton`;
};

export const weightTonsText = (weightTons: number) => {
  const rounded = Math.round(weightTons * 100) / 100;
  return `${Number.isInteger(rounded * 10) ? rounded.toFixed(1) : rounded.toFixed(2)} Ton`;
};
