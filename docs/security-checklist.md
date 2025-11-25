# Security checklist

## Authentication & authorization

- [x] JWT secret strong and rotated
- [x] MFA TOTP implemented; secrets stored securely
- [x] All protected routes

## Rate limiting & idempotency

- [x] Per-user rate limits
- [x] Idempotency keys validated and stored (hash)
- [x] Booking/payment paths use transactions

## Input validation & sanitization

- [x] Joi schemas for all endpoints
- [x] Reject invalid emails

## Logging & audit

- [x] No sensitive data in logs (secrets)
- [x] Structured error responses

## Transport & storage

- [x] HTTPS enforced in prod
- [x] DB user least privilege

## Observability

- [x] Prometheus metrics exposed and scraped
- [x] Alerts for availability and error rate
