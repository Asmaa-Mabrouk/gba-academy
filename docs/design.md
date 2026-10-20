# Design system and content guide

- **Brand**: GPMF Visual Identity 2026. Gold `#C49C3E` / light gold `#EDCA6D`, navy `#0B1327`, grey `#84888B`, near-black `#252525`; secondary teal `#7FC9BF`, blue `#78AFD4`, purple `#A759D1`. Tokens: `apps/web/src/app/globals.css`.
- **Fonts**: Tajawal for Arabic, Roboto for Latin (both via `@fontsource`).
- **Mark**: `public/brand/gpmf-flower.png`, animated by `components/GpmfSpiral.tsx` (login, hero, CTA). Animation respects `prefers-reduced-motion`.
- **Audience tracks** each have their own colour: kids teal/blue, youth purple/blue, experts navy/gold. Generative covers: `components/CourseCover.tsx` (replace with real artwork later).
- **RTL**: use logical utilities (`ms-`, `pe-`, `start-`, `end-`), never `left`/`right`.
- **To replace later**: SVG logo variants, real course covers, mentor photos, confirmed Arabic academy name (currently "أكاديمية الأعمال العالمية", a placeholder).
- **Content rules**: kids' content is written for the parent buyer and the child learner; no personal data collected from children.
