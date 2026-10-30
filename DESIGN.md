# DESIGN.md: Interactive 3D Bridge Stress Simulation

## Design Read
Reading this as: an interactive civil-engineering educational workbench for students and instructors, in a clean technical-laboratory visual language, dial `ENERGY 2 / RHYTHM 2 / MOTION 2`.

## Dials
- `ENERGY: 2` (Crisp studio contrast: a low-poly steel tied-arch bridge diorama on a pure `#ffffff` stage, paired with high-contrast instrument gauges.)
- `RHYTHM: 2` (Asymmetric three-zone workbench on desktop, two-tier split on tablet, compact vertical instrument stack on mobile.)
- `MOTION: 2` (Time-deterministic 3D vehicle motion, proportional wheel spin, and 250ms gauge transitions; no decorative infinite loops.)

## Identity Motif
Graduated structural telemetry ticks: 1-ton (10%) calibration marks on both vertical stress gauges echo the painted entry/exit occupancy lines on the bridge deck and the event ticks along the 8-second timeline.

## Palette & Contrast Verification (WCAG AA + 1.4.11)
- Canvas & surface base: `#ffffff` (pure white scene & main surface, per Section 3.1) and `#f8fafc` (secondary panel surface).
- Primary ink & primary controls: `#0f172a` (`17.8:1` on `#ffffff`).
- Secondary copy: `#475569` (`7.58:1` on `#ffffff`, `7.24:1` on `#f8fafc`).
- Control & meter borders: `#738093` (`4.00:1` on `#ffffff`, `3.83:1` on `#f8fafc`, passing 3:1 non-text contrast).
- Stress Load (Blue vertical gauge & active badge): `#1d5fd1` (`5.82:1` on `#ffffff`).
- Stress Max (Orange vertical gauge): `#d95b00` bar fill (`3.86:1` non-text contrast) paired with `#b84a00` text (`5.23:1` normal text contrast).
- Bridge Health (Horizontal gauge): `#047857` healthy (`5.48:1`), `#b45309` moderate wear (`5.02:1`), `#b91c1c` severe wear (`6.47:1`).

## Key Visual Decisions (One-Line Reasons)
- **Pure white stage (`#ffffff`):** Isolates the single low-poly arch bridge, cars, and capacity sign without environmental clutter, matching Section 3.1.
- **Contained cross-section diorama:** Framing left/right embankments and river channel as a bounded model prevents abrupt ground-plane clipping at wide or narrow aspect ratios.
- **System UI sans + tabular numerals (`font-variant-numeric: tabular-nums`):** Keeps rapidly updating time, load, and health readouts from jittering horizontally at 60fps.
- **Three-stage responsive grid (`base` / `md` / `lg`):** Keeps the 3D bridge and all three monitoring bars simultaneously visible on both tablet (`768px+`) and desktop (`1024px+`), while fitting comfortably above the fold on mobile (`390x844`).
- **44px minimum button height with 2px focus ring:** Meets touch-target ergonomics and keyboard-only navigation across playback and scenario controls.

