# SPP — Smart Property Platform (PRD)

## Vision
An **AI Operating System for Real Estate**. The AI is the product; screens are windows into intelligence. Every screen answers "What should I do next?" instead of "What data do you want to see?"

## Positioning
Not a CRUD, not an ERP, not an admin dashboard. Feel closer to Apple / Linear / Arc / Stripe / Airbnb / Nothing OS / Tesla / Notion / Raycast / Revolut / Superhuman — but with its own unique visual identity.

---

## v1 delivered (Phase 1 — Design System + AI Employee Home)

### 1. SPP Design System (`/app/frontend/src/theme/tokens.ts`)
- **Color** — Deep navy surfaces `#060B14`, dark-smoked glass, premium gold `#D4AF37`, soft emerald `#50C878`, muted ink scale, gold/emerald edges & glows.
- **Typography** — strict scale (Display 32 / Title 22 / Card 18 / Body 15 / Small 13), Geist-style tight letter spacing.
- **Spacing** — 8pt grid with generous breathing (16 / 24 / 32 / 48 / 64).
- **Radius** — 10 / 18 / 26 / 34 / pill.
- **Shadows** — layered card + gold + emerald glow tokens.
- **Motion** — 180 / 320 / 520ms + 2.6s ambient breath.

### 2. Reusable Component Library (`/app/frontend/src/components/`)
- `AmbientBackground` — cinematic navy + slow-breathing emerald/gold light-leak orbs.
- `GlassCard` — dark smoked glassmorphism with inner sheen and gold/emerald edge variants.
- `HealthRing` — SVG circular progress with animated gradient stroke + emerald glow.
- `ActionCard` — priority-styled AI decision card with reasoning, impact, confidence, primary CTA.
- `GlassTabBar` — floating 4-tab glass bar (Home · Portfolio · Brain · Insights).
- `StatPill` — premium stat display.
- `Pulse` — breathing emerald status dot.

### 3. AI Employee Home Screen (`/app/frontend/app/index.tsx`)
- Ambient cinematic background with breathing gradient.
- SPP brand row + live pulse + notification.
- Hero greeting: time-aware salutation + "N actions need your attention." headline.
- Portfolio Health card: animated ring + occupancy / annualized revenue / sensor alerts.
- **Next Best Actions** — glassmorphic AI decision cards with recommended action CTAs.
- Ask the Unified Brain entry card.
- Floating glass tab bar (4 tabs).
- Entrance staggered fade-ins, haptics on every interaction.

### 4. Backend (`/app/backend/server.py`)
- FastAPI + Motor + emergent-integrations.
- Modular **AI layer** — currently `openai / gpt-5.2` via Emergent Universal Key; provider/model swappable in one place (`get_llm_chat`) without touching callers. Ready for Claude Sonnet 4.5 / Gemini 3 Pro.
- Rich seed data on first launch — 4 properties, 4 tenants, 4 contracts, 4 AI decisions, timeline, virtual sensors, notifications.
- Endpoints: `/api/briefing`, `/api/properties[/{id}]`, `/api/decisions`, `/api/tenants`, `/api/contracts`, `/api/timeline`, `/api/sensors`, `/api/notifications`, `/api/chat`, `/api/chat/{session_id}`.

---

## Phase 2 — pending owner approval, then build
1. **Unified Brain (chat screen)** — streaming GPT-5.2 chat with property memory grounding.
2. **Property detail** — health, sensors, timeline, contracts (AI-augmented, not CRUD tables).
3. **Portfolio** — cards feed, not a list.
4. **AI Decisions** — full stack of decisions with filters.
5. **Predictive Maintenance** — timeline of anticipated interventions.
6. **Virtual Sensors** — beautiful sensor tiles + trends.
7. **Analytics** — cinematic charts, not dashboards.
8. **Notifications inbox**.
9. **Onboarding** and premium loading/empty states everywhere.

## Notes
- Auth deferred to v2 per owner's directive.
- Emergent Universal LLM Key used for GPT-5.2; swappable model architecture is in place.
- No hardcoded URLs / secrets — everything reads from `.env`.
