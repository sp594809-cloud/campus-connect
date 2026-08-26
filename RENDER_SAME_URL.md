# Put Campus Connect on your existing Render URL

Goal: `https://python-41vy.onrender.com` opens **Campus Connect** (not the Flask course home).
Python lessons still load inside Campus → **Courses** (from the `python` GitHub repo).

You do **not** create a new public URL. You **reconfigure the same Web Service**.

---

## 1. Merge this branch into `main`

Merge `feature/render-same-url` (or use the PR) so `main` has:

- `frontend` build → `dist`
- `serve` package + `start:prod`
- `render.yaml`

---

## 2. Reconfigure the existing service (same URL)

1. Open [Render Dashboard](https://dashboard.render.com) → your service (**python-41vy** / python mastery).
2. **Settings** → **Build & Deploy**:

| Setting | New value |
|--------|-----------|
| **Repository** | `sp594809-cloud/campus-connect` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Runtime** | **Node** (not Python) |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Start Command** | `npx serve -s dist -l tcp://0.0.0.0:$PORT` |

3. **Environment** → add (required for Campus login):

| Key | Value |
|-----|--------|
| `NODE_VERSION` | `20` |
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your Supabase anon/publishable key |

> Vite bakes these in at **build** time. After changing them, trigger a **manual redeploy**.

4. **Save** → **Manual Deploy** → clear build cache if the first try fails.

5. Wait until status is **Live**. Open:

   `https://python-41vy.onrender.com`

   You should see **Campus Connect**, not the old Flask course home.

6. Sign in → **Campus** → **Courses** → Python modules.

---

## 3. What happens to the old Python course site

| Item | Status |
|------|--------|
| Same Render URL | Now serves **Campus** |
| Flask app | No longer started by this service |
| Lesson markdown in `python` repo | Still used by Campus Courses |
| Old Flask-only UI | Not on this URL anymore |

---

## 4. If deploy fails

- **ERESOLVE / date-fns** → ensure Build Command includes `--legacy-peer-deps`.
- **Missing Supabase env** → app may crash on load; set both `VITE_*` vars and redeploy.
- **404 on refresh** → start command must use `serve -s` (SPA mode).
- **Wrong app still showing** → confirm Repository is `campus-connect` and Root Directory is `frontend`.

---

## 5. Optional: free tier sleep

On Render free plan the service sleeps when idle. First open after sleep can take ~30–60s.
