# Backend cleanup notes (PHP API)

This file documents issues spotted while reviewing the PHP API files and the recommended cleanup/customization actions.

## 1) Duplicate/Conflicting routing logic
- `backend/php-api/router.php` is a filesystem fallback (requires `index.php` after checking for a real file).
- `backend/php-api/index.php` is the *API entry* that inspects `REQUEST_URI` and routes to endpoint files.
- `backend/php-api/auth.php` currently contains endpoint logic for auth actions (`login`, `me`, etc.).

**Recommended cleanup**
- Keep exactly one routing entry point for `/api/...`.
- If you use `index.php` as the API router, ensure `router.php` never intercepts `/api` routes in a way that bypasses `index.php`.
- Standardize all endpoints to follow the same signature:
  - `require_once __DIR__ . '/config.php';`
  - `requireAuth($conn)` for protected routes.
  - Use `sendResponse(...)` from `config.php`.

## 2) Inconsistent JWT/secret usage
- `config.php` defines a JWT secret via `getenv('JWT_SECRET')` with a hardcoded default fallback.
- Some auth code duplicates JWT generation (instead of reusing `createJwt()` / `verifyJwt()` in `config.php`).

**Recommended cleanup**
- Remove any duplicated JWT encode/decode code inside endpoint files.
- Always call `createJwt($user)` from `config.php`.
- Require `JWT_SECRET` in production and avoid fallback defaults.
- Prefer `CORS_ORIGIN` configuration to limit allowed frontend hosts.

## 3) Possible bugs / logic errors in endpoint implementations
While reviewing:
- `beneficiaries.php` contains a label `action:` before the main GET logic (likely an accidental leftover). That label is harmless in PHP but should be removed for cleanliness.
- Some SQL fragments appear to mix table/column naming inconsistently (e.g., `payment_transactions` vs `payment_batches` usage inside `dashboard.php`). This may be correct for your schema, but should be validated against `backend/database/schema.sql`.
- `dashboard.php` contains hardcoded placeholder values in the response (e.g., `successRate: 95`, `successRate: 100`) and some computed values may be stubbed.

**Recommended cleanup**
- Validate each SELECT/JOIN against actual DB schema.
- Replace placeholder constants with calculated values.
- Remove stray labels and dead code.

## 4) CORS + security hardening
- `config.php` currently sets `Access-Control-Allow-Origin: *`.

**Recommended cleanup**
- Restrict allowed origins to your frontend host(s).
- Add stricter `Access-Control-Allow-Headers` and allow only the needed methods.

## 5) Auth flow completeness
- `config.php` supports `logout` and `refresh` in `auth.php`.

**Recommended cleanup**
- Ensure frontend calls match backend routes exactly.
- Ensure token refresh endpoint is consistent with `frontend/src/lib/api`.

## 6) What to customize next (highest impact)
1. Remove duplicated JWT logic in auth.
2. Ensure all endpoints strictly use `sendResponse` and `requireAuth`.
3. Remove stray label `action:` in `beneficiaries.php`.
4. Audit `dashboard.php` for placeholder constants and verify SQL against schema.
5. Align CORS configuration with your deployment.

## 7) Validation steps
After cleanup, run:
- `php backend/php-api/test_endpoints.php`
- Manually hit:
  - `/api/auth/login` (POST)
  - `/api/auth/me` (GET, with Authorization header)
  - `/api/beneficiaries` (GET and POST)
  - `/api/batches` and `/api/cycles` (GET)
  - `/api/dashboard/*` routes you use in the frontend

