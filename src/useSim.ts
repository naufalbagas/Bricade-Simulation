import { useSyncExternalStore } from 'react';
import { SimStore } from './sim/store';

/** One store per page: one clock, one loop. */
export const simStore = new SimStore();

export function useSimState() {
  return useSyncExternalStore(simStore.subscribe, simStore.getState);
}

