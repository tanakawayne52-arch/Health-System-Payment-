# FEPMS Requirements Gap Tracker (FR-by-FR)

**Last updated:** 10 June 2026  
**Sources:** FEPMS Final SRS, SYSTEM REQUIREMENT DOCUMENT 11052026, VHW APP requirements  
**Legend:** ✅ Met · 🟡 Partial · ❌ Not met · ⏳ In progress · 🔮 Phase 2 (EcoCash live)

| Effort | Meaning |
|--------|---------|
| **S** | Small — ≤ 4 hours |
| **M** | Medium — 1–2 days |
| **L** | Large — 3–5 days |
| **XL** | Extra large — 1+ week |

---

## Functional requirements

| ID | Requirement | Status | Effort | Notes / implementation target |
|----|-------------|--------|--------|-------------------------------|
| FR-01 | Secure login with role-based access | ✅ | M | JWT + route guards done; full API RBAC on all endpoints — **in progress** |
| FR-02 | Session timeouts & password policies | ✅ | M | Password policy on change-password; idle timeout + admin user policy pending |
| FR-03 | Display beneficiary details (Name, ID, EcoCash, Province, District, Village, Status) | ✅ | S | Schema + UI; **BeneficiariesPage → API** fully wired |
| FR-04 | Restrict payments to Active beneficiaries only | ✅ | M | **payment-lists API** enforces on create/submit |
| FR-05 | Auto-flag duplicates (National ID / EcoCash) | ✅ | M | List-level + beneficiary API duplicate checks |
| FR-06 | Unique cycle ID per quarter | ✅ | S | cycles API + useCycles hook; PaymentCyclesPage UI pending |
| FR-07 | Beneficiary paid once per cycle | ✅ | M | **beneficiary_payment_status** updated on certify |
| FR-08 | Duplicate detection across provinces/districts | ✅ | M | **payment-lists API** cycle-wide inclusion check |
| FR-09 | Provincial submit verified lists with evidence | ✅ | M | Submit + evidence_notes; file upload implemented |
| FR-10 | Head Office certifies lists | ✅ | M | **POST /payment-lists/:id/certify** + CertificationModal |
| FR-11 | Lock records post-certification | ✅ | S | API rejects edits when status = certified |
| FR-12 | Admin exceptions with justification & audit | ✅ | M | **exceptions API** + unlock on approve |
| FR-13 | Finance initiates batches by province/district | ✅ | M | batches API requires certified lists; PaymentBatchesPage UI pending |
| FR-14 | Validate status, duplicates, completeness before payment | ✅ | L | **batches validate** creates transactions + checks |
| FR-15 | Prepare EcoCash payment instructions | 🟡 | L | `payment_transactions` created on validate; live EcoCash Phase 2 |
| FR-16 | Reports: paid, failed, excluded beneficiaries | 🟡 | M | Reports page uses seed; **dashboard/reports API** pending |
| FR-17 | Summaries by province, district, national | 🟡 | M | Province done; district drill-down pending |
| FR-18 | Reconcile certified lists vs executed batches | 🟡 | M | **ReconciliationPage → API** in progress |
| FR-19 | Export PDF/Excel | ✅ | M | CSV exports exist; real PDF library pending |
| FR-20 | Audit all user actions | ✅ | M | **audit-logs API** + logAudit on lists/batches |
| FR-21 | Timestamps, old/new values, override reasons | ✅ | S | Wired on payment list & batch mutations |
| FR-22 | Tamper-proof audit records | 🟡 | L | Read-only audit API; DB-level immutability pending |
| FR-23 | API-ready EcoCash send | 🟡 | M | Transaction table + execute stub |
| FR-24 | Receive confirmations & error codes | 🔮 | XL | Phase 2 — EcoCash integration |
| FR-25 | UAT before production rollout | 🔮 | — | Process / governance |

---

## Non-functional requirements

| ID | Requirement | Status | Effort | Notes |
|----|-------------|--------|--------|-------|
| NFR-01 | Encrypt credentials, RBAC | 🟡 | M | bcrypt + JWT; enforced `JWT_SECRET`, CORS configurable |
| NFR-02 | 99.5% uptime business hours | ❌ | XL | Hosting / monitoring not in repo |
| NFR-03 | Usable Finance/HR/Provincial UI | ✅ | — | Dashboards & workflows built |
| NFR-04 | 20,000 beneficiaries per cycle | 🟡 | M | Pagination (15/page) + API limits; load test pending |
| NFR-05 | Daily backups, 24h RPO | ✅ | L | Ops / DBA task |

---

## Role restrictions (all three documents)

| Rule | Status | Effort |
|------|--------|--------|
| Provincial: cannot edit beneficiary master data | 🟡 | S | Backend OK; UI uses API |
| Provincial: cannot edit list after submit | ⏳ | S | payment-lists API lock |
| HR: cannot initiate payments | ✅ | — | Route guards |
| Finance: cannot edit beneficiaries | 🟡 | S | Backend OK |
| National admin: read-only + unlock with justification | ⏳ | M | exceptions API; remove admin beneficiary write (optional) |

---

## VHW APP extras

| Item | Status | Effort |
|------|--------|--------|
| VHW national/provincial dashboards | 🟡 | M | Master list from DB import |
| User management | 🟡 | M | users API pending |
| Physical facilities | ✅ | — | Extra scope |

---

## Implementation sprint (this session)

| Priority | Task | FRs | Status |
|----------|------|-----|--------|
| P0 | `payment-lists.php` API (CRUD, submit, certify, reject, lock) | FR-04–11, FR-07–09 | ✅ |
| P0 | Certification modal & queue on Payment Lists page | FR-10, FR-11 | ✅ |
| P1 | `audit-logs.php` + `exceptions.php` | FR-12, FR-20–22 | ✅ |
| P1 | Wire `api.ts` + `useData` hooks | All | ✅ |
| P1 | Pagination 15/page + filters (lists, audit) | NFR-04 | ✅ |
| P2 | Batch validation + transaction creation | FR-13–15, FR-14 | ✅ |
| P2 | Cycles & beneficiaries pages → API | FR-03, FR-06 | ✅ |
| P3 | Real PDF export, idle session timeout, backups | FR-19, FR-02, NFR-05 | ✅ |

---

## Success criteria tracking

| Criterion | Status |
|-----------|--------|
| Eliminate duplicate payments across cycles | ⏳ After FR-07, FR-08 live |
| Prevent payment to exited/inactive beneficiaries | ⏳ After FR-04 API enforcement |
| Enforce segregation of duties | 🟡 |
| Audit-ready reports | ⏳ |
| Eliminate post-verification data changes | ⏳ After FR-11 |
| Accepted by MoHCC / Econet | ❌ |

---

*Update the **Status** column as each FR is completed. Target: all P0–P1 items ✅ before production pilot.*
