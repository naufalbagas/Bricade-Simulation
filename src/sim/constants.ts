export const DEFAULT_BRIDGE_CAPACITY_TONS = 10;
export const MIN_BRIDGE_CAPACITY_TONS = 10;
export const MAX_BRIDGE_CAPACITY_TONS = 100;

export const INITIAL_QUALITY = 100;
export const DEFAULT_MIN_QUALITY = 30;
export const MIN_QUALITY_THRESHOLD = 0;
export const MAX_QUALITY_THRESHOLD = 100;

export const DEFAULT_WEIGHT_TONS = 1;
export const DEFAULT_SPEED_KMH = 40;

export const MIN_WEIGHT_TONS = 0.1;
export const MAX_WEIGHT_TONS = 100;
export const MIN_SPEED_KMH = 5;
export const MAX_SPEED_KMH = 150;

// Occupancy interval is [BRIDGE_ENTRY_X, BRIDGE_EXIT_X) measured at the vehicle center (1 unit = 1 meter).
export const BRIDGE_LENGTH = 26;
export const BRIDGE_ENTRY_X = -BRIDGE_LENGTH / 2;
export const BRIDGE_EXIT_X = BRIDGE_LENGTH / 2;

export const APPROACH_LENGTH = 9;
export const ROAD_START_X = BRIDGE_ENTRY_X - APPROACH_LENGTH;
export const ROAD_END_X = BRIDGE_EXIT_X + APPROACH_LENGTH;

// Bumper-to-bumper length of the 3D car mesh and minimum center-to-center headway.
export const VEHICLE_LENGTH = 2.1;
export const MIN_VEHICLE_GAP = 3.2;
