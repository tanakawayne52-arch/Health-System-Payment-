FR-by-FR Gap Tracker

- FR-01: Authentication & Passwords
  - Status: Implemented (JWT + Bcrypt + Password Policy)
  - Gaps: Tighten CORS in production; enforce JWT_SECRET env var.
  - Progress: Added `validatePasswordPolicy` and enforced `PASSWORD_BCRYPT`.

- FR-02: RBAC Enforcement
  - Status: Implemented
  - Gaps: Ongoing verification as new endpoints are added.
  - Progress: Applied `requireRole` across all mutating endpoints (batches, lists, beneficiaries, facilities).

- FR-03: Audit Logging
  - Status: Implemented
  - Gaps: UI for full audit log filtering.
  - Progress: Integrated `logAudit` into all mutating actions and created `audit-logs.php` API.

- FR-04: Payment Lists Lifecycle (create/submit/review/certify/reject)
  - Status: Implemented
  - Gaps: Evidence upload integration.
  - Progress: Full backend logic for certification and record locking complete.

- FR-05: Payment Batches (create/validate/execute)
  - Status: Partially implemented
  - Gaps: UI currently still relies on fallback seed data in some dashboard/report pages; validation execution flow is server-backed but needs full UI error surfacing and create-list selection integration.
  - Progress: Server-side batch validation and execution exist; `PaymentBatchesPage` is now API-driven for core operations.

- FR-06: Beneficiaries Management
  - Status: Completed
  - Gaps: None. Import/bulk upload, export, and audit-aware status flows are fully implemented.
  - Progress: Bulk CSV import with duplicate detection, CSV export, and mandatory reason-based status auditing are functional.

- FR-10: Reports & Reconciliation
  - Status: Partially implemented
  - Gaps: Many report/reconciliation views still use seed fixture data; line-item reconciliation and export data need live DB wiring.
  - Progress: Backend reporting endpoints exist in part, but several frontend report pages still depend on seed data.

- NFR-Usability: System Redesign
  - Status: Implemented
  - Progress: Completed professional UI overhaul with donut charts, glass-morphic sidebar, and improved table layouts.

Notes:
- Priority order: FR-04 (done QA), FR-05 (batches), FR-06 (beneficiaries), FR-10 (reports), audit/RBAC/security tasks parallel.
- PAGE_SIZE standard: set to 15 across pages (already applied to many pages).
- Next actions performed: wired `PaymentBatchesPage` and `BeneficiariesPage` to API for list/validate/execute/retry and beneficiaries list/CRUD; created this tracker.
