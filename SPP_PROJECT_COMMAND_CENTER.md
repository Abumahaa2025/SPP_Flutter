# SPP Project Command Center  

## 1. Project Identity

Project name: SPP — Smart Property Platform

SPP is not a property management app.

SPP is an AI-powered Smart Property Operating System.

The goal is not to display data.
The goal is to guide the property owner toward the best decision.

The owner should not ask:
"What should I check?"

SPP should answer:
"I already checked everything. Here is what needs your attention today."

---

## 2. Core Product Philosophy

SPP does not describe problems.
SPP recommends actions.

Every screen must answer:

1. What is happening?
2. Why does it matter?
3. What should the owner do now?

If a screen only displays data, it is incomplete.

---

## 3. Official Roles

### Emergent
Responsible for:
- Frontend
- UI/UX
- Design system
- Mobile app experience
- Visual polish

Emergent must not handle deep backend integrations unless explicitly requested.

### Source
Responsible for:
- Backend
- Google Apps Script integration
- Google Sheets live data
- API endpoints
- Data mapping
- Testing
- Technical fixes

Source must not redesign the frontend.

### ChatGPT / Elham
Responsible for:
- Product direction
- Roadmap decisions
- Reviewing outputs
- Preventing scope drift
- Writing official instructions
- Approving or rejecting phases

### Founder
Responsible for:
- Vision
- Final approval
- Business direction
- Customer feedback

---

## 4. Current Technical Baseline

Repository:
Abumahaa2025/SPP_Flutter

Active branch:
conflict_030726_0550

Frontend:
Frozen. No redesign unless explicitly approved.

Backend:
Live Google Sheets integration is active.

Google Apps Script:
Connected and returning anonymous JSON.

MongoDB:
Optional only. Must not block startup.

---

## 5. Completed Phases

### Phase 1 — Visual Identity
Status: Closed

Delivered:
- Dark luxury design system
- Glass UI
- SPP BrandOrb
- AI Executive Home
- Premium animations

### Phase 2 — Product Surface
Status: Closed

Delivered:
- Portfolio
- Property Detail
- Brain
- Insights
- Maintenance
- Health
- Sensors
- Notifications
- Settings
- Profile
- Onboarding

### Phase 3 — Frontend Freeze
Status: Closed

Delivered:
- Final UX polish
- Arabic RTL
- Settings and profile
- No warnings
- Frontend frozen

### Phase 4 — Live Data Foundation
Status: Closed

Delivered:
- Google Apps Script anonymous access
- Google Sheets live data
- Backend adapters
- Properties live
- Tenants live
- Contracts live
- Reports live
- Decisions live
- Notifications live
- Mongo optional

### Phase 5 — Brain V1
Status: Closed

Delivered:
- Brain no longer describes data
- Brain recommends actions
- No negative day values
- Professional property manager language

### Phase 6 — Executive Brain V2
Status: In Progress

Goal:
Turn Brain into a daily executive manager.

Current task:
Connect /api/executive to the existing frontend without redesign.

---

## 6. Non-Negotiable Rules

1. Do not restart the project.
2. Do not rebuild completed screens.
3. Do not redesign the frontend.
4. Do not modify stable code without a clear reason.
5. Do not add features while the current phase is unfinished.
6. Do not mix design work with backend integration work.
7. Do not use demo data when live data exists.
8. Every phase must end with:
   - files changed
   - endpoints affected
   - tests run
   - proof of result

---

## 7. Product Quality Standard

SPP must feel like:

- Apple-level calm
- Linear-level clarity
- Tesla-level intelligence
- Notion-level simplicity
- Executive-assistant-level usefulness

The product must never feel like:
- A spreadsheet
- A dashboard
- A template
- A CRUD app
- A demo

---

## 8. Brain Standard

Brain must always answer:

What should the owner do today?

Every recommendation must include:

- Decision
- Reason
- Expected outcome
- Priority

Brain must not expose raw technical data to the user.

Bad:
"Contract ends in -961 days."

Good:
"The contract is long overdue and needs immediate renewal follow-up."

Better:
"Call the tenant today and open the renewal file immediately."

---

## 9. Current Priority

Do not start new features.

Current priority:

Connect /api/executive to the existing frontend.

Expected user experience:

When the owner opens SPP, they should immediately see:

1. What should I do today?
2. Why does it matter?
3. What happens if I act?

---

## 10. Future Roadmap

Do not start these yet.

Upcoming future phases:

1. Owner API
2. Notifications refinement
3. File Upload Intelligence
4. PDF / Excel / Invoice understanding
5. Property Memory
6. Predictive Maintenance
7. Green API WhatsApp
8. Home Assistant
9. Supabase migration
10. n8n automations
11. Global Country Intelligence
12. Multi-language Brain

---

## 11. Global Vision

SPP will eventually support multiple countries.

The system should not only translate language.

It should adapt to:
- local real estate laws
- lease culture
- rent cycles
- maintenance norms
- owner expectations

This future layer is called:

Country Intelligence

Do not implement now.
Only keep architecture open for it.

---

## 12. Final Principle

The owner does not manage the app.

The app manages the owner's day.

SPP is successful when the owner opens it for 30 seconds and knows exactly what to do next.
