# SPP — Smart Property Platform (PRD)

## Vision
An **AI Operating System for Real Estate**. The AI is the product; screens are windows into intelligence. Every screen answers "What should I do next?" instead of "What data do you want to see?"

## Phase 1 — Design System + AI Employee Home ✅
- Dark Luxury tokens (`/app/frontend/src/theme/tokens.ts`).
- Component library (`GlassCard`, `HealthRing`, `ActionCard`, `AmbientBackground`, `LoadingOrb`, `GlassTabBar`, `StatPill`, `ScreenScaffold`, `ScreenHeader`).
- AI Employee Home — cinematic hero, animated ring, ranked action cards, ambient scroll parallax, floating tab bar.

## Phase 2 — Full platform ✅

### Navigation
- **Bottom glass tab bar** — Home / Portfolio / Brain / Insights (max 4 tabs per design spec).
- **Stack routes** for deeper screens: property/[id], maintenance, health, sensors, notifications, settings, onboarding.
- Onboarding gated by AsyncStorage on first launch.

### Screens
1. **AI Employee Home** (`/`) — daily briefing, health snapshot, ranked priorities, Ask the Brain, quick nav.
2. **Portfolio** (`/portfolio`) — chip filters (All/Attention/Stable), premium property cards with health pill and KPIs.
3. **Property Detail** (`/property/[id]`) — full-bleed hero, health + KPI row, tabbed Overview/Sensors/Timeline.
4. **Unified Brain** (`/brain`) — GPT-5.2 chat with system prompt, suggested prompts, glass bubbles, gold send button, KeyboardAvoidingView.
5. **Insights / Analytics** (`/insights`) — annualized revenue + composite health, revenue bar chart per property, occupancy + signal stats, AI activity summary.
6. **Predictive Maintenance** (`/maintenance`) — cinematic timeline of upcoming interventions with reasoning, impact and confidence.
7. **Property Health** (`/health`) — composite ring, ranked list of properties with in-line score bars.
8. **Virtual Sensors** (`/sensors`) — status-filtered grid of premium sensor tiles.
9. **Notifications** (`/notifications`) — priority-coded inbox.
10. **Settings** (`/settings`) — Language (EN/AR + RTL), Appearance, Brain (model = GPT-5.2, Universal Key = Active).
11. **Onboarding** (`/onboarding`) — 3-slide horizontal pager with breathing orb, gold CTA, page dots.

### Internationalization
- English + Arabic with `useI18n()` hook (`/app/frontend/src/i18n/index.ts`).
- Language persisted to AsyncStorage; RTL toggled via `I18nManager` (relaunch takes effect on native).

### Backend
- FastAPI + Motor + MongoDB.
- Modular AI layer — `get_llm_chat()` factory currently binds `openai/gpt-5.2` via **Emergent Universal LLM Key**. Provider/model swap in one line.
- Endpoints: `/api/briefing`, `/api/properties[/{id}]`, `/api/decisions`, `/api/tenants`, `/api/contracts`, `/api/timeline`, `/api/sensors`, `/api/notifications`, `/api/chat`, `/api/chat/{session_id}`.
- Chat degrades gracefully when the Universal Key budget is exhausted.
- Rich seed data on first launch — 4 properties, 4 tenants, 4 contracts, 4 AI decisions, 6 sensors, timeline, notifications.

### Design language reused across every screen
- `AmbientBackground` with scroll-driven aurora parallax.
- `ScreenScaffold` + `ScreenHeader` for consistent hero and safe area.
- `GlassCard` with gold / emerald edges for hierarchy.
- Feather icons throughout for minimal, consistent stroke weight.
- Staggered fade-in-down entrances everywhere; haptics on every interaction.

## Deferred (v3)
- Authentication (owner explicitly deferred for v1).
- Push notifications (build-time only).
- Real-time streaming for chat (backend factory supports it).
- Home Assistant / IoT / WhatsApp bridges.
