# Project Plan: Health Insurance Underwriting Website

Status: Draft. Technology choices are proposals until the open decisions in section 9 are resolved.

## 1. Goals

- Let applicants submit health insurance applications online.
- Assess risk automatically using configurable underwriting rules.
- Refer complex cases to human underwriters.
- Keep a complete, tamper-evident audit trail of every decision.

## 2. Current State

| Area     | Done                                                       | Missing                                            |
|----------|------------------------------------------------------------|----------------------------------------------------|
| Backend  | FastAPI app, `/health`, `/underwrite`, placeholder scoring | Persistence, auth, tests, config, rules separation |
| Frontend | Single form (age, BMI, smoker) showing the outcome         | Project scaffolding, routing, validation, auth     |
| Data     | None                                                       | Database, migrations, document storage             |
| Tooling  | None                                                       | Dependency files, CI, linting, containers          |

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
[ PostgreSQL ]   [ Encrypted object storage ]
~~~

### Target repository layout

~~~
backend/
  app/
    main.py          # app creation, routers, middleware
    config.py        # settings from environment
    api/             # route modules
    models/          # database models
    schemas/         # request/response models
    rules/           # rules engine, no web dependencies
    services/        # application, decision, audit logic
  tests/
  alembic/
  requirements.txt
frontend/
  src/
    pages/ components/ api/
  package.json
docs/
docker-compose.yml
.github/workflows/ci.yml
~~~

## 5. Milestones

### M0: Tidy and scaffold
- Review the existing backend and frontend code for leftovers and inconsistencies.
- Add `requirements.txt` and a Vite project (`package.json`, `index.html`, `main.tsx`) so the frontend runs.
- Move scoring into a separate `rules` module with no FastAPI imports.
- Add pytest with unit tests for the current scoring thresholds.
- Move the API URL and CORS origins into environment configuration.
- Add `docker-compose.yml` with PostgreSQL, and a CI workflow running tests and linting.

Done when: a fresh clone can be started with documented commands, and CI passes.

### M1: Data and authentication
- Add SQLAlchemy and Alembic, with migrations for the data model in section 6.
- Implement registration and login with hashed passwords and JWT sessions.
- Add role-based access control as a reusable dependency.
- Add audit logging for authentication events.

Done when: users can register and log in, and endpoints reject the wrong roles (tested).

### M2: Applicant journey
- Create, save, resume and submit applications through the API.
- Build a multi-step questionnaire (personal, lifestyle, medical history) with validation.
- Add a status page for the applicant.
- Add document upload to encrypted object storage.

Done when: an applicant can complete and submit an application end to end.

### M3: Rules engine
- Express rules as versioned configuration rather than hard-coded values.
- Return an explanation (which rules fired) with every assessment.
- Store each assessment with its rules version.
- Add boundary and regression tests for every rule.

Done when: any decision can be reproduced and explained from stored data.

### M4: Underwriter tools
- Referral queue with filters and case detail view.
- Approve, decline or request more information, with a mandatory reason.
- Notify applicants of decisions.
- Administrator screens for users, rules and audit logs.

Done when: a referred case can be resolved by an underwriter, with a full audit trail.

### M5: Hardening and release
- Multi-factor authentication for staff, rate limiting, security headers.
- Security review and dependency scanning.
- Accessibility audit of all forms.
- End-to-end tests (applicant and underwriter journeys).
- Backups, monitoring, deployment pipeline, retention and deletion policy.

Done when: the compliance checklist in section 8 is signed off.

## 6. Data Model

- **User**: id, email, password hash, role, created at.
- **Applicant**: id, user id, name, date of birth, contact details.
- **Application**: id, applicant id, status, submitted at, product.
- **Answer**: id, application id, question key, value.
- **RiskAssessment**: id, application id, score, outcome, explanation, rules version.
- **Decision**: id, application id, decided by, outcome, reason, decided at.
- **Document**: id, application id, storage key, type, uploaded at.
- **AuditLog**: id, actor, action, entity, before/after, timestamp.

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
- Encryption at rest and in transit; no health data in logs.
- Regulatory review (HIPAA, GDPR or UK equivalents, depending on market).
- Fairness: rules must not discriminate unlawfully, and decisions must be explainable.
- Testing: unit tests for rules (highest risk), API tests per endpoint and role, end-to-end tests for key journeys, accessibility checks.

## 9. Open Decisions

1. Which market and regulations apply? (Blocks M1 data handling and M5.)
2. Preferred frameworks and hosting platform?
3. Are underwriting rules already defined, or do they need designing with an actuary? (Blocks M3.)
4. Which integrations are needed (payments, identity checks, medical records)?
5. Expected user volumes and availability targets?

## 10. Risks

| Risk                                  | Mitigation                                           |
|---------------------------------------|------------------------------------------------------|
| Rules change without an audit record  | Version rules and store the version with each result |
| Sensitive data leakage                | Encryption, access logging, no data in logs          |
| Unfair or opaque decisions            | Explanations stored with every assessment            |
| Scope growth before rules are defined | Keep M3 configurable; confirm rules early            |
