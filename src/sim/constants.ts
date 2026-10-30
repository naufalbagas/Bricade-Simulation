export const MAX_CAPACITY_TONS = 10;
export const VEHICLE_WEIGHT_TONS = 1;
export const INITIAL_HEALTH = 100;
export const SCENARIO_DURATION_MS = 8000;

// Occupancy interval is [BRIDGE_ENTRY_X, BRIDGE_EXIT_X) measured at the vehicle center.
export const BRIDGE_LENGTH = 26;
export const BRIDGE_ENTRY_X = -BRIDGE_LENGTH / 2;
export const BRIDGE_EXIT_X = BRIDGE_LENGTH / 2;

export const APPROACH_LENGTH = 9;
export const ROAD_START_X = BRIDGE_ENTRY_X - APPROACH_LENGTH;
export const ROAD_END_X = BRIDGE_EXIT_X + APPROACH_LENGTH;

// Bumper-to-bumper length of the 3D car mesh, kept clear across all schedules.
export const VEHICLE_LENGTH = 2.1;
