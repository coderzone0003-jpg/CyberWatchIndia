# Deploy: Vercel (Frontend) + Render (Backend)

## 1. Backend on Render

1. Push code to GitHub.
2. Render → **New Web Service** → connect repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/ping`
4. Environment variables (Render dashboard):

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `JWT_SECRET` | strong random 32+ chars |
| `ADMIN_EMAIL` | your admin email |
| `ADMIN_PASSWORD` | strong password |
| `RESEND_API_KEY` | (optional) |
| `FROM_EMAIL` | (optional) |

5. Deploy. Copy backend URL: `https://your-api.onrender.com`

Or use the included `render.yaml` Blueprint.

---

## 2. Frontend on Vercel

1. Vercel → **New Project** → import same GitHub repo.
2. Settings:
   - **Root Directory:** `Frontend`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
3. Environment variables:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://your-api.onrender.com` |
| `REACT_APP_SUPABASE_URL` | same as backend |
| `REACT_APP_SUPABASE_ANON_KEY` | same as backend |

4. Deploy. Copy frontend URL: `https://your-app.vercel.app`

---

## 3. Link frontend ↔ backend

1. In **Render**, set `FRONTEND_URL` to your exact Vercel URL (no trailing slash).
2. Redeploy backend after changing `FRONTEND_URL`.

---

## 4. Supabase settings

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add:
  - `https://your-app.vercel.app/reset-password`
  - `https://your-app.vercel.app/**`

Run SQL migrations if not done:
- `backend/supabase/create-evidence-table.sql`
- Other setup SQL as needed

---

## 5. Create admin user

After backend is live, run locally (with production Supabase keys in `.env`):

```bash
cd backend
npm run create-admin
```

Then log in on the live site with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## 6. Verify deployment

- Backend: `https://your-api.onrender.com/ping` → `{ "status": "ok" }`
- Frontend: open `/login`, `/admin`, `/track` directly (no 404)
- Login as admin → admin dashboard loads
- Submit complaint with evidence → files upload to Supabase bucket

---

## Common issues

| Problem | Fix |
|---------|-----|
| CORS error | `FRONTEND_URL` on Render must match Vercel URL exactly |
| API calls to localhost | Set `REACT_APP_API_URL` on Vercel and redeploy |
| 404 on page refresh | `Frontend/vercel.json` SPA rewrites (included) |
| Admin 403 | Run `npm run create-admin`, log in with admin account |
| Render cold start slow | Free tier sleeps; first request may take ~30s |
| Password reset fails | Add Vercel URL to Supabase redirect allowlist |

---

**Developer:** MR SHUBHAM BHOJANE
