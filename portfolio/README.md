# Eaton Home — portfolio package

Everything needed to publish Eaton Home as a UX/product design case study.

## Contents

```
portfolio/
  case-study.md            The full principal-level case study (paste-ready)
  wireframes/              8 annotated lo-fi wireframe sheets (SVG + PNG)
    wf-01-login            Dual-entry authentication
    wf-02-dashboard        The 30-second household briefing
    wf-03-projects         Master rank + category projections
    wf-04-project-detail   Gallery, price history, market compare
    wf-05-3d-house         Spatial navigation, hotspots, care alerts
    wf-06-home-care        Recurring maintenance cycles
    wf-07-budget           Fund, runway, category weight
    wf-08-mobile           Thumb-first key screens
  diagrams/                3 planning artifacts (SVG + PNG)
    01-sitemap             Information architecture
    02-user-flows          Buy-at-the-right-time · Saturday planning · care loop
    03-design-tokens       "Dusk Glass" design language sheet
```

## Publishing tips

- **Hero image:** lead with a live screenshot of the 3D House page (dark, cinematic,
  instantly differentiating), then the dashboard. Wireframes come *after* the
  problem section — show the polish first, prove the process second.
- **Pair each wireframe with its shipped screen.** The lo-fi → hi-fi jump is the
  strongest craft signal in the set.
- **PNG exports** are included at 1720px wide. Regenerate anytime:
  `python3 scripts/generate-wireframes.py` (SVGs), then convert with any
  SVG→PNG tool if you need rasters.
- **Short blurb** for portfolio cards:

  > *Eaton Home — a cinematic household OS that turns a chaotic home-upgrade
  > wishlist into a ranked, budgeted, price-aware plan, with a draggable 3D
  > model of the house as the map. Designed and built end-to-end: research,
  > IA, wireframes, design system, motion, 3D, and production code
  > (Next.js + Supabase + react-three-fiber).*
