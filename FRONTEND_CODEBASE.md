# LEXORA — Complete Frontend Codebase

## File Structure Overview

```
src/
├── app/
│   ├── layout.tsx              ← Root layout (fonts, metadata)
│   ├── page.tsx                ← SPA router (view switching)
│   ├── globals.css             ← Design system (colors, shadows, animations)
│   ├── privacy/page.tsx        ← Legal: Privacy Policy
│   ├── terms/page.tsx          ← Legal: Terms of Service
│   └── cookies/page.tsx        ← Legal: Cookie Policy
├── components/
│   ├── app/
│   │   └── app-shell.tsx       ← Sidebar + header + notifications
│   ├── shared/
│   │   ├── risk-badge.tsx      ← Risk level pill component
│   │   └── risk-gauge.tsx      ← Animated SVG risk gauge
│   ├── ui/                     ← shadcn/ui components (49 files, standard)
│   │   ├── button.tsx          ← Button (variant: default/golden/outline/etc)
│   │   ├── card.tsx            ← Card components
│   │   ├── input.tsx           ← Input field
│   │   ├── dialog.tsx          ← Modal dialog
│   │   ├── dropdown-menu.tsx   ← Dropdown menus
│   │   ├── accordion.tsx       ← Collapsible accordions
│   │   ├── tabs.tsx            ← Tab navigation
│   │   ├── badge.tsx           ← Badge/tags
│   │   ├── skeleton.tsx        ← Loading states
│   │   ├── progress.tsx        ← Progress bars
│   │   ├── select.tsx          ← Select dropdowns
│   │   ├── table.tsx           ← Data tables
│   │   └── ... (37 more standard shadcn/ui)
│   └── views/
│       ├── landing-view.tsx           ← Public landing page (hero, features, auth)
│       ├── dashboard-view.tsx         ← User dashboard (KPIs, charts, lists)
│       ├── contract-list-view.tsx     ← Contract list (search, filters, cards)
│       ├── contract-upload-view.tsx   ← Upload form (drag-drop, metadata)
│       ├── contract-analysis-view.tsx ← Analysis page (clauses, tabs, gauge)
│       ├── templates-view.tsx         ← Templates list + builder
│       ├── settings-view.tsx          ← User settings (profile, password, billing)
│       ├── billing-view.tsx           ← Subscription plans + Stripe checkout
│       ├── shared-contract-view.tsx   ← Public shared analysis (no auth)
│       ├── admin-views.tsx            ← Admin: analytics, users, contracts
│       └── admin-settings-view.tsx    ← Admin: AI config, plans, maintenance
└── lib/
    ├── store.ts                ← Zustand state (view routing, user session)
    ├── types.ts                ← TypeScript interfaces
    ├── constants.ts            ← Colors, risk levels, contract types
    └── api-client.ts           ← Fetch wrapper (GET/POST/PATCH/DELETE)
```

## What to Redesign (Priority Order)

### Tier 1 — Core Design System (change these to rebrand everything)
1. `src/app/globals.css` — All colors, shadows, animations, design tokens
2. `src/app/layout.tsx` — Fonts, metadata
3. `src/components/ui/button.tsx` — Button variants (shapes, colors)
4. `src/components/ui/card.tsx` — Card styling
5. `src/components/ui/input.tsx` — Input styling

### Tier 2 — Layout & Navigation
6. `src/components/app/app-shell.tsx` — Sidebar, header, nav, user menu
7. `src/components/shared/risk-badge.tsx` — Risk level pills
8. `src/components/shared/risk-gauge.tsx` — Risk score gauge

### Tier 3 — All Page Views (11 files)
9. `src/components/views/landing-view.tsx` — Landing page
10. `src/components/views/dashboard-view.tsx` — Dashboard
11. `src/components/views/contract-list-view.tsx` — Contracts list
12. `src/components/views/contract-upload-view.tsx` — Upload page
13. `src/components/views/contract-analysis-view.tsx` — Analysis page (BIGGEST - 1024 lines)
14. `src/components/views/templates-view.tsx` — Templates
15. `src/components/views/settings-view.tsx` — Settings
16. `src/components/views/billing-view.tsx` — Billing/pricing
17. `src/components/views/admin-views.tsx` — Admin panel (3 views in 1 file)
18. `src/components/views/admin-settings-view.tsx` — Admin settings
19. `src/components/views/shared-contract-view.tsx` — Public shared view

### Don't Need to Redesign
- `src/components/ui/*` (49 files) — Standard shadcn/ui, auto-generated
- `src/lib/store.ts` — State logic, no visual
- `src/lib/types.ts` — TypeScript types, no visual
- `src/lib/constants.ts` — Data constants (but risk colors are here)
- `src/lib/api-client.ts` — API logic, no visual

## Design Tokens (in globals.css)

Current theme: Dark analytics (deep black #0a0a0a, teal #00b4d8, orange #ff6b35)

```css
--background: #0a0a0a;
--card: #161616;
--primary: #00b4d8;       /* teal */
--accent: #ff6b35;        /* orange */
--border: #262626;
--muted-foreground: #8a8a8a;
--radius: 0.75rem;
```

## Data Flow

1. `page.tsx` checks auth session → shows LandingView OR AppShell
2. AppShell renders sidebar + header + the active view
3. View state managed by Zustand store (`store.ts`)
4. Views call APIs via `api-client.ts`
5. API routes return JSON from Prisma database

## Key API Endpoints (for reference)

```
POST   /api/auth/register          — Create account
POST   /api/auth/callback/credentials — Login (NextAuth)
GET    /api/auth/session           — Get session
GET    /api/contracts              — List contracts
POST   /api/contracts              — Upload contract
GET    /api/contracts/[id]         — Get contract detail
POST   /api/contracts/[id]/analyze — Run AI analysis
POST   /api/contracts/[id]/share   — Generate share link
GET    /api/contracts/[id]/report  — Download HTML report
GET    /api/dashboard/stats        — Dashboard data
GET    /api/admin/analytics        — Admin analytics
POST   /api/stripe/checkout        — Stripe checkout
POST   /api/stripe/webhook         — Stripe webhooks
```
