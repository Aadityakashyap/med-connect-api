# Architecture

## Goals and context

MedConnect API enables secure patient-doctor interactions: registration/login with MFA, doctor profiles, availability, bookings, consultations, prescriptions, payments, search, and admin insights. Priorities: reliability, security, and maintainability.

## Logical architecture

- API layer (Express): Route handlers with request validation (Joi), middleware, error handling.
- Domain services:
  - AuthService: registration/login, MFA secret generation, token issuance.
  - BookingService: availability management, booking flows with idempotency and transactions.
- Data layer: MySQL via mysql2/promise; connection pool; transactions for writes; prepared statements.

## Cross-cutting concerns

- Security: JWT-based auth; MFA TOTP; rate limiting; input validation; idempotency for booking/payment; audit logging to DB; sanitized logs.
- Scalability: API; DB connection pool; schema indexes; idempotency keys; efficient queries.
- Resilience: Health/metrics endpoints; DB pings on startup.

## Data model highlights

- users (roles, MFA fields) and profiles.
- doctors linked to users; unique license_number.
- availability_slots with status and time constraint.
- consultations link patient/doctor/slot; lifecycle statuses.
- prescriptions tied to consultations; content as TEXT.
- payments stub with status and provider_reference.
- audit_logs for compliance; user_id optional.
- idempotency_keys for safe write retries.

## Key flows

- Auth + MFA:
  - Register validates email/password/full_name/role.
  - Login issues JWT; MFA setup generates secret + QR code; enable verifies TOTP.
- Doctor availability + booking:
  - Doctor creates profile and slots.
  - Patient sees slots; books using Idempotency-Key; booking uses transaction, inserts consultation, updates slot status.
- Consultation lifecycle + prescriptions:
  - Doctor updates status; on completed, can issue prescription referencing consultation and users.
- Payments:
  - Patient authorizes payment; stub records authorization and status transition.
- Admin stats:
  - Aggregates counts by role, consultations statuses, recent activity.

## Deployment/Development

- Local: Node + MySQL, src/sql/dbSetup.js.
- Secrets: .env for dev.

## Risks and mitigations

- Brute force/credential stuffing: Rate limit; MFA; monitor auth failures.
- Double booking/payment replay: Idempotency keys; unique hashes; transactional updates.
- DoS: Rate limits; back-pressure; health/metrics monitoring and alerts.
- Data leakage: Avoid secrets in logs; least privilege DB user.
