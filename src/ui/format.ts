import { MAX_CAPACITY_TONS } from '../sim/constants';

export const pct = (normalized: number, digits = 0) => `${(normalized * 100).toFixed(digits)}%`;

export const tons = (normalized: number) => {
  const value = normalized * MAX_CAPACITY_TONS;
  return `${value.toFixed(1)} ${value === 1 ? 'ton' : 'tons'}`;
};

export const weightTonsText = (weightTons: number) =>
  `${weightTons.toFixed(1)} ${weightTons === 1 ? 'ton' : 'tons'}`;

export const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
