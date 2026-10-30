# DESIGN.md: Interactive 3D Bridge Stress Simulation

## Design Read
Reading this as: an interactive civil-engineering educational workbench for students and instructors, in a clean technical-laboratory visual language, dial `ENERGY 2 / RHYTHM 2 / MOTION 2`.

## Dials
- `ENERGY: 2` (Crisp studio contrast: a low-poly steel tied-arch bridge diorama and volumetric 3D telemetry cube-bars on a pure `#ffffff` stage.)
- `RHYTHM: 2` (Focused two-zone workbench: compact scenario-first left bar paired with a unified full-stage 3D viewport.)
- `MOTION: 2` (Time-deterministic 3D vehicle motion, smooth volumetric 3D cube-bar transitions, and event-driven health reduction pop-overs; zero decorative infinite loops.)

## Identity Motif
Graduated structural telemetry loops: 10% (1-ton) 3D wireframe calibration rings wrap around both vertical Stress cube-bars and the horizontal Bridge Health cube-bar, echoing the painted entry/exit occupancy gates on the bridge deck.

## Palette & Contrast Verification (WCAG AA + 1.4.11)
- Canvas & surface base: `#ffffff` (pure white 3D stage) and `#f8fafc` (left control rail).
- Primary ink & primary controls: `#0f172a` (`17.8:1` on `#ffffff`).
- Secondary copy: `#475569` (`7.58:1` on `#ffffff`, `7.24:1` on `#f8fafc`).
- Control & meter borders: `#738093` (`4.00:1` on `#ffffff`, passing 3:1 non-text contrast).
- Stress Load (Blue vertical 3D cube-bar): `#1d5fd1` (`5.82:1` on `#ffffff`).
- Stress Max (Orange vertical 3D cube-bar): `#d95b00` 3D bar fill paired with `#b84a00` text (`5.23:1` normal text contrast).
- Bridge Health (Horizontal 3D cube-bar below bridge center): `#059669` / `#047857` healthy (`5.48:1`), `#d97706` / `#b45309` moderate wear (`5.02:1`), `#dc2626` / `#b91c1c` severe wear (`6.47:1`).
- Health reduction pop-over callout: `#ffffff` text on `#b91c1c` (`6.47:1`) and `#991b1b` (`8.35:1` for heavy reductions `>= 1%`).

## Key Visual Decisions (One-Line Reasons)
- **Unified 3D viewport gauges:** Placing vertical 3D Stress Load and Stress Max cube-bars to the right of the bridge and the horizontal 3D Bridge Health cube-bar directly below the bridge center keeps vehicles, span occupancy, load, and wear readable in a single spatial field.
- **Event-triggered health pop-over (`1.4s` spring-float-fade):** Spawning a `-X.XX%` callout badge above the shrinking edge of the Bridge Health 3D cube-bar makes exact per-transition damage immediately visible without a text log table.
- **Scenario-first left rail without prose or logs:** Stripping descriptions, mode toggles, and transition tables keeps left-rail interaction focused strictly on scenario titles, Start buttons, and playback controls.
- **System UI sans + tabular numerals (`font-variant-numeric: tabular-nums`):** Prevents rapidly updating time, load, and health readouts from jittering horizontally at 60fps.
- **44px minimum button height with 2px focus ring:** Meets touch-target ergonomics and keyboard-only navigation across scenario and playback controls.
