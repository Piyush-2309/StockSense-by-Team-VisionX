# StockSense — Security Documentation

## Authentication

### Overview
StockSense uses **stateless JWT authentication** with BCrypt password hashing.

```
Request → CORS Filter → JWT Auth Filter → Spring Security → Controller
```

### Endpoints

| Method | Path                          | Auth Required | Description          |
|--------|-------------------------------|---------------|----------------------|
| POST   | `/api/v1/auth/signup`         | No            | Register new user    |
| POST   | `/api/v1/auth/login`          | No            | Login, get tokens    |
| POST   | `/api/v1/auth/refresh`        | No            | Refresh access token |
| POST   | `/api/v1/auth/forgot-password`| No            | Request OTP          |
| POST   | `/api/v1/auth/verify-otp`     | No            | Verify OTP           |
| POST   | `/api/v1/auth/reset-password` | No            | Reset with OTP       |

### Password Security
- Passwords are hashed with **BCrypt** before storage
- Raw passwords are **never** stored or logged
- `passwordHash` is **never** exposed via any API response
- Minimum password length: 8 characters

### JWT Tokens
- **Access Token:** Short-lived (default 15 min / 900,000 ms)
  - Contains: email (subject), role, userId, name
  - Used for API authentication via `Authorization: Bearer <token>`
- **Refresh Token:** Long-lived (default 7 days / 604,800,000 ms)
  - Stored in `refresh_tokens` table
  - Used to obtain a new access/refresh token pair
  - Revoked after use (token rotation)
  - All user tokens revoked on password reset

### JWT Filter Behavior
1. Extract `Authorization: Bearer <token>` header
2. Validate signature and expiry
3. Extract email, role, userId from claims
4. Load UserDetails from database
5. Populate SecurityContext
6. Continue filter chain
7. **Never logs full JWT tokens**

## OTP Password Reset

### Flow
```
forgot-password → generate OTP → store hashed OTP → set 5-min expiry
verify-otp → check hash, expiry, attempts → mark verified
reset-password → verify OTP again → update password → revoke all tokens
```

### Rules
- **6-digit** numeric OTP
- **5-minute** expiry
- **5 maximum** verification attempts
- **60-second** resend cooldown
- OTP hash stored (never raw)
- Invalidated after successful use
- **Raw OTP never logged** (except in DEMO mode, clearly labeled)

### Demo Mode
Set `OTP_DELIVERY_MODE=DEMO` (default) to log OTP server-side instead of real email/SMS.
Verification logic remains identical — demo mode only affects delivery.

## Roles & Authorization

### Roles
| Role    | Description                      |
|---------|----------------------------------|
| MANAGER | Full administrative access       |
| STAFF   | Limited operational access       |

### Signup Rules
- Self-signup always assigns **STAFF** role
- MANAGER accounts are seeded (not self-registerable)

### Authorization Enforcement
Uses `@PreAuthorize("hasRole('MANAGER')")` for manager-only operations:
- Warehouse/location/category management (create, update, delete)
- Product delete
- Adjustment validation
- Direct stock edits

**Backend enforces all authorization independently of frontend.**

## CORS
- Configured to allow **only** the frontend origin (default: `http://localhost:5173`)
- Configurable via `FRONTEND_ORIGIN` env variable
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Credentials: allowed
- Max age: 3600 seconds

## API Error Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-01T00:00:00"
}
```

### Error Response
```json
{
  "success": false,
  "code": "DUPLICATE_SKU",
  "message": "SKU already exists.",
  "errors": { "sku": "SKU already exists." },
  "path": "/api/v1/products",
  "timestamp": "2026-01-01T00:00:00"
}
```

### Error Codes
| Code                      | HTTP   | Description                        |
|---------------------------|--------|------------------------------------|
| VALIDATION_ERROR          | 400    | DTO validation failure             |
| INVALID_OTP               | 400    | Wrong OTP                          |
| OTP_EXPIRED               | 400    | OTP has expired                    |
| INVALID_STATE_TRANSITION  | 400    | Invalid document state change      |
| INVALID_TRANSFER          | 400    | Invalid transfer parameters        |
| INVALID_LOCATION          | 400    | Invalid location for operation     |
| BAD_REQUEST               | 400    | Generic bad request                |
| UNAUTHORIZED              | 401    | Authentication required            |
| INVALID_CREDENTIALS       | 401    | Wrong email/password               |
| FORBIDDEN                 | 403    | Insufficient permissions           |
| ACCESS_DENIED             | 403    | Role-based access denied           |
| NOT_FOUND                 | 404    | Resource not found                 |
| DUPLICATE_SKU             | 409    | SKU already exists                 |
| DUPLICATE_EMAIL           | 409    | Email already registered           |
| INSUFFICIENT_STOCK        | 409    | Not enough stock                   |
| OTP_RATE_LIMIT            | 429    | Too many OTP requests              |
| INTERNAL_ERROR            | 500    | Unexpected server error            |

## Environment Variables

| Variable              | Default                  | Description                   |
|-----------------------|--------------------------|-------------------------------|
| JWT_SECRET            | (dev default)            | HMAC signing key              |
| JWT_ACCESS_EXPIRATION | 900000                   | Access token TTL (ms)         |
| JWT_REFRESH_EXPIRATION| 604800000                | Refresh token TTL (ms)        |
| OTP_DELIVERY_MODE     | DEMO                     | OTP delivery: DEMO or EMAIL   |
| FRONTEND_ORIGIN       | http://localhost:5173    | Allowed CORS origin           |
| DB_URL                | jdbc:postgresql://...    | Database connection URL       |
| DB_USERNAME           | stocksense               | Database username             |
| DB_PASSWORD           | stocksense               | Database password             |
