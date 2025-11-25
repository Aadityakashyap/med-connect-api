# MedConnect API (Node.js + MySQL)

Production-grade telemedicine backend: auth (JWT + MFA), doctor profiles, availability, consultations, prescriptions, payments, search, admin stats, observability, and CI tests. Node.js + Express + MySQL.

## Features

- Auth: register/login, MFA setup/enable
- Core: doctor profiles, availability, consultations booking, prescriptions, payments (authorize)
- Reliability: idempotency for bookings, rate limiting, input validation
- Observability: /api/metrics, request logging, audit logs
- CI: MySQL service, migrations + seed, Jest + Supertest e2e tests

## Prerequisites

- Node.js 19
- MySQL 8

## Quick start (local)

1. Copy environment:

   ```bash
   cp .env.example .env
   ```

   Fill DB creds, JWT_SECRET, METRICS_ENABLED=true, etc.

2. Install deps:

   ```bash
   npm install
   ```

3. Initialize DB (schema + seed):

   ```bash
   # If MySQL is local
   npm run db:setup
   ```

4. Run API:
   ```bash
   npm run dev
   ```
   Health: GET http://localhost:4000/api/health

- API: http://localhost:4000

## Testing

Run e2e tests:

```bash
npm test
```

## Scripts

- `npm run db:setup` — run migrations.sql + seed.sql via scripts/dbSetup.js
- `npm test` — run test script via Jest + Supertest e2e tests/fullFlow.test.js
- `npm run dev` — start dev server

## Security

- JWT, MFA
- Rate limiting, idempotency
- Input validation
- Avoid secrets in logs; use env vars for secrets

## Observability

- Prometheus metrics at `/api/metrics`
- Audit logs table
