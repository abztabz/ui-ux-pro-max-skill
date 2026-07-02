# Syahar — Website & App Wireframe

A modern, professional marketing site + working product wireframe for **Syahar**
(स्याहार) — the cross-border caregiver platform. Built from the investor decks,
the demo app and the Operations Manual, and designed so the same screens can be
copied directly into mobile app development.

## Run it

No build step, no dependencies. Serve the folder and open it:

```bash
cd syahar-website
python3 -m http.server 8080
# open http://localhost:8080
```

## What's inside

| Page | Who | What it does |
|---|---|---|
| `index.html` | Public | Landing page with **lead capture** (care-plan requests AND caregiver applications), how-it-works, verified-care proof, pricing (Lite / Care / Full Care), FAQ |
| `login.html` | All | One login, three roles — Family, Caregiver, Coordinator (admin) |
| `app/family.html` | Customer | **Health records** (vitals, medications, documents), **daily care log** from the caregiver, **chat with audio + video calls**, **emergency button** (severity-graded, per SOP 6), transparent billing with sibling split |
| `app/caregiver.html` | Provider | Visit schedule, **file daily report** (appears instantly in the family's log), families, chat + calls |
| `app/admin.html` | Admin | KPIs, **lead inbox** (landing-page submissions land here), placements pipeline, caregiver vetting roster, emergency feed |
| `app/crm.html` | Admin | **CRM** — kanban pipeline over the SOP stages (Enquiry → Qualified → Match & vet → Intro call → Placed), drag-and-drop (move buttons on mobile), lead drawer with contact record, notes/activity log and next actions |
| `app/cms.html` | Admin | **CMS backend** — edit the landing page's hero, stats, pricing and FAQ, then publish; the live landing page picks the content up on next load (`cms-apply.js`) |

### Demo accounts (password `demo`)

- `family@syahar.demo` — Kiran Dhakal (son, UK)
- `caregiver@syahar.demo` — Sita Gurung (Kathmandu)
- `admin@syahar.demo` — Care coordinator

Everything persists to `localStorage`, so the demo is coherent end-to-end:
submit the landing form → it appears in the admin lead inbox; file a caregiver
report → it appears in the family's daily log and vitals.

## Copying this wireframe for app development

This was structured deliberately for the app build:

1. **`assets/css/tokens.css` is the design system.** Colors, type scale, radii,
   spacing and motion as CSS variables. Port it 1:1 to a React Native theme
   object or Flutter `ThemeData`. Fonts: **Lexend** (headings) + **Source Sans 3**
   (body).
2. **`assets/js/store.js` is the API contract.** The object shapes (patient,
   report, message, lead, alert, visit) are what the real backend should return.
   Replace the module with an API client; the UI code doesn't change shape.
3. **The mobile layout IS the app layout.** Below 860px each dashboard becomes
   top bar + bottom tab bar — the native app navigation pattern. Each tab
   section (`#home`, `#health`, `#log`, `#chat`, `#billing`) maps to one app
   screen.
4. **The call overlay** (`.call-overlay` + `SyaharShell.startCall`) is the
   placeholder for the real WebRTC screen (audio/video). Same for the
   emergency modal → native emergency flow with `tel:` deep links.

## Design decisions (and which skill drove them)

- **ui-ux-pro-max** — healthcare product pattern (trust-first, calm palette,
  social-proof landing), "Corporate Trust" font pairing, lead form kept to
  3 fields, WCAG-minded contrast and focus states.
- **tasteskill** — no emojis (inline SVG icons, stroke 2), split-screen hero
  (no centered-hero cliché), single accent color (amber, CTAs only),
  brand-tinted shadows, real loading/empty/error states, `100dvh` not `100vh`.
- **impeccable** — visual hierarchy, spacing rhythm on a 4pt scale, register:
  brand (landing) vs product (dashboards).
- **marketingskills (cro)** — benefit-led headline, one primary CTA per view,
  objection-handling FAQ, trust chips above the fold, money-back reassurance
  at the point of commitment.
- **Brand** — carried directly from the Syahar decks: teal `#0E7C7B`,
  navy `#0F2530`, amber `#F0A04B`, and the golden rule — *"We sell peace of
  mind, not money transfer."*
