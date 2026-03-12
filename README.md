# UVibe

## Git Workflow

```bash
# Start of every work session
git pull origin main          # get latest from teammates

# ... make your changes ...

git add .
git commit -m "what you changed"
git push origin main          # send your changes up
```

Pull before you start, push when you're done.

If a teammate pushed while you were working, git will merge their changes with yours automatically. If you both edited the same file in the same place, git will flag a conflict and ask you to resolve it.

Each person should work on their own branch:

```bash
git checkout -b your-name/feature-name    # create your branch
# ... do work ...
git push origin your-name/feature-name
# then open a Pull Request on GitHub to merge into main
```

That way `main` stays stable and nothing breaks for teammates mid-work.

---

A mobile-first UV index tracker that gives you real-time UV conditions, today's peak window, and sunset time — all based on your current location.

Built with **FastAPI** (Python) + **Nuxt 4** (Vue 3).

---

## What it does

- Detects your location and fetches the current UV index from OpenWeather
- Shows today's peak UV value and the hours it will be elevated (location-specific, not a generic guideline)
- Displays local sunset time for your coordinates
- Shows an alert banner when UV is forecast to reach Moderate (≥3) or above
- JWT-based authentication — register, log in, and delete your account

---

## Project Structure

```
my-project/
├── backend/                  # FastAPI + SQLAlchemy + JWT auth
│   ├── main.py               # App entry point, all routes
│   ├── auth.py               # Password hashing, JWT encode/decode
│   ├── models.py             # SQLAlchemy models (User, UVReading)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── database.py           # DB engine, session, get_db dependency
│   ├── uv_service.py         # OpenWeather One Call API + reverse geo
│   ├── seed.py               # Seeds a test user (dev only)
│   ├── test_auth.py          # pytest test suite
│   ├── requirements.txt
│   ├── .env                  # Local secrets (never committed)
│   └── .env.example          # Template for required env vars
└── frontend/                 # Nuxt 4 + Pinia + Tailwind CSS
    └── app/
        ├── pages/
        │   ├── index.vue         # Home — live UV, peak window, sunset
        │   ├── login.vue         # /login
        │   ├── register.vue      # /register
        │   ├── dashboard.vue     # /dashboard (protected)
        │   ├── insights.vue      # /insights (in progress)
        │   └── protect.vue       # /protect (in progress)
        ├── components/
        │   ├── UVDisplay.vue     # Animated UV index circle
        │   ├── AppHeader.vue
        │   ├── AppSidebar.vue
        │   └── BottomNav.vue
        ├── composables/
        │   └── useGeolocation.ts # Browser geolocation wrapper
        ├── stores/
        │   └── auth.ts           # Pinia auth store (token in memory)
        └── middleware/
            └── auth.ts           # Route guard → redirects to /login
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- An [OpenWeather](https://openweathermap.org/) account with **One Call API 3.0** activated

---

## Backend Setup

```bash
cd my-project/backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the env template and fill in your values
cp .env.example .env
```

Edit `backend/.env`:

```env
SECRET_KEY=your-secret-key         # generate: python -c "import secrets; print(secrets.token_hex(32))"
DATABASE_URL=sqlite:///./app.db    # or your PostgreSQL URL for production
OPENWEATHER_API_KEY=your-key-here
ALLOWED_ORIGINS=http://localhost:3000
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

---

## Frontend Setup

```bash
cd my-project/frontend

# Install dependencies
npm install
```

The frontend reads `NUXT_PUBLIC_API_BASE` to know where the backend is. In development this defaults to `http://localhost:8000` (set in `nuxt.config.ts`). For production, set it as an environment variable:

```env
NUXT_PUBLIC_API_BASE=https://your-backend.onrender.com
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Running Both Together

Open two terminals:

**Terminal 1 — Backend**
```bash
cd my-project/backend
.venv\Scripts\activate        # or: source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd my-project/frontend
npm run dev
```

---

## API Reference

All protected routes require `Authorization: Bearer <token>` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Create account, returns JWT |
| `POST` | `/api/auth/login` | No | Returns JWT |
| `GET` | `/api/user/profile` | Yes | Returns id, name, email |
| `DELETE` | `/api/user/account` | Yes | Deletes account and all UV readings |
| `GET` | `/api/uv?lat=&lon=` | Yes | Current UV, peak window, sunset for coordinates |

### UV Response

```json
{
  "uv_index": 4,
  "location_name": "Melbourne, Victoria",
  "latitude": -37.8136,
  "longitude": 144.9631,
  "recorded_at": "2026-03-12T10:30:00",
  "sunset": "2026-03-12T08:45:00Z",
  "peak_window": "11 am – 4 pm",
  "peak_uv": 7.0
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | Yes | — | JWT signing key. App won't start without this. |
| `DATABASE_URL` | No | `sqlite:///./app.db` | SQLAlchemy connection string |
| `OPENWEATHER_API_KEY` | Yes | — | One Call API 3.0 key |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS origins |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_HOURS` | No | `24` | Token lifetime |
| `SEED_DB` | No | `false` | Set to `true` in dev to seed a test user |

---

## Running Tests

```bash
cd my-project/backend
.venv\Scripts\activate   # or: source .venv/bin/activate

# Requires SEED_DB=true or a test user already in the DB
SEED_DB=true pytest test_auth.py -v
```

Expected output:
```
test_auth.py::test_login_correct_credentials PASSED
test_auth.py::test_login_wrong_credentials   PASSED
test_auth.py::test_profile_without_token     PASSED
test_auth.py::test_profile_with_valid_token  PASSED

4 passed
```

---

## Deployment Notes

- **Backend** — deploys to [Render](https://render.com) as a Python web service. Set all env vars in the Render dashboard. `DATABASE_URL` will be your Render PostgreSQL connection string.
- **Frontend** — deploys to Vercel or Netlify. Set `NUXT_PUBLIC_API_BASE` to your Render backend URL.
- **CORS** — add your frontend's production URL to `ALLOWED_ORIGINS` in Render env vars (comma-separated if multiple).
- **Secret key** — generate a fresh one for production: `python -c "import secrets; print(secrets.token_hex(32))"`
