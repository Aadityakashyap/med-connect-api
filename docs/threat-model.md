# Threat model

## Assets

- User (profiles), credentials, MFA secrets
- Medical data (consultations, prescriptions)
- Payment records
- Audit logs

## Adversaries

- External attackers
- Malicious users
- Rogue admins

## Attack surfaces

- Auth endpoints (register/login/MFA)
- Booking/payment flows
- Database access
- Logs and CI secrets

## Key threats and mitigations

- Credential stuffing:
  - Mitigation: rate limiting, MFA
- Double booking / payment replay:
  - Mitigation: idempotency keys, transactional updates, unique key hashing
- SQL injection:
  - Mitigation: strict validation, least privilege DB user
- DoS:
  - Mitigation: rate limit, monitoring/alerts
- Secret leakage:
  - Mitigation: env, limit logs, principle of least privilege

## Monitoring

- Prometheus metrics: request rate, error rate
- Audit review: sensitive actions (auth changes, admin stats access)
