# Little Heroes World (`/kids`)

A playful page for ages 6 to 12, in the spirit of Nova or Cambly: **create your hero**, **missions and XP**, **projects**, a **Hero Board**, and the kids' courses.

| Part | What it does today |
| --- | --- |
| Hero workshop | SVG avatar built from choices (skin, hair, outfit, gear, background, cape). Original characters. A nickname is asked for, with a warning not to use a real name |
| XP and levels | 5 levels (Explorer, Builder, Inventor, Hero, Legend), 100 XP each. Daily missions refresh each day. Day streak |
| Badges | New hero, Maker, Steady (3 days), Builder (level 2), Great friend (5 cheers) |
| Projects | Sample projects from other heroes, "cheer" with preset emoji only, and a form to add your own project (+40 XP) |
| Hero Board | Weekly ranking of sample heroes and you |
| Courses | The kids' courses from the catalogue; a parent buys them |

**Safety rules (see CLAUDE.md):** no personal data from children, nicknames only, no free-text chat, cheers are preset emoji, purchase through the guardian account, and a child's own projects stay private until reviewed.

**Status.** This version keeps the hero, XP and projects in the browser (`localStorage` key `gba.kids.v1`). Nothing is sent to the server. To make it real:
1. Tables (V8): `kid_profiles` (guardian user id, nickname, look JSON), `kid_xp_events`, `kid_projects` (status `pending|approved`), `kid_cheers`.
2. Guardian-scoped endpoints under `/me/kids/...`; XP awarded by the server from real lesson and quiz completion, not by a button.
3. Moderation queue for projects in the admin and mentor portals, with images only after approval.
4. A real weekly leaderboard computed from `kid_xp_events`.

Code: `components/kids/*`, texts `lib/dict/kids.ts`, route `app/[locale]/kids`.
