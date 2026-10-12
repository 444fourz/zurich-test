# Project Plan: Health Insurance Underwriting Website

Status: Draft. Technology choices are proposals until the open decisions in section 9 are resolved. The database is decided: a local SQLite file for development, with a move to PostgreSQL planned before production.

## 1. Goals

- Let applicants submit health insurance applications online.
- Assess risk automatically using configurable underwriting rules.
- Refer complex cases to human underwriters.
- Keep a complete, tamper-evident audit trail of every decision.

## 2. Current State

| Area     | Done                                                                                                   | Missing                                                              |
|----------|--------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| Backend  | FastAPI app, `/health`, `/underwrite`, placeholder scoring (as of the earlier commit)                  | Endpoints that save data, auth, tests, config, rules separation      |
| Frontend | Vite and React scaffold, routing, layout, home, login, register, status, referrals and not-found pages; multi-step questionnaire on `ApplyPage` | API client, saving and resuming, authentication, role-based navigation |
| Data     | SQLite schema (`backend/db/schema.sql`) and init script (`backend/db/init_db.py`)                      | Data-access layer, seed script, nothing writes to the database yet   |
| Tooling  | `.gitignore` covering env files, aider files, `node_modules` and database files                       | Dependency file for the backend, environment config, CI, linting     |

Personal and health data entered in the frontend currently lives only in browser memory and is logged to the console on submit. Nothing is stored.

## 3. Users and Roles

| Role          | Capabilities                                                    |
|---------------|-----------------------------------------------------------------|
| Applicant     | Register, complete questionnaire, upload documents, view status |
| Underwriter   | Review referred applications, approve, decline or request info  |
| Administrator | Manage users, maintain underwriting rules, view audit logs      |

## 4. Architecture

~~~
[ Browser: React + TypeScript ]
              |
        HTTPS / REST (JSON)
              |
[ Backend API: FastAPI (Python) ]
   |- Authentication and authorisation
   |- Application service
   |- Rules engine (risk scoring)
   |- Audit logging
              |
     ---------------------
     |                   |
[ SQLite file ]   [ Document storage ]
~~~

The backend uses Python's built-in `sqlite3` module through `get_connection()` in `backend/db/init_db.py`, which turns on foreign key enforcement for every connection (SQLite leaves it off by default). The schema is plain SQL, kept as close to portable as possible so it can be moved to PostgreSQL later.

### Why SQLite for now

- No installation, containers or accounts, which suits pair programming.
- Each developer has their own local database, built from `schema.sql`.
- The schema enforces rules in the database itself (constraints, generated BMI column, append-only triggers), which carries over to PostgreSQL.

### Known limits of SQLite

- One writer at a time, so it is not suitable for a real multi-user deployment.
- The file is unencrypted, so only fake data may be used.
- Types are loosely enforced, there is no native enum or timestamp type, and `ALTER TABLE` support is limited.
- Developers do not share data. A seed script gives everyone the same starting point.

### Target repository layout

~~~
backend/
  main.py              # app creation, routes (to be split up)
  db/
    schema.sql         # tables, constraints, indexes, triggers
    init_db.py         # builds the database, provides get_connection()
    seed.py            # fake users and applications (planned)
  rules/               # rules engine, no web dependencies (planned)
  tests/               # (planned)
  requirements.txt     # (planned)
frontend/
  src/
    pages/ components/ api/
  package.json
docs/
.env.example           # placeholder settings, safe to commit (planned)
.github/workflows/ci.yml
~~~

Database files (`*.db`, `*.db-wal`, `*.db-shm`, `*.sqlite3`) are git-ignored because they may contain personal data.

## 5. Milestones

### M0: Tidy and scaffold
- Review the existing backend and frontend code for leftovers and inconsistencies.
- Add a backend `requirements.txt`, and document how to start the backend, the frontend and the database (`python backend/db/init_db.py`).
- Move scoring into a separate `rules` module with no FastAPI imports.
- Add pytest with unit tests for the current scoring thresholds.
- Move the API URL, CORS origins and database path into environment configuration, with a committed `.env.example`.
- Add a CI workflow that runs tests and linting against a temporary SQLite file built from `schema.sql`.

Done when: a fresh clone can be started with documented commands, and CI passes.

### M1: Data access and authentication
- Build a small data-access layer on top of `get_connection()` for users, applicants and applications, with tests against a temporary database.
- Implement registration and login with hashed passwords and JWT sessions.
- Add role-based access control as a reusable dependency.
- Write audit log entries for authentication events (the schema makes the log append-only, but the application must write to it).
- Add `backend/db/seed.py`, which creates fake users and applications for every developer.

Done when: users can register and log in, and endpoints reject the wrong roles (tested).

### M2: Applicant journey
- Create, save, resume and submit applications through the API, storing them in the existing tables.
- Connect the `ApplyPage` questionnaire to the API through a frontend API client, and remove the `console.log` and `alert` placeholders so no health data is logged.
- Map form values to database values: `"yes"`/`"no"` for hospitalisation becomes `1`/`0`, and condition labels become `medical_conditions` codes (the form's "None" means no rows).
- Validate on the server as well as in the form, since the database `CHECK` constraints are the last line of defence.
- Wire up the status page for the applicant.
- Add document upload to local file storage, recorded in the `documents` table.

Done when: an applicant can complete and submit an application end to end, and the data is in the database.

### M3: Rules engine
- Express rules as versioned configuration rather than hard-coded values.
- Return an explanation (which rules fired) with every assessment.
- Store each assessment in `risk_assessments` with its rules version.
- Add boundary and regression tests for every rule.

Done when: any decision can be reproduced and explained from stored data.

### M4: Underwriter tools
- Referral queue with filters and case detail view.
- Approve, decline or request more information, with a mandatory reason. Decisions are append-only, so a revised decision is a new row.
- Notify applicants of decisions.
- Administrator screens for users, rules and audit logs.

Done when: a referred case can be resolved by an underwriter, with a full audit trail.

### M5: Hardening and release
- Migrate from SQLite to PostgreSQL (or another hosted database) before any real use. This covers a migration tool such as Alembic, replacing SQLite-specific SQL (generated columns, triggers, `strftime` defaults, `PRAGMA`s), and running the test suite against the new database.
- Multi-factor authentication for staff, rate limiting, security headers.
- Encrypted storage for documents and database, with backups and restricted access.
- Security review and dependency scanning.
- Accessibility audit of all forms.
- End-to-end tests (applicant and underwriter journeys).
- Monitoring, deployment pipeline, retention and deletion policy.

Done when: the compliance checklist in section 8 is signed off.

## 6. Data Model

The authoritative definition is `backend/db/schema.sql`. Summary:

- **users**: id, email, password hash, full name, role (applicant, underwriter, administrator), active flag, timestamps.
- **applicants**: id, user id, name, date of birth, contact details, address, timestamps.
- **applications**: id, reference, applicant id, product, status, submitted at, timestamps. Statuses: draft, submitted, auto_approved, referred, auto_declined, approved, declined, more_info_required.
- **application_lifestyle**: smoker, alcohol, exercise, occupation, hazardous activities.
- **application_medical**: height, weight, BMI (calculated by the database), medications, family history, recent hospitalisation.
- **medical_conditions** and **application_conditions**: a lookup of conditions and a join table for the multi-select answer.
- **risk_assessments**: application id, score, outcome, explanation (JSON), rules version.
- **decisions**: application id, decided by, outcome, mandatory reason, decided at. Append-only.
- **documents**: application id, storage key, type, original name, uploaded at.
- **audit_log**: actor, action, entity, before and after (JSON), timestamp. Append-only.

Design notes:
- Constraints mirror the form's dropdown values and the height and weight ranges.
- Passwords are stored only as hashes.
- Personal details live on `applicants`, so editing them also changes how past applications look. A per-application snapshot may be needed if that matters.

## 7. API Outline

| Method | Path                             | Role          | Purpose                                    |
|--------|----------------------------------|---------------|--------------------------------------------|
| GET    | `/health`                        | Public        | Liveness check (exists)                    |
| POST   | `/underwrite`                    | Public        | Prototype scoring (exists; to be replaced) |
| POST   | `/auth/register`, `/auth/login`  | Public        | Account creation and sign-in               |
| POST   | `/applications`                  | Applicant     | Start an application                       |
| PUT    | `/applications/{id}/answers`     | Applicant     | Save answers                               |
| POST   | `/applications/{id}/submit`      | Applicant     | Submit and run the rules engine            |
| POST   | `/applications/{id}/documents`   | Applicant     | Upload a document                          |
| GET    | `/referrals`                     | Underwriter   | List referred cases                        |
| POST   | `/applications/{id}/decision`    | Underwriter   | Record a decision                          |
| GET    | `/audit`                         | Administrator | Search the audit log                       |

## 8. Security, Compliance and Quality

- Strong password hashing; multi-factor authentication for staff.
- Least-privilege access; audit every read and write of sensitive data.
- No health data in logs, including the browser console.
- The SQLite file is unencrypted, so only fake data is used during development. Database files are git-ignored.
- Secrets live only in git-ignored `.env` files or the hosting platform's secret store, never in the repository.
- Regulatory review (HIPAA, GDPR or UK equivalents, depending on market) before any real data is handled.
- Fairness: rules must not discriminate unlawfully, and decisions must be explainable.
- Testing: unit tests for rules (highest risk), API tests per endpoint and role, database tests for constraints and triggers, end-to-end tests for key journeys, accessibility checks.

## 9. Open Decisions

1. Which market and regulations apply? (Blocks M5 and any use of real data.)
2. When do we move from SQLite to PostgreSQL, and where is it hosted? (Blocks M5.)
3. Preferred hosting platform for the backend and frontend?
4. Are underwriting rules already defined, or do they need designing with an actuary? (Blocks M3.)
5. Which integrations are needed (payments, identity checks, medical records)?
6. Expected user volumes and availability targets?
7. Do we write SQL by hand or adopt an ORM (such as SQLAlchemy) with a migration tool? (Affects M1, and the cost of the M5 migration.)

## 10. Risks

| Risk                                        | Mitigation                                                          |
|---------------------------------------------|---------------------------------------------------------------------|
| Rules change without an audit record        | Version rules and store the version with each result                |
| Sensitive data leakage                      | Fake data only, git-ignored database files, no data in logs         |
| Real data entered into the unencrypted file | Footer warning, seed script, plan the PostgreSQL move before launch |
| SQLite behaves differently from production  | Keep SQL portable, run tests on PostgreSQL before release           |
| Form values and database values drift apart | Central mapping in the API, tests that submit every dropdown value  |
| Audit entries not written by the app        | Test that each sensitive action creates an audit row                |
| Unfair or opaque decisions                  | Explanations stored with every assessment                           |
| Scope growth before rules are defined       | Keep M3 configurable; confirm rules early                           |
