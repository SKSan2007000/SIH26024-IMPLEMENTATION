# CoalGuard AI — SIH26024: Production Login Connectivity & CORS Fix Report

**Project**: CoalGuard AI (Smart Mine Governance & Compliance Monitoring System)  
**Target Environment**: Vercel (Frontend SPA) + Railway (Backend API)  
**Production URLs**:
- **Frontend**: [https://sih-26024-implementation.vercel.app](https://sih-26024-implementation.vercel.app)
- **Backend**: [https://sih26024-implementation-production-3369.up.railway.app](https://sih26024-implementation-production-3369.up.railway.app)

---

## 1. Executive Summary & Root Cause Analysis

### A. The "Failed to Fetch" Problem on Vercel Frontend
When users clicked "Sign In" on the deployed Vercel frontend, the UI displayed **`Failed to fetch`**.

#### Root Causes Identified:
1. **Missing Production Environment Variable at Build Time**:
   - In Vite applications, `import.meta.env.VITE_API_URL` is statically inlined during `npm run build`.
   - On Vercel, `VITE_API_URL` was not configured in the Vercel Project Environment Variables, nor was there a committed `.env.production` file.
   - Consequently, `getRawApiUrl()` in [`AuthContext.tsx`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/frontend/src/services/AuthContext.tsx) evaluated to `""` (empty string).
   - `getApiBaseUrl()` defaulted to relative `"/api"`.
   - The compiled JavaScript bundle sent client requests to:
     `POST https://sih-26024-implementation.vercel.app/api/auth/login`

2. **Vercel SPA Rewrites Returned HTTP 405 Method Not Allowed**:
   - `vercel.json` configured a catch-all rewrite rule `{"source": "/(.*)", "destination": "/index.html"}` without an `/api` proxy rule.
   - Vercel's static asset server routed `POST /api/auth/login` to `/index.html`, which rejected `POST` requests to static files with **`HTTP 405 Method Not Allowed`**.
   - The browser `fetch()` call caught this rejection and surfaced the generic JavaScript network error: **`Failed to fetch`**.

3. **Backend CORS Origin Restrictions**:
   - In [`backend/app/core/config.py`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/backend/app/core/config.py), `CORS_ORIGINS` default list only contained localhost development ports (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, `http://127.0.0.1:3000`).
   - The production frontend origin `https://sih-26024-implementation.vercel.app` was absent from the default CORS origin list.
   - Without `CORS_ORIGINS` explicitly configured in Railway environment variables, Starlette's `CORSMiddleware` would reject preflight `OPTIONS` requests from the Vercel domain.

4. **Railway Deployment Build Context Failure**:
   - In `railway.json`, the builder was set to `DOCKERFILE` pointing to `backend/Dockerfile`.
   - `backend/Dockerfile` contained `COPY requirements.txt .`. When Railway executed the Docker build using the repository root as context, `requirements.txt` was missing at root level (it was located only in `backend/requirements.txt`), causing the Docker build to fail.
   - Furthermore, running `uvicorn app.main:app` without `backend` on `PYTHONPATH` resulted in `ModuleNotFoundError: No module named 'app'`.

---

## 2. Changes Made & Exact Fixes

### 1. Frontend Environment & Production Fallback
- **File**: [`frontend/src/services/AuthContext.tsx`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/frontend/src/services/AuthContext.tsx)
  - Hardened `getRawApiUrl()` with a dual-layer production fallback:
    ```typescript
    export const getRawApiUrl = (): string => {
      const env = import.meta.env;
      const url = (env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || '') as string;
      if (url && typeof url === 'string' && url !== 'undefined' && url !== 'null' && url.trim() !== '') {
        return url.trim();
      }
      // Production fallback: Ensures the deployed frontend connects to Railway even if
      // the Vercel build environment omitted the variable.
      if (env.PROD || (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || !window.location.hostname.includes('localhost')))) {
        return 'https://sih26024-implementation-production-3369.up.railway.app';
      }
      return '';
    };
    ```
  - Preserved existing contract: `getApiBaseUrl()` appends `/api` when not present, and never duplicates `/api/api`.
  - Stored `user.email` and `user.id` properly in `authUser`.
  - Updated `authFetch()` so valid sessions are **not** cleared when receiving `403 Forbidden` (role permission checks), restricting auto-logout strictly to `401 Unauthorized` credential invalidation.

- **File**: [`frontend/.env.production`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/frontend/.env.production) & [`frontend/.env`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/frontend/.env)
  - Created and committed with:
    ```env
    VITE_API_URL=https://sih26024-implementation-production-3369.up.railway.app
    ```

- **File**: [`frontend/.env.example`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/frontend/.env.example)
  - Updated documentation with the verified Railway backend URL.

### 2. Vercel Reverse Proxy Rewrites
- **Files**: [`frontend/vercel.json`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/frontend/vercel.json) & [`vercel.json`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/vercel.json)
  - Added an `/api/(.*)` rewrite to proxy directly to the Railway backend:
    ```json
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "rewrites": [
        {
          "source": "/api/(.*)",
          "destination": "https://sih26024-implementation-production-3369.up.railway.app/api/$1"
        },
        {
          "source": "/(.*)",
          "destination": "/index.html"
        }
      ]
    }
    ```
  - This provides zero-failure redundancy: both direct cross-origin API calls and relative `/api` calls resolve cleanly without 405 errors.

### 3. Backend CORS & Routing Configuration
- **File**: [`backend/app/core/config.py`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/backend/app/core/config.py)
  - Added `https://sih-26024-implementation.vercel.app` and `https://sih26024-implementation-production-3369.up.railway.app` explicitly into `CORS_ORIGINS`.
  - Updated default `FRONTEND_URL` to `https://sih-26024-implementation.vercel.app`.

- **File**: [`backend/app/main.py`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/backend/app/main.py)
  - Registered CORS middleware with:
    - Explicit `allow_origins=cors_origins` (including `https://sih-26024-implementation.vercel.app`)
    - `allow_credentials=True`
    - `allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"]`
    - `allow_headers=["*"]`
    - `expose_headers=["*"]`
    - `max_age=86400` (preflight caching)
  - Mounted `auth.router` on `/auth` in addition to `/api/auth` and `/api/v1/auth` for complete backwards compatibility.

- **File**: [`backend/.env.example`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/backend/.env.example)
  - Synchronized CORS origin documentation.

### 4. Railway Build & Docker Context Hardening
- **File**: [`backend/Dockerfile`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/backend/Dockerfile)
  - Added multi-context support for `requirements.txt` (works whether Docker context is root or `backend`).
  - Added `ENV PYTHONPATH=/app/backend:/app:$PYTHONPATH`.
  - Added resilient startup command navigating into `backend` if present.
- **File**: [`requirements.txt`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/requirements.txt)
  - Placed root copy of `requirements.txt` for root-level Docker and Nixpacks detection.
- **Files**: [`railway.json`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/railway.json), [`backend/railway.json`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/backend/railway.json), [`Procfile`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/Procfile), [`backend/Procfile`](file:///C:/Users/B%20SANTHOSH%20KUMAR/Downloads/COALGUARD/COALGUARD/backend/Procfile)
  - Updated start commands to handle dynamic `PORT` assignment and directory resolution.

---

## 3. Verification & Test Execution Results

### Test 1: Frontend TypeScript & Production Build
```
> frontend@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
✓ 1224 modules transformed.
dist/index.html                  0.45 kB │ gzip:   0.29 kB
dist/assets/index-PeJhaS_g.css 125.68 kB │ gzip:  21.16 kB
dist/assets/index-CkGaosX6.js 2,071.84 kB │ gzip: 561.36 kB
✓ built in 1.02s
```
**Result**: **PASS (0 TypeScript errors, successful bundle creation)**

### Test 2: Bundle API URL Verification
Inspected `dist/assets/index-CkGaosX6.js`:
```javascript
VITE_API_URL: "https://sih26024-implementation-production-3369.up.railway.app"
```
**Result**: **PASS (Exact production Railway backend URL confirmed bundled)**

### Test 3: Backend Health Endpoint
```http
GET http://127.0.0.1:8000/health
HTTP/1.1 200 OK
{
  "status": "ok",
  "service": "CoalGuard AI API",
  "version": "2.0.0",
  "database": "ok",
  "ml_engine": "ok",
  "shap_engine": "ok",
  "governance_engine": "ok"
}
```
**Result**: **PASS (All engines report `ok`)**

### Test 4: OPTIONS CORS Preflight
```http
OPTIONS http://127.0.0.1:8000/api/auth/login
Origin: https://sih-26024-implementation.vercel.app
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type

HTTP/1.1 200 OK
access-control-allow-origin: https://sih-26024-implementation.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD
access-control-allow-headers: authorization, content-type
access-control-max-age: 86400
```
**Result**: **PASS (Preflight headers match exact frontend origin with credentials allowed)**

### Test 5: POST Login Execution & JWT Generation
```http
POST http://127.0.0.1:8000/api/auth/login
Origin: https://sih-26024-implementation.vercel.app
Content-Type: application/x-www-form-urlencoded

username=admin%40coalguard.local&password=admin123

HTTP/1.1 200 OK
access-control-allow-origin: https://sih-26024-implementation.vercel.app
access-control-allow-credentials: true

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...",
  "token_type": "bearer",
  "user_id": "a9745eea-796e-44da-9c4f-7aacd08aefc1",
  "role": "HEAD_ADMIN",
  "full_name": "Dr. Rajeshwar Sharma (Head Admin)",
  "email": "admin@coalguard.local",
  "mine_id": null,
  "mine_name": null,
  "department_id": null,
  "department_name": null,
  "region_id": null,
  "area_id": null
}
```
**Result**: **PASS (Access token created and returned with user profile metadata)**

### Test 6: Authenticated API Requests
1. Profile verification:
   ```http
   GET http://127.0.0.1:8000/api/auth/me
   Authorization: Bearer <token>
   
   HTTP/1.1 200 OK
   {"user_id":"a9745eea-796e-44da-9c4f-7aacd08aefc1","full_name":"Dr. Rajeshwar Sharma (Head Admin)","email":"admin@coalguard.local","role":"HEAD_ADMIN",...}
   ```
2. Core Governance Resource retrieval:
   ```http
   GET http://127.0.0.1:8000/api/mines/
   Authorization: Bearer <token>
   
   HTTP/1.1 200 OK
   (5 mines returned with complete coordinates and risk scores)
   ```
**Result**: **PASS (Authenticated token validation and resource retrieval confirmed)**

---

## 4. Git Commit & Deployment Status

- **Commit ID**: `12821981af06dc5da5617dd7573187dcb5b2f6d8`
- **Branch**: `main`
- **Commit Message**: `fix(auth): resolve Vercel to Railway login connectivity and CORS configuration`
- **Files Changed**: 15 files, +98 lines, -27 lines

### Action to Trigger Production Deployment:
To deploy these fixes to both Railway and Vercel automatically:
```bash
git push origin main
```
Both Railway and Vercel will trigger automated zero-downtime builds. Vercel will bundle the embedded `VITE_API_URL` and deploy the `/api` reverse-proxy rules, while Railway will build the backend container with full multi-context support.
