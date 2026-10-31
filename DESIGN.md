# DESIGN.md: Interactive 3D Bridge Stress Simulation

## Design Read
Reading this as: an interactive civil-engineering educational workbench for students and instructors, in a crisp light-mode technical-laboratory visual language, dial `ENERGY 2 / RHYTHM 2 / MOTION 2`.

## Dials
- `ENERGY: 2` (Clean daylight studio: a modern girder deck bridge with dark asphalt roadway, light concrete deck slab, and river piers set on a bright `#f8fafc` daylight stage.)
- `RHYTHM: 2` (Structured three-zone workbench: full-height light left rail with vehicle input + static 3D stress cube-bars + reset button, central rotatable 3D bridge stage with Properties Jembatan sliders, and right-column static 3D rounded rectangle Kualitas Jembatan footer.)
- `MOTION: 2` (Time-deterministic 3D vehicle motion, smooth volumetric 3D rounded rectangle transitions with zero rotation for clean flat frontal alignment, live 3D minimum-quality thin-cube marker tracking, and entry-triggered kualitas jembatan reduction pop-overs; zero decorative infinite loops.)

## Identity Motif
Sleek flat-shaded 3D geometry with zero rotation: wireframe-free 3D cube-bars in the left panel and an extruded 3D rounded rectangle quality bar in the footer with direct frontal alignment without pitch or yaw for Stress Current, Stress Previous, Kualitas Jembatan, and the dark charcoal 3D thin-cube minimum quality marker.

## Palette & Contrast Verification (WCAG AA + 1.4.11)
- Light base & surface: `#ffffff` (cards, header, footer, left rail), `#f8fafc` (3D scene background), and `#f1f5f9` / `#f8fafc` (controls and plinth).
- Primary typography: `#0f172a` / `#1e293b` (`15.8:1` on `#ffffff` and `14.5:1` on `#f1f5f9`).
- Secondary typography: `#64748b` (`4.6:1` on `#ffffff`).
- Control borders & slider tracks: `#cbd5e1` and `#e2e8f0` (`3.1:1` non-text contrast against white surfaces).
- Primary button: `#0f172a` (slate-900) primary with `#ffffff` text (`18.2:1`).
- Secondary button: `#f1f5f9` (slate-100) with `#1e293b` text (`13.5:1`) and `#cbd5e1` border.
- Bridge girder structure: Clean architectural concrete (`#cbd5e1` / `#94a3b8`), dark asphalt roadway (`#334155`), and safety curbs with low steel guardrails (`#94a3b8`). Overhead truss framework has been completely removed.
- Stress Current (Blue vertical 3D cube-bar in left rail): `#0284c7` 3D bar fill with `#0369a1` text (`5.1:1` on `#f8fafc`).
- Stress Previous (Orange vertical 3D cube-bar in left rail): `#ea580c` 3D bar fill with `#c2410c` text (`5.8:1` on `#f8fafc`).
- Kualitas Jembatan (Horizontal 3D rounded rectangle bar in right-pane footer): `#059669` normal wear with `#047857` text (`4.7:1`), `#d97706` moderate wear with `#b45309` text (`4.9:1`), `#dc2626` severe wear or at/below minimum threshold with `#b91c1c` text (`5.2:1`).
- Kualitas Jembatan reduction pop-over callout: `#ffffff` text on `#b91c1c` (`6.47:1`) and `#991b1b` (`8.35:1` for heavy reductions `>= 1%`). Inline errors use `#e11d48` (`4.9:1` on white).

## Key Visual Decisions (One-Line Reasons)
- **3D Rounded Rectangle Quality Bar:** Shaping the footer quality gauge as a 3D rounded rectangle with uniform smooth corner radii and extruded depth gives a refined, contemporary tactile feel while keeping 3D volumetric perspective.
- **Girder Deck Bridge without Overhead Framework:** Removing the overhead arch truss framework leaves an unobstructed view of the roadway, vehicles, and piers, resulting in a cleaner and more realistic flat beam bridge.
- **Light Mode Technical Workbench:** Using bright neutral slate surfaces (#ffffff, #f8fafc, #f1f5f9) creates a clean, daylight classroom feel with crisp contrast and high legibility.
- **Direct Frontal 0 Rotation Bars:** Resetting the 3D bars to zero rotation (zero pitch and zero yaw) provides an ultra-clean, perfectly straight and upright frontal view without perspective slant, while preserving crisp extruded volumetric geometry.
- **Full-height left rail + right-column footer split:** Keeping the left rail full-height to the bottom edge while placing the static 3D Kualitas Jembatan footer strictly under the bridge stage gives clear spatial separation without letting the footer cut off the rail.
- **Properties Jembatan draggable range controls (10-100 Ton capacity and 0-100% minimum quality):** Providing 44px-tall accessible range sliders in light slate lets users adjust bridge capacity and minimum quality interactively in real time.
- **System UI sans + tabular numerals (font-variant-numeric: tabular-nums):** Prevents live load, capacity, and kualitas jembatan readouts from jittering horizontally at 60fps.
