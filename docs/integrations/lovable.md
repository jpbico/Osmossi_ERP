# Lovable: storefront infrastructure and ERP reuse

Checked through the Lovable connector on 2026-11-11.

## 1. What the storefront runs on

| Item | Value |
|---|---|
| Lovable project | **Osmossi** (`8221713c-f888-4c9a-bdf4-0c87c0cd44d2`), published, workspace "Juan's Lovable" (Pro plan) |
| Frontend | Vite + React 18 + TypeScript, Tailwind, shadcn/ui, react-hook-form + zod, TanStack Query, zustand |
| Backend | **Lovable Cloud** (Supabase): Postgres, auth, edge functions |
| Roles | `user_roles` table, `app_role` enum (`admin`, `user`), `has_role()` security-definer function, RLS policies |
| Shopify | Edge function `shopify-storefront` proxies the **Storefront API** (public catalog and cart) for store `1wmmmh-zf.myshopify.com`, which is the same store the Shopify connector reads |
| Claude access | Edge function `mcp` exposes owner-only tools (visits summary, cart funnel, product activity, wishlist) backed by a `site_events` table |
| Design | Navy `#1B2A4A`, gold `#B8943E`, cream `#F2EDE3`, sand, terracotta; Lora typeface only |
| i18n | `LanguageContext` + `translations.ts`, English/Spanish |
| Tests | Vitest and Playwright |

## 2. What the ERP reuses

| Reused | How |
|---|---|
| Stack and libraries | Identical (CLAUDE.md §7). |
| Lovable Cloud | Same platform, **separate project and database** (see CLAUDE.md §7 for why). |
| Auth and roles pattern | Copy `user_roles` + `has_role()` + RLS; ERP roles `admin` and `partner`. |
| Shopify edge-function pattern | Same proxy structure, but calling the **Admin API** with a secret custom-app token (the storefront's Storefront API token can't read costs, orders, or payouts). |
| MCP pattern | ERP exposes owner-only MCP tools (capital accounts, contributions, later KPIs) so Claude can query it. |
| Storefront activity data | For the KPI module (conversion rate, funnel), read the storefront's MCP tools (`get-visits-summary`, `get-cart-funnel`). The "Osmossi" MCP is listed in the Lovable workspace connectors; it can also be added to Claude as a custom connector. |
| Brand | Same colors, font, and logo, so the ERP feels like part of Osmossi. |

## 3. Hosting the ERP: the GitHub constraint

Lovable's Git sync **always creates a new repository**; it can't link to an existing
one such as `jpbico/Osmossi_ERP`. Lovable can import code from a ZIP into a new project,
which then syncs to a new repository Lovable creates.
(Source: docs.lovable.dev/integrations/github, "Limitations", checked 2026-11-11.)

| Option | How it works | Pros | Cons |
|---|---|---|---|
| **A. ERP as a Lovable project (chosen 2026-11-11)** | Import this repo into a new Lovable project "Osmossi ERP" with Lovable Cloud; Lovable creates its GitHub repo; that repo becomes the single home for code **and** docs; this repo is archived. | Maximum reuse: same platform, billing, and editor as the storefront; partners can make small UI changes in Lovable; Claude works on the code through GitHub and on the project through the connector. | Repository changes; the "push to `main`" rule moves to the new repo. Lovable Cloud usage counts against the workspace plan. |
| B. ERP in this repo, own Supabase project | Build here; create a standalone Supabase project and deploy the frontend to a static host. | Everything stays in `jpbico/Osmossi_ERP`. | Doesn't reuse Lovable Cloud; separate accounts and billing; free Supabase projects pause when inactive; no Lovable editor. |

**Decision (2026-11-11): option A.** Lovable project **"Osmossi ERP"**
(`fb88b4d7-9ebd-448d-bc45-9a2e4f392f78`), with project knowledge set to the ERP rules.

Migration steps:
1. ✅ Create the Lovable project and build the foundation (auth, roles, partners, layout,
   brand, EN/ES).
   Done 2026-11-11 (6 credits). Framework is TanStack Start + React 19 (Lovable default).
   ⏳ **Owner action:** add Juan Pablo's account first (becomes admin), then turn off
   self-sign-up in Cloud → Users → Auth settings.
2. ⏳ **Owner action:** in the Lovable editor, connect the project to GitHub (Lovable
   creates the new repository).
3. Add that repository to Claude's sessions; push `CLAUDE.md`, `docs/`, `data/`,
   `templates/`, and `src/lib/partner-capital/` (with tests) to its `main` branch.
4. Move the "always push to `main`" rule to the new repository; mark this one as
   archived in its README.

## 4. Rules

- Sending a message to Lovable's agent spends workspace credits: confirm with the
  owners first.
- Never copy secrets (`.env`, tokens) out of the storefront project.
- The storefront is production. The ERP never changes storefront code or its database.
