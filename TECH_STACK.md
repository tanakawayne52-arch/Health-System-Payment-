works  # TECH_STACK.md — Health-System-Payment System

This document summarizes the technologies, languages, and frameworks used in the **Health-System-Payment--main** system.

---

## 1) Frontend (Web App)

### Languages
- **TypeScript** (`frontend/`)
  - Type checking and safer React development.
- **JavaScript** (support tooling and build scripts)
  - Used in project scripts and utility files.
- **HTML**
  - React entry point and document template.
- **CSS / Tailwind CSS**
  - Styling for UI components.

### Frameworks / Libraries
- **React**
  - Component-based UI.
- **Vite**
  - Fast bundler/dev server.
- **React Router DOM**
  - Client-side routing.
- **TypeScript (tsc / tsc -b)**
  - Type checking and build.
- **Tailwind CSS**
  - Utility-first styling.
- **lucide-react**
  - Icon components.

### UI Component Structure
- **Local UI component set** under `frontend/components/ui/`
  - A collection of reusable UI primitives/components (cards, buttons, dialogs, tables, etc.).

---

## 2) Backend (PHP API)

### Languages
- **PHP**
  - Backend API implementation.

### Framework / Architecture
- **Custom lightweight routing / controller pattern**
  - Entry points:
    - `backend/php-api/index.php`
    - `backend/php-api/router.php`
    - Individual endpoint handlers:
      - `backend/php-api/login.php`
      - `backend/php-api/me.php`
      - `backend/php-api/beneficiaries.php`
      - `backend/php-api/batches.php`
      - `backend/php-api/cycles.php`
      - `backend/php-api/dashboard.php`

### Database
- **SQL schema + data scripts**
  - `backend/database/schema.sql`
  - `backend/database/data.sql`

(Actual database engine/config is defined by backend runtime configuration in `backend/php-api/config.php` and environment variables.)

---

## 3) Data / JSON Artifacts

- **JSON** files used as precomputed datasets or frontend resources.
  - Examples:
    - `frontend/public/data/*.json`
    - `backend/excel-output/*.json`

---

## 4) Tooling & Build/Dev Dependencies

### Frontend Tooling
- **Node.js / npm (and pnpm workspace)**
  - `frontend/package.json`, lockfiles included (`package-lock.json`, `pnpm-lock.yaml`).
- **ESLint**
  - Linting configuration in `frontend/eslint.config.js`.
- **PostCSS**
  - Used with Tailwind (`postcss.config.js`).

### Scripts / Helpers
- `frontend/read-excel.js` and `frontend/read-excel.cjs`
  - Helper scripts for Excel-to-JSON processing.
- `frontend/convert-json-to-ts.js`
  - Utility for converting JSON structures to TS types.

---

## 5) Authentication / Tokens (Implied)

- Backend returns **accessToken** and **refreshToken** in the login response (verified via `backend/php-api/test_endpoints.php`).
- Frontend stores current user and uses an API client in `frontend/src/lib/api`.

---

## 6) Summary Table

| Layer | Primary Tech | Notes |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | SPA web UI |
| UI | Custom `frontend/components/ui/*` + lucide-react | Reusable components and icons |
| Routing | react-router-dom | Client-side navigation |
| Backend | PHP | API endpoints via custom router/controller |
| Database | SQL scripts | Schema + seed data |
| Data artifacts | JSON | Precomputed datasets in public/backend folders |

---

## Files of Interest
- Frontend:
  - `frontend/src/`
  - `frontend/vite.config.*`
  - `frontend/tsconfig*.json`
  - `frontend/components/ui/`
- Backend:
  - `backend/php-api/*.php`
  - `backend/php-api/config.php`
  - `backend/php-api/router.php`
  - `backend/database/*.sql`

---

> If you need this updated to include exact library versions (React/Vite/Tailwind/etc.), run `npm ls` inside `frontend/` and paste the output here; versions can then be added to this document.
