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

## Phase 2.5 — Final Human Interface polish ✅

Every screen refined without any structural changes. Design tokens updated everywhere, propagating to the whole system.

### Token refinements
- Deeper base ink (`#050A12`), softer aurora alphas, refined text scale (F5F7FA / C7D0DC / 8B95A5).
- Warmer semantic colors (danger `#E96B6B`, warning `#F5B454`) — never harsh.
- Two new shadow tiers (`card`, `floating`) and `glassSheen` tokens.

### Component elevations
- **GlassCard** — inner top-hairline sheen (bevelled glass), diagonal tint start/end for real depth, gold/emerald sheen variants.
- **AmbientBackground** — added a third deep-blue aurora bottom-right + a subtle top-fade for status-bar readability. Independent breathing phases for cinematic life.
- **HealthRing** — number counter animates from 0 → score, three-stop gradient (emerald → sage → gold), hairline divider + status word ("Excellent / Stable / Attention") in semantic color, wide low-opacity glow.
- **ActionCard** — softer separators (hairline instead of gradient borders), tightened typography, dedicated body row (icon + title), gold pill CTA with hairline highlight.
- **GlassTabBar** — thicker top-inner sheen, stronger floating shadow, 19px icons for optical balance.
- **ScreenHeader** — display 30 with -0.7 letter spacing, back button 38px chip.
- **LoadingOrb** — reused as the emotional anchor across Chat empty state, Onboarding, and Home loading.
- **EmptyState** (new) — premium reusable empty template used by Notifications, Sensors, Maintenance.

### Screen polish
- **Home** — no structural changes; benefits from all component elevations.
- **Portfolio** — cinematic image treatment (top + bottom gradient wash, top-left kind badge on the photo), taller 200px hero, richer meta typography.
- **Property Detail** — 380px hero with dual vertical gradients, floating kind badge, softer overlays.
- **Unified Brain** — the emotional center. Empty state features the breathing SPP orb, calm title + body, gold-dot suggestion cards. Softer glass bubbles, live emerald dot inside the input, animated typing dots, gold send button with glow.
- **Insights** — glowing gold bar chart on softer track, refined typography.
- **Predictive Maintenance** — cinematic timeline, EmptyState fallback.
- **Property Health** — thinner 3-pt bar accent, refined ranks.
- **Virtual Sensors** — 2-column tile grid (fixed wrap), refined value typography.
- **Notifications** — EmptyState with body copy.
- **Settings** — unchanged (already at target quality).
- **Onboarding** — unchanged (already at target quality).

### Consistency guarantees
- Feather icons everywhere. 14–20 px range only. Consistent stroke weight.
- Typography: eyebrow 10.5 letter-spacing 2, titles 30 letter-spacing -0.7, card titles 17, body 14, small 12.5.
- Uppercase micro-labels for all eyebrows.
- Every entrance uses `FadeInDown` with staggered delays 60–90ms.
- Every interaction has haptics.

## Phase 3 — pending (integration only, no rebuild)
- Existing Google Apps Script / Google Sheets backend.
- Existing SPP platform: Property Memory · Predictive Maintenance Engine · Sensor Engine · Virtual Sensors · Technician Engine · Green API · Home Assistant · OpenAI production layer.
- The current backend (`/app/backend/server.py`) is an integration seam — swap the data sources; the AI factory is already provider-agnostic.
