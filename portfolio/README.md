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
  screenshots/             12 hi-fi captures of the shipped product
    login                  Dual-entry auth (pairs with WF-01)
    dashboard              Household briefing (pairs with WF-02)
    projects_master_list   Ranked truth (pairs with WF-03)
    projects_by_category   Room projections (pairs with WF-03)
    project_detail         Gallery + price header (pairs with WF-04)
    project_detail_pricing Price history + market offers (pairs with WF-04)
    house_3d               Dusk scene, default view (pairs with WF-05)
    house_3d_selected      Hotspot → detail card (pairs with WF-05)
    house_3d_back          Orbited to the deck side (pairs with WF-05)
    home_care              Recurring cycles (pairs with WF-06)
    budget                 Fund + runway (pairs with WF-07)
    mobile_dashboard       430px companion (pairs with WF-08)
    mobile_house           430px 3D scene (pairs with WF-08)
```

Screenshots were captured headlessly at exact viewports (2x density for UI
pages) — regenerate anytime with `node scripts/capture-screenshots.mjs`
while the dev server is running.

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
