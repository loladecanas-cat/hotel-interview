# AGENTS.md

Guidance for AI coding agents working on the **hotel-interview** codebase — a hotel booking system used to practise automation testing in the AI era.

---

## Project overview

A full-stack monorepo with:
- **Backend** — Python / FastAPI on `localhost:8000` (in-memory store, no database)
- **Frontend** — React 18 + TypeScript + Vite on `localhost:8080` (proxies `/api/*` to the backend)
- **Tests** — Playwright + TypeScript (32 tests across 4 spec files)

---

## Commands

```bash
# Start both servers (backend + frontend)
./start.sh

# Backend only
cd backend && source .venv/bin/activate && python -m uvicorn main:app --port 8000 --reload

# Frontend only
cd frontend && npm run dev

# Run all Playwright tests (auto-starts servers, resets state)
npm test

# Run a single spec file
npx playwright test tests/booking.spec.ts

# Run tests with UI mode
npm run test:ui
```

---

## Project structure

```
hotel-interview/
  backend/
    main.py              # All FastAPI routes + in-memory store (single file)
    requirements.txt
  frontend/
    vite.config.ts       # Port 8080, /api proxy → :8000
    src/
      App.tsx            # BrowserRouter + Guard (auth redirect)
      api.ts             # Typed fetch wrapper — all API calls go here
      session.ts         # localStorage helpers (getUser, setUser, clear)
      types.ts           # Shared TypeScript interfaces
      components/
        Header.tsx
      pages/
        LoginPage.tsx
        HotelsPage.tsx
        HotelPage.tsx
        BookPage.tsx
        ConfirmPage.tsx
        MyBookingsPage.tsx
  tests/
    fixtures.ts          # loginAs(), createBooking(), DATES constants
    globalSetup.ts       # Resets server state before every run
    auth.spec.ts
    hotels.spec.ts
    booking.spec.ts
    my-bookings.spec.ts
  playwright.config.ts   # webServer auto-starts both servers
  start.sh
```

---

## Backend conventions

- **Single file**: all routes live in `backend/main.py`. Do not split into routers unless the file exceeds ~400 lines.
- **In-memory store**: the `store` dict holds users and bookings. There is no database. State resets when the server restarts or when `POST /api/reset` is called.
- **Snake_case** for all JSON keys — FastAPI/Pydantic default. Never use camelCase in API responses.
- **Pydantic models** for every request body. Never read `request.json()` directly.
- **`POST /api/reset`** must stay — it is called by Playwright's `globalSetup` before every test run.
- Payment rule: a booking is accepted only when the card number ends in `6767`. This is intentional — do not change it.

### Adding a new route

```python
@app.get("/api/example")
def example(param: str = Query(...)):
    return {"result": param}
```

---

## Frontend conventions

- **No state management library** — use `useState` / `useEffect` only. Keep it simple.
- **`session.ts`** is the single source of truth for the logged-in user. Never read `localStorage` directly in components.
- **`api.ts`** is the single source of truth for HTTP calls. Never call `fetch` directly in components.
- **React Router v6** — use `useNavigate`, `useParams`, `useSearchParams`. No `window.location`.
- **Plain CSS** — all styles live in `src/styles/global.css`. No CSS modules, no Tailwind.
- **`data-testid` attributes are mandatory** on every interactive or meaningful element. Playwright tests rely exclusively on these selectors.

### data-testid naming rules

| Element type | Convention | Example |
|---|---|---|
| Inputs | `kebab-case` noun | `email-input`, `card-number` |
| Buttons | `btn-` prefix + action | `btn-continue`, `btn-confirm-booking` |
| Dynamic (per item) | suffix with ID | `btn-view-hotel-1`, `booking-ref-BND-0001` |
| Containers / cards | noun | `hotel-card`, `room-card`, `booking-card` |
| Error / status | `noun-error` or `noun-status` | `payment-error`, `booking-status` |

---

## Testing conventions

- **Fixtures first** — use `loginAs(page)` to authenticate without going through the UI. Use `createBooking(page, ...)` to seed data via API.
- **`DATES` constant** in `fixtures.ts` — each test concern has its own non-overlapping date window. Always add new windows here; never hardcode dates inline in spec files.
- **`globalSetup.ts` calls `POST /api/reset`** — this means all tests start from a clean store every run. Do not rely on data created in a previous test.
- **`fullyParallel: false`** — tests run sequentially in a single worker. The shared in-memory server is why.
- **`data-testid` selectors only** — never use CSS selectors, XPath, or text locators in tests. Use `page.getByTestId('...')`.
- **API calls for setup, UI for assertions** — create state via `page.request.post(...)`, then assert through the browser.

### Adding a new test

```typescript
import { test, expect } from '@playwright/test'
import { loginAs, createBooking, DATES } from './fixtures'

test('my new scenario', async ({ page }) => {
  const user = await loginAs(page)
  await page.goto('/hotels')
  await expect(page.getByTestId('hotel-card')).toHaveCount(3)
})
```

---

## Boundaries

- **Do not** add a database — keep the in-memory store.
- **Do not** add a CSS framework (Tailwind, Bootstrap, etc.) — use the existing `global.css`.
- **Do not** add Redux or Zustand — plain React state is intentional.
- **Do not** remove or rename `POST /api/reset` — it breaks the test suite.
- **Do not** change the `6767` payment rule — tests depend on it.
- **Do not** use text-based or CSS selectors in Playwright tests — `data-testid` only.
- **Do** keep `backend/main.py` as a single file.
- **Do** add `data-testid` to every new interactive element you create.
- **Do** add new date windows in `fixtures.ts > DATES` for every new test that books a room.
