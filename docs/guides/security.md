# Security Guide

> [← Back to Index](../README.md)

---

## Security Layers

| Layer | Mechanism | Library |
|---|---|---|
| **HTTP Headers** | Security headers (XSS, CSRF, etc.) | `helmet` |
| **Rate Limiting** | Per-endpoint request throttling | `@nestjs/throttler` |
| **Authentication** | JWT Bearer tokens | `@nestjs/jwt`, `passport-jwt` |
| **Social Auth** | Google OAuth 2.0 | `passport` (planned) |
| **Password Storage** | bcrypt hashing + salting | `bcrypt` v6 |
| **Authorization** | Role-Based Access Control (RBAC) | Custom Guards |
| **Token Revocation** | Per-session revocation tracked in DB | `RefreshToken` model (schema complete) |
| **Cookie Security** | HTTP-only signed cookies | `cookie-parser` |
| **Input Validation** | DTO schema validation | `class-validator` |

---

## JWT Strategy

### Token Types

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| **Access Token** | 15 minutes | Memory / Authorization header | Authenticate API requests |
| **Refresh Token** | 7–30 days | HTTP-only cookie / DB (`refresh_tokens` table) | Obtain new access tokens |

### Token Rotation Flow

```
Client                         Server
  |                               |
  |-- POST /auth/refresh -------->|
  |   (sends refresh token)       |
  |                               |-- Hash incoming refresh token
  |                               |-- Look up RefreshToken by tokenHash
  |                               |-- Validate: not expired, not revoked
  |                               |-- Revoke old token (TOKEN_ROTATED)
  |                               |-- Issue new access + refresh token pair
  |<-- New tokens ----------------|
```

> **Security Note:** Only the SHA-256/bcrypt **hash** of the refresh token is stored in the `refresh_tokens` table — never the raw token. On each refresh request, the incoming token is hashed and looked up. If not found or already revoked, the request is rejected.

### Revocation Reasons

The `RevocationReason` enum (DB type: `revocation_reason`) tracks why a refresh token was invalidated:

| Reason | Trigger |
|---|---|
| `LOGOUT` | User explicitly logs out |
| `PASSWORD_CHANGED` | User updates their password |
| `TOKEN_ROTATED` | Normal refresh rotation |
| `ACCOUNT_LOCKED` | Admin locks the account |
| `SECURITY` | Suspicious activity detected |
| `EXPIRED` | Token TTL exceeded |

### Session Lifecycle

Each login event creates a `UserSession` record (`user_sessions` table). Sessions track:
- Device type (`DeviceType`: `MOBILE`, `TABLET`, `DESKTOP`, `WEB`)
- Device name and fingerprint (`deviceName`, `deviceId`)
- IP address and user agent
- `lastActivityAt` — updated on each authenticated request
- `expiresAt` — session hard expiry
- `revokedAt` — set when the session is manually terminated (logout)

Multiple refresh tokens can be issued per session (token rotation). All tokens inherit the session's expiry.

---

## RBAC Model

```
User --has--> Role --has--> RolePermission --links--> Permission
```

- **Role** = a named group of permissions (e.g. `SUPER_ADMIN`, `STORE_OWNER`, `BUYER`)
- **Permission** = a granular action code (e.g. `catalog:product:create`)
- **Guard** = checks if the logged-in user's role has the required permission

### Schema Tables

| Model | DB Table | Purpose |
|---|---|---|
| `Role` | `roles` | Named permission groups |
| `Permission` | `permissions` | Granular action codes per module |
| `RolePermission` | `role_permissions` | Bridge linking roles to permissions |

### Example Permission Codes

| Code | Module | Description |
|---|---|---|
| `auth:user:read` | IAM | Read user records |
| `auth:role:manage` | IAM | Create/update/delete roles |
| `store:profile:update` | Store | Update own store profile |
| `catalog:product:create` | Catalog | Create new products |
| `order:status:update` | Orders | Update order status |
| `payment:refund:process` | Payment | Initiate a refund |

---

## OTP Security

OTPs are issued via the `OTPVerification` model (`otp_verifications` table):

- Only the **bcrypt hash** of the OTP is stored — never the raw code
- `maxAttempts` (default: 5) limits brute-force attempts
- `blockedUntil` implements a temporary lockout after max attempts
- `expiresAt` enforces a TTL on each OTP
- `userId` is nullable — supports pre-registration OTPs (user doesn't exist yet)

OTP channels (`OTPChannel` → `otp_channel`): `SMS`, `EMAIL`  
OTP purposes (`OTPPurpose` → `otp_purpose`): `REGISTRATION`, `LOGIN`, `PASSWORD_RESET`, `PHONE_VERIFICATION`, `EMAIL_VERIFICATION`

---

## Password Policy (Planned)

- Minimum 8 characters
- Must contain uppercase, lowercase, digit, and special character
- bcrypt salt rounds: **12**
- Old password required when changing password
- `passwordChangedAt` is updated on each change (triggers token revocation)

---

## Account Protection

The `User` model includes built-in brute-force protection fields:

| Field | DB Column | Purpose |
|---|---|---|
| `failedLoginAttempts` | `failed_login_attempts` | Counter incremented on each failed login |
| `lockedUntil` | `locked_until` | Account temporarily locked until this timestamp |
| `passwordChangedAt` | `password_changed_at` | Triggers refresh token revocation on change |
| `lastLoginAt` | `last_login_at` | Timestamp of last successful login |
| `lastLoginIp` | `last_login_ip` | IP of last successful login (IPv4/IPv6) |
| `lastSeenAt` | `last_seen_at` | Last request timestamp (activity tracking) |

---

## Environment Security

- `.env` is excluded from Git via `.gitignore`
- All secrets injected via environment variables — never hardcoded
- Production should use a secrets manager (e.g. AWS Secrets Manager, HashiCorp Vault)
