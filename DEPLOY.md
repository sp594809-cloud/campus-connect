# Deploy Campus Connect

Campus Connect is a **Vite + React** frontend that uses **Supabase** for auth and data.
The **Python Mastery** course is built **into the app** (no separate Flask site required for students).

Course markdown is loaded from:
`https://raw.githubusercontent.com/sp594809-cloud/python/main/python-course-app/content/`

You can later stop the old Render Python service if you no longer need it for anything else.

---

## 1. Supabase (required)

1. Create a project at [supabase.com](https://supabase.com).
2. Apply SQL migrations under `frontend/supabase/migrations/` (SQL Editor or CLI).
3. Enable Auth providers you need (Email, etc.).
4. Copy **Project URL** and **anon / publishable key**.

---

## 2. Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon / publishable key |
| `VITE_NEWS_API_KEY` | No | Company news |
| `VITE_REVIEW_API_KEY` | No | Company reviews |

See `frontend/.env.example`.

Local:

```bash
cd frontend
cp .env.example .env
# edit .env
npm install
npm run dev
```

---

## 3. Deploy frontend (pick one)

### Vercel (recommended)

1. Import `sp594809-cloud/campus-connect`.
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Add env vars above.
6. Deploy.

`frontend/vercel.json` rewrites all routes to `index.html` (React Router).

### Render — Static Site

1. New **Static Site** → connect this repo.
2. **Root Directory:** `frontend`
3. **Build:** `npm install && npm run build`
4. **Publish:** `dist`
5. Add the same env vars.
6. SPA: add a rewrite rule `/*` → `/index.html` if the UI offers it.

### Netlify

- Base: `frontend`
- Build: `npm run build`
- Publish: `frontend/dist`
- `_redirects` or netlify.toml: `/* /index.html 200`

---

## 4. Verify after deploy

1. Open the site → sign up / log in.
2. Complete onboarding if prompted.
3. Open **Campus** → **Courses**.
4. You should see **10 Python modules** (native UI, not an iframe).
5. Open Module 01 — lessons should load from GitHub raw content.
6. **Mark complete** — progress stays in the browser (`localStorage`).

---

## 5. Optional: retire old Python Render app

Students no longer need `https://python-41vy.onrender.com` for Campus.
Keep the **`python` GitHub repo** — it is still the source of `.md` lessons.
Suspend the Render **Web Service** when you are ready to avoid free-tier cold starts / confusion.

---

## 6. Notes

- Progress is **per device** (localStorage). Cloud progress can be added later with a Supabase table.
- Modules 04–10 may still be short placeholders until you expand content in the `python` repo.
- Do not commit real secrets; rotate any keys that were ever committed in `.env` files.
