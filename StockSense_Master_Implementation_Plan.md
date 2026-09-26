# StockSense — Complete Master Implementation Plan
## 8-Hour Hackathon | 3–4 Person Team | Spring Boot + PostgreSQL + React

> **Purpose:** This document is the single source of truth for planning and implementing StockSense during the hackathon.
>
> **Important:** Treat the contracts, naming, business rules, UI scope, team ownership, and priorities in this document as frozen unless the whole team explicitly agrees to a change.
>
> **Primary goal:** Build a small but complete inventory-control system where every validated stock movement updates inventory correctly and creates a traceable ledger entry.

---

# 1. Product Overview

## 1.1 Product Name

**StockSense**

## 1.2 Product Tagline

**Know your stock. Control every movement. Prevent shortages.**

## 1.3 Product Concept

StockSense is a modular Inventory Management System (IMS) designed to replace manual registers, Excel sheets, and scattered stock tracking with a centralized application.

The system serves two primary users:

- **Inventory Manager**
- **Warehouse Staff**

The core product principle is:

> **Every validated inventory movement must update the correct stock quantity, at the correct location, and create a traceable movement record.**

The system must make five questions easy to answer:

1. **What do we have?**
2. **Where is it?**
3. **What is moving?**
4. **What needs attention?**
5. **What happened to it?**

---

# 2. Source Requirements

The supplied problem statement requires:

- Centralized real-time inventory management.
- Inventory Managers and Warehouse Staff.
- Sign up/login.
- OTP-based password reset.
- Dashboard.
- Total products in stock.
- Low-stock/out-of-stock visibility.
- Pending receipts.
- Pending deliveries.
- Scheduled internal transfers.
- Dynamic filtering by document type, status, warehouse/location and category.
- Product management.
- Stock availability per location.
- Product categories.
- Reordering rules.
- Receipts.
- Delivery orders.
- Internal transfers.
- Stock adjustments.
- Move history / stock ledger.
- Low-stock alerts.
- Multi-warehouse support.
- SKU search and smart filters.

The supplied statement's required inventory flow is:

**Receive → Transfer → Deliver → Adjust → Ledger**

The statement also expects examples where receiving increases stock, internal transfer changes location but not total stock, delivery decreases stock, and adjustment reconciles damaged/mismatched stock.

---

# 3. Hackathon Constraints

## 3.1 Time

**8 hours total**

## 3.2 Team

**3–4 developers**

## 3.3 Engineering Principle

Prioritize:

1. Core inventory correctness.
2. Database integrity.
3. Security.
4. Clean UI.
5. End-to-end integration.
6. Demo stability.
7. Optional intelligence features.

Do not sacrifice the core transaction engine for flashy features.

---

# 4. Feature Prioritization

## P0 — MUST WORK

These features are mandatory:

- Login.
- Signup.
- JWT authentication.
- Role authorization.
- PostgreSQL persistence.
- Products.
- Categories.
- Warehouses.
- Locations.
- Current stock.
- Receipts.
- Deliveries.
- Internal transfers.
- Inventory adjustments.
- Stock ledger.
- Dashboard.
- SKU search.
- Smart filtering.
- Low-stock status.
- Server-side validation.
- Client-side validation.
- Error handling.
- Responsive UI.
- Git contribution from every team member.
- End-to-end demo.

## P1 — SHOULD HAVE

Implement only when P0 is stable:

- Reordering rules.
- Risk Center.
- Cycle Count.
- Stock by Location visualization.
- Reorder recommendation.
- Approval workflow for sensitive adjustments.
- Better audit information.

## P2 — STRETCH

Only after P0 and P1 are stable:

- Barcode/QR.
- AI stock explanation.
- Natural-language inventory assistant.
- Anomaly detection.
- Lot/serial tracking.
- Expiry.
- FEFO.
- Stock aging.
- Dead-stock detection.

---

# 5. Hard Scope Rules

Do not introduce:

- Microservices.
- GraphQL.
- Kubernetes.
- Message brokers.
- Complex event-driven architecture.
- Service mesh.
- Separate backend and frontend databases.
- Complex real-time infrastructure.
- Unnecessary WebSockets.
- Unnecessary external services.
- Large third-party UI kits that fight Tailwind.
- AI for authoritative stock calculations.

Use a **modular monolith**.

---

# 6. Fixed Technology Stack

## Backend

- Java 17+
- Spring Boot 3.x
- Spring MVC
- Spring Security
- Spring Data JPA
- Hibernate
- Jakarta Bean Validation

## Security

- JWT access token.
- Refresh token.
- BCrypt.
- `@PreAuthorize`.
- Stateless security.

## Database

- PostgreSQL.

## Frontend

- React.
- Vite.
- Tailwind CSS.

## Build

- Maven.

## API

Version all APIs under:

`/api/v1`

---

# 7. High-Level Architecture

```text
                         STOCKSENSE
                             |
                    React Web Application
                             |
                        REST / JSON
                             |
                    Spring Boot Monolith
                             |
        +--------------------+--------------------+
        |                    |                    |
   Controllers           Services             Security
        |                    |                    |
        +--------------------+--------------------+
                             |
                         Spring Data JPA
                             |
                         PostgreSQL
                             |
        +--------------------+--------------------+
        |                    |                    |
      Users              Inventory            Ledger
                         / Stock              / Audit
```

## 7.1 Architectural Rule

Controllers must remain thin.

Business logic belongs in services.

Repositories handle data access.

DTOs cross the API boundary.

Entities should not be exposed directly as API responses.

---

# 8. Core Inventory Architecture

The inventory engine is the heart of the application.

```text
                USER ACTION
                     |
                     v
             REST CONTROLLER
                     |
                     v
             BUSINESS SERVICE
                     |
                     v
             VALIDATE OPERATION
                     |
                     v
             OPEN DB TRANSACTION
                     |
                     v
              LOCK / READ STOCK
                     |
                     v
              UPDATE CURRENT STOCK
                     |
                     v
              CREATE STOCK MOVE
                     |
                     v
                  COMMIT
```

If the stock update fails, the ledger entry must not be committed.

If the ledger insert fails, the stock update must not remain committed.

This must be one atomic transaction.

---

# 9. Inventory Invariants

These rules are non-negotiable.

## 9.1 Current Stock Formula

```text
Current Stock
=
Opening Stock
+ Receipts
- Deliveries
± Adjustments
```

Internal transfers do not change total company stock.

## 9.2 Location Rule

For an internal transfer:

```text
Source Location = Source Location - Quantity
Destination Location = Destination Location + Quantity
```

## 9.3 Global Consistency Rule

```text
Sum of all location quantities
=
Product total current stock
```

## 9.4 Transaction Rule

Only validated/completed operations can change stock.

Draft operations must not change stock.

Canceled operations must not create a stock effect.

Completed operations must not be silently edited into a different stock event.

---

# 10. State Machine

Use these statuses:

```text
DRAFT
WAITING
READY
DONE
CANCELED
```

## 10.1 Valid transitions

```text
DRAFT -> WAITING
DRAFT -> READY
WAITING -> READY
READY -> DONE
DRAFT -> CANCELED
WAITING -> CANCELED
READY -> CANCELED
```

Actual allowed transitions should be implemented consistently across operation types.

## 10.2 Invalid transitions

Examples:

```text
DONE -> DRAFT
DONE -> READY
DONE -> CANCELED
CANCELED -> READY
CANCELED -> DONE
```

Return a business error such as:

`INVALID_STATE_TRANSITION`

with HTTP `409 Conflict`.

---

# 11. Database Design

Use UUID or BIGSERIAL consistently. Pick one approach at project creation and do not mix them.

Recommended for hackathon simplicity:

**BIGINT generated IDs** for internal database IDs.

Use human-readable references for business documents.

Example:

```text
RC-00001
DO-00001
INT-00001
ADJ-00001
MOV-00001
```

---

# 12. Entity: User

## Fields

| Field | Type | Rules |
|---|---|---|
| id | Long | PK |
| name | String | required |
| email | String | required, unique |
| passwordHash | String | required |
| role | Enum | MANAGER / STAFF |
| active | Boolean | default true |
| createdAt | Instant | required |
| updatedAt | Instant | required |

## Role Enum

```text
MANAGER
STAFF
```

## Rules

- Email must be unique.
- Password is never stored raw.
- Inactive users cannot authenticate.
- Password hash must never be returned in API responses.

---

# 13. Entity: Warehouse

## Fields

| Field | Type | Rules |
|---|---|---|
| id | Long | PK |
| name | String | required |
| code | String | required, unique |
| address | String | optional |
| active | Boolean | default true |
| createdAt | Instant | required |
| updatedAt | Instant | required |

---

# 14. Entity: Location

## Fields

| Field | Type | Rules |
|---|---|---|
| id | Long | PK |
| name | String | required |
| code | String | required |
| warehouseId | Long/FK | required |
| parentLocationId | Long/FK | optional |
| active | Boolean | default true |
| createdAt | Instant | required |
| updatedAt | Instant | required |

## Example

```text
Main Warehouse
├── Rack A
├── Rack B
└── Production Area
    ├── Rack P1
    └── Rack P2
```

A location belongs to exactly one warehouse.

---

# 15. Entity: Category

## Fields

| Field | Type | Rules |
|---|---|---|
| id | Long | PK |
| name | String | required, unique |
| description | String | optional |
| active | Boolean | default true |
| createdAt | Instant | required |
| updatedAt | Instant | required |

---

# 16. Entity: Product

## Fields

| Field | Type | Rules |
|---|---|---|
| id | Long | PK |
| name | String | required |
| sku | String | required, unique |
| categoryId | Long/FK | required |
| unitOfMeasure | String | required |
| reorderLevel | BigDecimal | >= 0 |
| active | Boolean | default true |
| createdAt | Instant | required |
| updatedAt | Instant | required |

## Rules

- SKU is globally unique.
- Product cannot be physically deleted if it has historical StockMove records.
- Deactivate instead of deleting historical products where practical.
- `reorderLevel >= 0`.

---

# 17. Entity: Stock

Stock represents the current quantity of one product at one location.

## Fields

| Field | Type | Rules |
|---|---|---|
| id | Long | PK |
| productId | Long/FK | required |
| locationId | Long/FK | required |
| quantity | BigDecimal | normally >= 0 |
| version | Long | optimistic-lock version if used |
| updatedAt | Instant | required |

## Constraint

Unique combination:

```text
(product_id, location_id)
```

There must be exactly one current Stock row for a product/location pair.

---

# 18. Entity: StockMove

StockMove is the unified stock movement ledger.

## Fields

| Field | Type | Rules |
|---|---|---|
| id | Long | PK |
| reference | String | required, unique |
| type | Enum | required |
| status | Enum | required |
| productId | Long/FK | required |
| quantity | BigDecimal | positive for movement magnitude |
| sourceLocationId | Long/FK | optional |
| destinationLocationId | Long/FK | optional |
| userId | Long/FK | required |
| reason | String | optional |
| resultingQuantity | BigDecimal | optional |
| createdAt | Instant | required |

## Type Enum

```text
RECEIPT
DELIVERY
INTERNAL
ADJUSTMENT
```

## Why one generic ledger table?

Use one StockMove table because all stock-affecting actions share the core audit concepts:

- product
- quantity
- operation type
- source/destination
- user
- timestamp
- status
- reference

One movement model provides:

- one audit trail
- consistent filtering
- consistent reporting
- simpler dashboard aggregation
- chronological history
- less duplicated code

Do not create four independent ledger tables.

---

# 19. Optional Reorder Rule Entity

If implemented as P1, use:

```text
ReorderRule
```

Possible fields:

```text
id
productId
locationId or warehouseId
minimumQuantity
maximumQuantity
active
createdAt
updatedAt
```

Keep the first version simple.

---

# 20. Optional Refresh Token Persistence

For stronger security, maintain a refresh-token record.

Possible fields:

```text
id
userId
tokenHash
expiresAt
revoked
createdAt
```

Never store an unprotected long-lived refresh token unnecessarily.

---

# 21. Database Indexes

At minimum consider:

```text
users(email)
products(sku)
products(category_id)
stock(product_id, location_id)
stock_move(reference)
stock_move(product_id)
stock_move(type)
stock_move(status)
stock_move(created_at)
stock_move(user_id)
location(warehouse_id)
```

Use indexes only where they support actual query patterns.

---

# 22. Backend Package Structure

Use:

```text
src/main/java/com/stocksense/
├── config/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
│   ├── auth/
│   ├── product/
│   ├── warehouse/
│   ├── location/
│   ├── receipt/
│   ├── delivery/
│   ├── transfer/
│   ├── adjustment/
│   ├── move/
│   ├── dashboard/
│   └── reorder/
├── security/
├── exception/
├── mapper/
└── util/
```

---

# 23. Backend Class Plan

## Config

Create only required configuration:

```text
SecurityConfig
CorsConfig
JpaConfig if necessary
JacksonConfig if necessary
```

## Security

```text
JwtService
JwtAuthFilter
CustomUserDetailsService
RefreshTokenService
OtpService
```

## Controllers

```text
AuthController
ProductController
CategoryController
WarehouseController
LocationController
StockController
ReceiptController
DeliveryController
TransferController
AdjustmentController
MoveController
DashboardController
RiskController
ReorderController
```

## Services

```text
AuthService
ProductService
CategoryService
WarehouseService
LocationService
StockService
ReceiptService
DeliveryService
TransferService
AdjustmentService
MoveService
DashboardService
RiskService
ReorderService
```

Do not create services that have no business responsibility.

---

# 24. REST API Conventions

Base path:

`/api/v1`

Use nouns for resources.

Use an explicit action endpoint for state-changing validation actions.

Example:

```text
POST /api/v1/receipts/{id}/validate
```

rather than putting business logic inside a generic update endpoint.

---

# 25. Authentication API

## Signup

```http
POST /api/v1/auth/signup
```

Request:

```json
{
  "name": "Tejas",
  "email": "tejas@example.com",
  "password": "StrongPassword123"
}
```

Response:

```json
{
  "id": 1,
  "name": "Tejas",
  "email": "tejas@example.com",
  "role": "STAFF"
}
```

Rules:

- Email unique.
- Password minimum strength.
- Do not allow arbitrary self-registration as MANAGER unless explicitly configured.
- Default signup role should be STAFF.

---

# 26. Login API

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "tejas@example.com",
  "password": "StrongPassword123"
}
```

Response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": 1,
    "name": "Tejas",
    "email": "tejas@example.com",
    "role": "STAFF"
  }
}
```

---

# 27. Refresh Token API

```http
POST /api/v1/auth/refresh
```

Request:

```json
{
  "refreshToken": "..."
}
```

Response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 900
}
```

---

# 28. Forgot Password / OTP API

## Request OTP

```http
POST /api/v1/auth/forgot-password
```

Request:

```json
{
  "email": "tejas@example.com"
}
```

## Verify OTP

```http
POST /api/v1/auth/verify-otp
```

Request:

```json
{
  "email": "tejas@example.com",
  "otp": "123456"
}
```

## Reset Password

```http
POST /api/v1/auth/reset-password
```

Request:

```json
{
  "email": "tejas@example.com",
  "otp": "123456",
  "newPassword": "NewStrongPassword123"
}
```

Rules:

- OTP expires.
- OTP attempts are limited.
- Resend is rate-limited.
- OTP should be hashed before persistent storage.
- OTP becomes invalid after successful use.
- Do not reveal whether an email exists more than necessary.
- For hackathon demo mode, OTP may be surfaced through a controlled development mechanism, but do not claim production email delivery unless actually configured.

---

# 29. Product API

```text
GET    /api/v1/products
GET    /api/v1/products/{id}
POST   /api/v1/products
PUT    /api/v1/products/{id}
DELETE /api/v1/products/{id}
```

## Product list query parameters

Support:

```text
q
sku
categoryId
warehouseId
locationId
status
page
size
sort
```

Example:

```text
GET /api/v1/products?q=steel&status=LOW_STOCK
```

---

# 30. Category API

```text
GET  /api/v1/categories
GET  /api/v1/categories/{id}
POST /api/v1/categories
PUT  /api/v1/categories/{id}
```

Deletion is optional and should not break historical relationships.

---

# 31. Warehouse API

```text
GET  /api/v1/warehouses
GET  /api/v1/warehouses/{id}
POST /api/v1/warehouses
PUT  /api/v1/warehouses/{id}
```

---

# 32. Location API

```text
GET  /api/v1/locations
GET  /api/v1/locations/{id}
POST /api/v1/locations
PUT  /api/v1/locations/{id}
```

Filters:

```text
warehouseId
parentLocationId
active
```

---

# 33. Stock API

```text
GET /api/v1/stock
GET /api/v1/stock/product/{productId}
GET /api/v1/stock/location/{locationId}
```

Response example:

```json
{
  "productId": 1,
  "productName": "Steel Rod",
  "sku": "STL-001",
  "warehouse": "Main Warehouse",
  "location": "Rack A",
  "quantity": 77,
  "unitOfMeasure": "kg",
  "reorderLevel": 25,
  "status": "HEALTHY"
}
```

---

# 34. Receipt API

```text
GET    /api/v1/receipts
GET    /api/v1/receipts/{id}
POST   /api/v1/receipts
PUT    /api/v1/receipts/{id}
POST   /api/v1/receipts/{id}/validate
POST   /api/v1/receipts/{id}/cancel
```

## Receipt create request

```json
{
  "supplier": "ABC Metals",
  "destinationLocationId": 10,
  "items": [
    {
      "productId": 1,
      "quantity": 100
    }
  ],
  "notes": "Morning delivery"
}
```

## Validate rule

On successful validation:

```text
Stock(destination) += quantity
```

Create:

```text
StockMove(type=RECEIPT, status=DONE)
```

Both occur in one transaction.

---

# 35. Delivery API

```text
GET    /api/v1/deliveries
GET    /api/v1/deliveries/{id}
POST   /api/v1/deliveries
PUT    /api/v1/deliveries/{id}
POST   /api/v1/deliveries/{id}/pick
POST   /api/v1/deliveries/{id}/pack
POST   /api/v1/deliveries/{id}/validate
POST   /api/v1/deliveries/{id}/cancel
```

## Validation rule

For every line:

```text
requestedQuantity <= availableStock
```

Otherwise:

```text
HTTP 409
INSUFFICIENT_STOCK
```

On success:

```text
Stock(source) -= quantity
```

Create:

```text
StockMove(type=DELIVERY, status=DONE)
```

---

# 36. Internal Transfer API

```text
GET    /api/v1/transfers
GET    /api/v1/transfers/{id}
POST   /api/v1/transfers
PUT    /api/v1/transfers/{id}
POST   /api/v1/transfers/{id}/validate
POST   /api/v1/transfers/{id}/cancel
```

Request:

```json
{
  "sourceLocationId": 10,
  "destinationLocationId": 20,
  "items": [
    {
      "productId": 1,
      "quantity": 30
    }
  ],
  "notes": "Move material to production"
}
```

Validation:

```text
source stock >= transfer quantity
source != destination
both locations valid
both locations belong to active warehouse structures
```

On success:

```text
Source -= quantity
Destination += quantity
```

Total inventory must not change.

---

# 37. Adjustment API

```text
GET  /api/v1/adjustments
GET  /api/v1/adjustments/{id}
POST /api/v1/adjustments
POST /api/v1/adjustments/{id}/apply
POST /api/v1/adjustments/{id}/cancel
```

Create request:

```json
{
  "productId": 1,
  "locationId": 20,
  "physicalQuantity": 97,
  "reason": "DAMAGED",
  "notes": "Three damaged units found"
}
```

Business calculation:

```text
delta = physicalQuantity - currentSystemQuantity
```

Example:

```text
97 - 100 = -3
```

On apply:

```text
stock += delta
```

Create StockMove:

```text
type = ADJUSTMENT
status = DONE
reason = selected reason
```

---

# 38. Adjustment Reasons

Use controlled values:

```text
DAMAGED
MISSING
MISPLACED
COUNTING_ERROR
OTHER
```

---

# 39. Ledger API

```text
GET /api/v1/moves
GET /api/v1/moves/{id}
```

Filters:

```text
productId
type
status
warehouseId
locationId
userId
from
to
page
size
sort
```

Return:

- reference
- timestamp
- type
- status
- product
- quantity
- source
- destination
- user
- reason
- resulting quantity

---

# 40. Dashboard API

Use one aggregated endpoint:

```http
GET /api/v1/dashboard
```

Response:

```json
{
  "totalStock": 4820,
  "lowStockCount": 14,
  "outOfStockCount": 3,
  "pendingReceipts": 12,
  "pendingDeliveries": 8,
  "pendingTransfers": 5,
  "stockByLocation": [],
  "recentMovements": [],
  "riskItems": [],
  "operationsToday": []
}
```

Dashboard values must come from PostgreSQL.

Do not hardcode them in React.

---

# 41. Risk API

Optional P1:

```http
GET /api/v1/risk
```

Risk categories:

- OUT_OF_STOCK
- LOW_STOCK
- LARGE_VARIANCE
- PENDING_ACTION

The risk logic must be explainable.

Avoid arbitrary AI scores.

---

# 42. Reorder API

Optional P1:

```http
GET /api/v1/reorder/recommendations
```

Simple recommendation:

```text
if current stock <= reorderLevel
    recommend replenishment
```

Suggested quantity can initially be:

```text
targetLevel - currentStock
```

where target level is configured.

Do not claim sophisticated demand forecasting unless it has actually been implemented and tested.

---

# 43. HTTP Status Code Policy

Use:

```text
200 OK
201 CREATED
204 NO CONTENT
400 BAD REQUEST
401 UNAUTHORIZED
403 FORBIDDEN
404 NOT FOUND
409 CONFLICT
500 INTERNAL SERVER ERROR
```

Examples:

```text
Duplicate SKU -> 409
Insufficient stock -> 409
Invalid transition -> 409
Missing required field -> 400
Malformed JSON -> 400
Missing token -> 401
Insufficient role -> 403
Missing resource -> 404
```

---

# 44. Global Error Response

Every error should follow one shape:

```json
{
  "timestamp": "2026-09-26T10:30:00Z",
  "status": 409,
  "code": "INSUFFICIENT_STOCK",
  "message": "Requested quantity exceeds available stock.",
  "path": "/api/v1/deliveries/12/validate"
}
```

Do not return random error formats from different controllers.

---

# 45. Exception List

Minimum exceptions:

```text
ResourceNotFoundException
DuplicateSkuException
DuplicateEmailException
InsufficientStockException
InvalidStateTransitionException
UnauthorizedOperationException
InvalidOtpException
OtpExpiredException
OtpRateLimitException
InvalidLocationException
InvalidTransferException
```

---

# 46. Validation Architecture

Use two levels.

## Layer 1 — DTO validation

For structural validation:

```text
@NotBlank
@NotNull
@Email
@Size
@Positive
@PositiveOrZero
```

## Layer 2 — Business validation

For domain rules:

```text
SKU uniqueness
stock availability
state transitions
source != destination
location validity
role authorization
duplicate validation
```

DTO validation prevents malformed requests.

Service validation protects business correctness.

---

# 47. Security Architecture

## Public

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/forgot-password
POST /api/v1/auth/verify-otp
POST /api/v1/auth/reset-password
POST /api/v1/auth/refresh
```

## Authenticated

Everything else unless explicitly marked public.

## SecurityConfig

Configure:

- CSRF appropriate for stateless bearer-token API.
- Stateless session management.
- CORS scoped to known frontend origin.
- Password encoder.
- Authentication provider.
- JWT filter.
- Exception handling.

## JwtAuthFilter

Place JWT processing before the controller executes.

It must:

1. Read Bearer token.
2. Validate signature/claims.
3. Extract subject/roles.
4. Populate Spring Security context.
5. Continue filter chain.

Do not perform database-heavy work unnecessarily inside every request.

---

# 48. Authorization Matrix

| Capability | STAFF | MANAGER |
|---|---:|---:|
| Login | Yes | Yes |
| View dashboard | Yes | Yes |
| View products | Yes | Yes |
| Create products | Limited/Yes | Yes |
| Edit products | Limited/Yes | Yes |
| Configure categories | No/limited | Yes |
| View stock | Yes | Yes |
| Receipt operations | Yes | Yes |
| Delivery operations | Yes | Yes |
| Internal transfer | Yes | Yes |
| Create adjustment | Yes | Yes |
| Apply sensitive adjustment | No or approval required | Yes |
| Warehouse configuration | No | Yes |
| Reorder rules | No | Yes |
| View ledger | Yes | Yes |
| User administration | No | Yes |

Keep the permission model understandable.

---

# 49. OTP Security

Required:

- Random six-digit OTP.
- Expiry, e.g. 5 minutes.
- Maximum verification attempts, e.g. 5.
- Resend cooldown.
- OTP invalidated after successful verification.
- OTP stored hashed, not plaintext, where persisted.
- Do not log OTP in production logs.
- Demo mode may expose OTP through a clearly marked development mechanism.

---

# 50. Secret Management

Never commit:

```text
JWT_SECRET
DB_PASSWORD
EMAIL_PASSWORD
API_KEYS
```

Use:

```text
application-local.yml
environment variables
or local untracked configuration
```

Add secrets to `.gitignore`.

Provide a `.env.example` or equivalent with placeholder values only.

---

# 51. Token Storage Strategy

The frontend must not casually expose long-lived secrets.

Recommended hackathon approach:

- Short-lived access token for API authorization.
- Refresh-token strategy with secure handling.
- Prefer HTTP-only cookie for refresh token where implementation allows.
- Keep access-token lifetime short.
- On 401, attempt refresh once.
- If refresh fails, clear session and return to login.

Document whichever exact implementation the team chooses and do not mix token strategies.

---

# 52. Transaction and Concurrency Safety

This section is mandatory.

## Receipt validation

```text
BEGIN TRANSACTION
  verify state
  lock/read stock
  increment stock
  create StockMove
  mark receipt DONE
COMMIT
```

## Delivery validation

```text
BEGIN TRANSACTION
  verify state
  lock/read source stock
  verify available quantity
  decrement stock
  create StockMove
  mark delivery DONE
COMMIT
```

## Internal transfer

```text
BEGIN TRANSACTION
  verify state
  lock/read source and destination stock
  verify source quantity
  decrement source
  increment destination
  create StockMove
  mark transfer DONE
COMMIT
```

## Adjustment

```text
BEGIN TRANSACTION
  verify state
  lock/read stock
  calculate delta
  update stock
  create StockMove
  mark adjustment DONE
COMMIT
```

If any step fails:

```text
ROLLBACK
```

---

# 53. Double-Submission Protection

The frontend must:

- Disable validate button while request is pending.
- Show loading state.
- Prevent repeated clicks.

The backend must still protect itself.

If an operation is already `DONE`:

```text
return 409
```

or safely treat repeated validation as idempotent.

Do not rely only on frontend protection.

---

# 54. Negative Stock Policy

Default policy:

> **Do not allow delivery or transfer that would create negative source stock.**

If the business later needs negative inventory, it must be an explicit policy, not an accidental side effect.

---

# 55. Frontend Architecture

Use:

```text
src/
├── api/
├── components/
├── layouts/
├── pages/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── stock/
│   ├── receipts/
│   ├── deliveries/
│   ├── transfers/
│   ├── adjustments/
│   ├── ledger/
│   ├── warehouses/
│   ├── categories/
│   ├── risk/
│   └── reorder/
├── hooks/
├── routes/
├── types/
├── utils/
└── styles/
```

---

# 56. Frontend Shared Components

Build these once:

```text
AppShell
Sidebar
Topbar
PageHeader
PrimaryButton
SecondaryButton
DangerButton
StatusBadge
StockStatusBadge
KpiCard
DataTable
SearchBar
FilterBar
SelectField
TextField
NumberField
FormSection
Modal
Drawer
Toast
ConfirmDialog
EmptyState
LoadingState
ErrorState
Pagination
MovementRow
ProductAvatar/Icon
Timeline
```

Do not recreate these on every page.

---

# 57. UI Design Direction

## Product Personality

StockSense must feel like:

**Modern SaaS + ERP + Warehouse Control Center**

It should NOT feel like:

- Generic college dashboard.
- Overloaded admin panel.
- Dribbble-only concept UI.
- Excessive glassmorphism.
- Over-animated marketing page.

## Visual Rules

Use:

- light neutral background
- white cards
- deep purple primary accent
- subtle borders
- subtle shadows
- 8–12px card radius
- readable typography
- meaningful status colors
- strong spacing hierarchy

---

# 58. Color System

Recommended:

```text
Primary: Odoo-style purple
Background: very light neutral
Surface: white
Text: deep neutral
Muted: slate/gray
Success: green
Warning: amber
Error: red
Info: blue
```

Do not use many decorative colors.

Color must communicate state.

---

# 59. Typography

Use a readable sans-serif such as:

**Inter**

Approximate sizes:

```text
Page title: 28–32px
Section title: 18–22px
Body: 14–16px
Table: 13–14px
KPI number: 26–32px
```

---

# 60. Layout

Desktop target:

**1440 × 900**

Structure:

```text
+-----------------------------------------------------------+
| Topbar                                                     |
+-------------+---------------------------------------------+
|             |                                             |
|  Sidebar    |              Main Workspace                 |
|             |                                             |
|             |                                             |
+-------------+---------------------------------------------+
```

Sidebar width:

Approximately 240–260px.

Mobile:

Below 768px use a collapsible menu.

---

# 61. Main Navigation

Use:

```text
Dashboard

Products

Operations
  Receipts
  Delivery Orders
  Internal Transfers
  Inventory Adjustments
  Move History

Inventory
  Stock Overview
  Stock by Location

Intelligence
  Risk Center
  Reorder Recommendations

Configuration
  Warehouses
  Locations
  Categories
  Reordering Rules

My Profile
Logout
```

Do not add unnecessary menu items.

---

# 62. Dashboard Design

The dashboard must stay minimal.

## Top

- Page title.
- Global search.
- Warehouse selector.
- Notifications/profile.
- Primary action buttons.

## KPI cards

Required:

```text
Total Stock
Low Stock
Out of Stock
Pending Receipts
Pending Transfers
```

## Main body

### Panel 1 — Inventory Risk Center

Only show products needing attention.

### Panel 2 — Stock by Location

Show distribution across warehouses/locations.

### Panel 3 — Recent Stock Movement

Latest ledger events.

### Panel 4 — Operations Today

Receipts, deliveries, transfers, adjustments.

Do not add charts just to fill space.

---

# 63. Dashboard UX Principle

The first screen should answer:

```text
What do I have?
What is risky?
What is moving?
What should I act on?
```

The user should understand the page in approximately 10 seconds.

---

# 64. Dashboard Example Structure

```text
STOCKSENSE

Good morning

[ Search products, SKU, transfers... ]

[ Main Warehouse ▼ ]                         [ Profile ]

------------------------------------------------------------

[ Total Stock ] [ Low Stock ] [ Out of Stock ]
[ 4,820 ]       [ 14 ]        [ 3 ]

[ Pending Receipts ] [ Pending Transfers ]

------------------------------------------------------------

[ Inventory Risk Center              ] [ Stock by Location ]
[ Copper Wire     0   OUT OF STOCK    ] [ chart              ]
[ Steel Rod      18   LOW STOCK       ] [                    ]
[ Bearings        7   LOW STOCK       ] [                    ]

------------------------------------------------------------

[ Operations Today                    ]
[ Recent Stock Movement               ]
```

---

# 65. Product List Page

Required columns:

```text
Product
SKU
Category
On Hand
Warehouse
Location
Status
Actions
```

Controls:

- Search.
- Category filter.
- Warehouse filter.
- Location filter.
- Status filter.
- New Product.

Use pagination.

---

# 66. Product Detail Page

The product detail screen should answer everything about one product.

Show:

```text
Name
SKU
Category
UOM
Current Stock
Available Stock if implemented
Reorder Level
Status
```

Then:

```text
Stock by Location
```

Then:

```text
Recent Movement Timeline
```

Primary actions:

```text
Receive
Transfer
Adjust
```

Optional P2 action:

```text
Explain Stock
```

---

# 67. Stock Overview Page

Columns:

```text
Product
SKU
Warehouse
Location
Quantity
UOM
Reorder Level
Status
```

Filters:

```text
Product
Warehouse
Location
Category
Status
```

---

# 68. Stock by Location Page

Hierarchical view:

```text
Main Warehouse
  Rack A
    Steel Rod     70 kg
    Copper Wire   20 rolls

  Rack B
    Bearings      50 pcs

Production
  Rack P1
    Steel Rod     30 kg
```

This is one of the clearest demonstrations of location-aware inventory.

---

# 69. Receipt UI

Receipt page:

```text
New Receipt

Reference
Supplier
Destination Location

Products
--------------------------------
Product | SKU | Quantity | UOM
--------------------------------

Notes

[ Save Draft ] [ Validate ]
```

After successful validation:

```text
✓ Receipt Validated

Steel Rod
+100 kg

Stock updated.
Ledger entry created.
```

Do not force the user through unnecessary steps in the demo.

---

# 70. Delivery UI

Delivery page:

```text
New Delivery

Reference
Customer
Source Location

Products
--------------------------------
Product | Available | Quantity
--------------------------------

Workflow:
Picked -> Packed -> Ready

[ Validate Delivery ]
```

Before validation clearly show available stock.

If quantity exceeds stock:

```text
Insufficient Stock

Available: 20
Requested: 30
```

---

# 71. Internal Transfer UI

This page needs an obvious visual FROM → TO design.

```text
FROM

Main Warehouse
Rack A

       ↓ 30 kg

TO

Production
Rack P1
```

Show source stock availability before submission.

After success:

```text
Rack A: 100 -> 70
Rack P1: 20 -> 50

Total inventory: unchanged
```

---

# 72. Adjustment UI

Make the discrepancy the visual focus.

```text
Inventory Adjustment

Product: Steel Rod
Location: Production Rack

System Quantity
100 kg

Physical Count
97 kg

------------------

Variance
-3 kg

Reason
[ Damaged ▼ ]

[ Apply Adjustment ]
```

This is preferable to allowing direct editing of a stock number.

---

# 73. Stock Ledger UI

Use a dense but readable table.

Columns:

```text
Reference
Date/Time
Type
Product
From
To
Quantity
User
Status
```

Filters:

```text
Product
Operation
Warehouse
Location
User
Date
```

Clicking a row opens movement details.

Historical completed records should not be arbitrarily editable.

---

# 74. Risk Center UI

Risk categories:

```text
OUT OF STOCK
LOW STOCK
LARGE VARIANCE
PENDING ACTION
```

Each row should provide:

- explanation
- current value
- threshold
- action

Example:

```text
Steel Rod
18 kg
Minimum 25 kg
LOW STOCK

[View] [Recommend Order]
```

Do not display unexplained scores.

---

# 75. Reorder Recommendation UI

Show:

```text
Product
Current Stock
Minimum Level
Target Level
Suggested Reorder
Action
```

Example:

```text
Steel Rod
18 kg
25 kg
50 kg
32 kg
```

The calculation should come from backend logic.

---

# 76. Loading / Empty / Error States

Every list must support:

## Loading

Skeleton or appropriate spinner.

## Empty

Useful message plus action.

Example:

```text
No receipts yet.

Create your first receipt.

[ + New Receipt ]
```

## Error

```text
Something went wrong.

[ Retry ]
```

## Mutation loading

Disable buttons while submitting.

---

# 77. Frontend API Strategy

Create a centralized HTTP client.

Do not scatter raw network calls across components.

Example service organization:

```text
authApi
productApi
stockApi
receiptApi
deliveryApi
transferApi
adjustmentApi
ledgerApi
dashboardApi
riskApi
reorderApi
```

Handle:

- authentication
- refresh
- 401
- 403
- 404
- 409
- 500

---

# 78. Frontend State Strategy

Use the simplest state architecture that works.

Avoid introducing Redux unless there is a real need.

Local page state is appropriate for:

- form input
- modal state
- temporary filters

A lightweight query/cache solution may be used if already comfortable, but keep it consistent.

After a successful mutation:

- invalidate/refetch relevant stock.
- refetch dashboard.
- refetch ledger if visible.
- update affected product detail.

---

# 79. Frontend Token Handling

Requirements:

- Access token must expire.
- Refresh token must refresh the session.
- API client retries refresh only once on 401.
- If refresh fails, clear auth state and redirect to login.
- Never endlessly retry unauthorized requests.

---

# 80. Responsive Requirements

At minimum test:

```text
1440 x 900
1280 x 720
1024 x 768
768px threshold
mobile width
```

No:

- horizontal page overflow
- overlapping buttons
- broken tables
- inaccessible dialogs
- unreadable tiny text

---

# 81. Accessibility / Usability Minimum

Use:

- labels for inputs.
- keyboard-accessible buttons.
- visible focus states.
- sufficient contrast.
- clear error text.
- predictable tab order where practical.
- no status communicated by color alone.

---

# 82. Seed Data Strategy

Use PostgreSQL seed data.

Do not hardcode final dashboard numbers inside React.

## Recommended products

```text
Steel Rod
Copper Wire
Bearings
Plastic Sheets
Office Chairs
Packaging Boxes
```

## Recommended warehouses

```text
Main Warehouse
Warehouse 2
```

## Recommended locations

```text
Main Warehouse / Rack A
Main Warehouse / Rack B
Main Warehouse / Production
Warehouse 2 / Rack C
```

## Seed conditions

Create data that demonstrates:

- healthy stock
- low stock
- out-of-stock
- pending receipt
- pending delivery
- pending transfer
- recent movement history
- at least one adjustment

---

# 83. Demo Dataset

Prepare one hero product:

```text
Product:
Steel Rod

SKU:
STL-001

UOM:
kg

Initial stock:
0
```

Use this product for the end-to-end story.

---

# 84. Golden Demo Scenario

This is the most important scenario.

## Step 1 — Receive

Receive:

**100 kg Steel Rod**

Result:

```text
Stock = 100 kg
```

Ledger:

```text
RECEIPT +100
```

## Step 2 — Transfer

Move:

**30 kg**

Main Warehouse / Rack A

to:

Production / Rack P1

Result:

```text
Rack A = 70
Production = 30
Total = 100
```

Ledger records the movement.

## Step 3 — Deliver

Deliver:

**20 kg**

Result:

```text
Total = 80
```

## Step 4 — Adjustment

Find:

**3 kg damaged**

Physical count:

```text
77 kg
```

If system quantity before adjustment is 80:

```text
77 - 80 = -3
```

Final:

```text
77 kg
```

## Step 5 — Open Ledger

Show the entire history.

---

# 85. Important Clarification About the Supplied Example

The source example contains a wording inconsistency in the delivery step: it says to deliver “20 steel” and then refers to stock for frames.

Do not create a separate business rule around that wording.

Use the coherent transaction example:

**Deliver 20 kg Steel Rod → stock decreases by 20.**

---

# 86. Judge “Wow” Moment

Do not depend on flashy animation.

The wow moment is:

```text
CLICK VALIDATE
      |
      v
STOCK CHANGES
      |
      v
LOCATION CHANGES
      |
      v
LEDGER ENTRY APPEARS
      |
      v
DASHBOARD REFRESHES
```

The judge should visually see the entire system react to one real transaction.

---

# 87. AI Feature Policy

If AI is added, AI must sit above the inventory engine.

Correct:

```text
PostgreSQL
   ↓
Validated business data
   ↓
AI explanation/recommendation
```

Incorrect:

```text
LLM
 ↓
decides stock quantity
 ↓
writes stock
```

The LLM must never become the authoritative source for inventory quantity.

---

# 88. Optional AI Feature — Explain Stock

Example prompt:

> Explain why Steel Rod currently has 77 kg.

System response should summarize known facts:

```text
100 kg received.
30 kg transferred.
20 kg delivered.
3 kg adjusted for damage.

Current balance:
77 kg.
```

This is more defensible than an LLM inventing inventory numbers.

---

# 89. Optional AI Feature — Natural Language Query

Examples:

```text
Which products are low in stock?

Where is Steel Rod?

Which receipts are pending?

Which products need replenishment?
```

The AI should call controlled backend/query functions.

Never allow the model to execute arbitrary SQL.

---

# 90. Optional Barcode Feature

If time remains:

```text
Scan SKU
   ↓
Find Product
   ↓
Choose:
Receive / Transfer / Count
```

Do not make barcode scanning a dependency for basic inventory functionality.

---

# 91. Reorder Logic

Initial deterministic rule:

```text
if currentStock == 0:
    status = OUT_OF_STOCK
else if currentStock <= reorderLevel:
    status = LOW_STOCK
else:
    status = HEALTHY
```

Optional recommended quantity:

```text
recommendedQuantity =
max(targetLevel - currentStock, 0)
```

Do not build statistical forecasting during the core 8-hour window.

---

# 92. Product Stock Status

Allowed statuses:

```text
HEALTHY
LOW_STOCK
OUT_OF_STOCK
```

These should be derived, not stored redundantly unless there is a clear reason.

---

# 93. Search and Filtering

Product search:

- Product name.
- SKU.

Ledger search:

- Reference.
- Product.
- Type.
- User.

Global filters:

- Warehouse.
- Location.
- Category.
- Status.

Use pagination for lists.

---

# 94. API Pagination

For list APIs, support:

```text
page
size
sort
```

Default reasonable page size:

**20**

Maximum:

**100**

Do not request the entire ledger for every page.

---

# 95. Dashboard Query Efficiency

The dashboard should use one aggregated endpoint.

Avoid:

```text
frontend makes 10 unrelated requests
```

Prefer:

```text
GET /api/v1/dashboard
```

The service can execute optimized queries.

---

# 96. Repository Guidance

Use Spring Data JPA.

Recommended repository patterns:

```text
Optional<Product> findById(...)
Optional<Product> findBySku(...)
boolean existsBySku(...)

Optional<Stock> findByProductIdAndLocationId(...)
List<Stock> findByProductId(...)

Page<StockMove> findAll(...)

List<StockMove> findRecent...
```

Do not over-abstract the repository layer.

---

# 97. Service Responsibilities

## ProductService

- CRUD.
- SKU validation.
- Product activation/deactivation.

## StockService

- stock read.
- location stock read.
- transactional quantity changes.
- stock status calculation.

## ReceiptService

- receipt lifecycle.
- receipt validation.
- stock increase.
- ledger entry.

## DeliveryService

- lifecycle.
- pick/pack.
- availability check.
- stock decrease.
- ledger entry.

## TransferService

- lifecycle.
- source validation.
- source decrement.
- destination increment.
- ledger.

## AdjustmentService

- physical vs system quantity.
- delta.
- approval if used.
- stock update.
- ledger.

## DashboardService

- KPIs.
- movement summaries.
- location summaries.
- risk items.

---

# 98. Mapper Policy

Do not expose JPA entities directly.

Use:

```text
Entity -> Response DTO
Request DTO -> Entity/Command
```

Keep mapping straightforward.

Manual mapper classes are fine for a hackathon if the team wants maximum transparency.

---

# 99. Database Migration Policy

Use migrations if practical.

Recommended:

```text
V1__create_users.sql
V2__create_inventory_tables.sql
V3__create_indexes.sql
V4__seed_demo_data.sql
```

If migration setup would materially slow the hackathon team, use a controlled initialization strategy, but do not leave the database schema undocumented.

---

# 100. Environment Configuration

Use separate local configuration.

Example variables:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
JWT_ACCESS_EXPIRY
JWT_REFRESH_EXPIRY
FRONTEND_ORIGIN
OTP_EXPIRY_MINUTES
```

Provide:

```text
.env.example
```

or equivalent with placeholders.

---

# 101. CORS

Allow only the known frontend development/deployment origin.

Do not use:

```text
allowedOrigins("*")
```

for authenticated production-like behavior.

---

# 102. Git Strategy

Keep `main` stable.

Recommended branches:

```text
main
feature/auth
feature/inventory-engine
feature/dashboard
feature/operations
```

Each developer commits directly to their own feature branch.

Use pull requests when possible.

If the hackathon's time is extremely tight, a short review before merging is enough.

---

# 103. Commit Convention

Use:

```text
feat:
fix:
ui:
security:
test:
refactor:
docs:
```

Examples:

```text
feat: add receipt validation flow
feat: implement internal transfer stock update
security: add manager authorization
ui: build minimal inventory dashboard
fix: prevent duplicate delivery validation
test: add insufficient stock test
```

---

# 104. Git Contribution Requirement

Every team member must have real commits.

Do not:

- have one person make all commits.
- squash every teammate into one anonymous final commit.
- copy another teammate's entire branch without meaningful contribution.

The history should visibly demonstrate parallel work.

---

# 105. File Ownership

## Member 1 — Backend Foundation

Own:

```text
backend config
security
auth
users
entities
repositories
global exceptions
database initialization
```

## Member 2 — Inventory Engine

Own:

```text
products
stock
receipts
deliveries
transfers
adjustments
ledger
dashboard backend
risk/reorder backend
```

## Member 3 — Frontend Architecture

Own:

```text
frontend shell
sidebar
topbar
routing
design system
dashboard
products
stock
```

## Member 4 — Frontend Operations + QA

Own:

```text
receipts UI
deliveries UI
transfers UI
adjustments UI
ledger UI
risk/reorder UI
API integration
QA
demo
```

For a 3-person team, combine Member 3 and Member 4 responsibilities.

---

# 106. Shared Contract Freeze

By the end of Hour 1, freeze:

- entity names
- field names
- enum names
- API endpoint names
- request DTO naming
- response structure
- auth flow
- error response format

After this point, changes require explicit team agreement.

---

# 107. Frontend-Backend Parallel Development

Frontend must not wait for every backend endpoint.

During early hours:

Use typed mock responses only for component development.

Once a real endpoint becomes available:

Replace the mock with the real API.

Do not leave mock data in the final product.

---

# 108. 8-HOUR EXECUTION PLAN

## HOUR 0:00–0:30 — Kickoff

ALL:

- Read requirements.
- Create Git repository.
- Create branch structure.
- Confirm stack.
- Confirm entity list.
- Confirm roles.
- Confirm operation states.
- Confirm demo story.

Output:

**One shared contract document.**

---

# 109. HOUR 0:30–1:00 — Architecture Freeze

Member 1:

- Spring project.
- PostgreSQL configuration.
- Entities.
- Security skeleton.

Member 2:

- Inventory service design.
- Stock rules.
- Operation DTO drafts.

Member 3:

- React/Vite setup.
- Tailwind setup.
- Design tokens.
- App shell skeleton.

Member 4:

- UI operation wireframes.
- API integration client skeleton.
- Test checklist.
- Demo seed dataset design.

End-of-hour gate:

- Project compiles.
- frontend runs.
- backend runs.
- API contract frozen.

---

# 110. HOUR 1–2 — Foundations

## Member 1

Implement:

- User.
- Signup.
- Login.
- JWT.
- BCrypt.
- Role handling.
- Global errors.

## Member 2

Implement:

- Product.
- Category.
- Warehouse.
- Location.
- Stock.
- repository queries.

## Member 3

Implement:

- Sidebar.
- Topbar.
- Routing.
- Layout.
- Design system.
- Buttons.
- Inputs.
- Table.
- Badges.

## Member 4

Implement:

- API client.
- auth integration shell.
- operation list skeletons.
- mock-to-real integration structure.

---

# 111. HOUR 2–3 — First Working Inventory Flow

## Member 1

Finish:

- JWT.
- refresh.
- authorization.
- OTP flow.

## Member 2

Build first complete path:

```text
Receipt
→ Validate
→ Stock +
→ StockMove
```

This must be working before moving to advanced work.

## Member 3

Build:

- Dashboard.
- Products list.
- Product detail.

## Member 4

Build:

- Receipt UI.
- Product forms.
- success/error states.

### Gate

At the end of Hour 3:

**A real receipt must increase real PostgreSQL stock.**

---

# 112. HOUR 3–4 — Core Operations

## Member 1

- Security verification.
- Role tests.
- validation.
- authorization.

## Member 2

Implement:

- Delivery.
- Transfer.

## Member 3

Connect:

- dashboard
- products
- stock

to real APIs.

## Member 4

Implement:

- delivery UI
- transfer UI

### Gate

By Hour 4:

```text
Receive
Transfer
Deliver
```

must work.

---

# 113. HOUR 4–5 — Adjustment + Ledger

## Member 1

- Security hardening.
- OTP verification.
- cleanup.

## Member 2

Implement:

- adjustment.
- ledger.
- transaction safety.

## Member 3

Build:

- stock overview.
- stock by location.
- movement timeline.

## Member 4

Build:

- adjustment UI.
- ledger UI.
- filters.

### Gate

By Hour 5:

Complete stock cycle must work:

```text
Receipt
→ Transfer
→ Delivery
→ Adjustment
→ Ledger
```

---

# 114. HOUR 5–6 — Dashboard Intelligence

Member 1:

- final security fixes.

Member 2:

- dashboard aggregation.
- risk logic.
- reorder logic.

Member 3:

- dashboard polish.
- product detail polish.

Member 4:

- risk center.
- reorder page.
- full API integration.

### Gate

Dashboard must use live database data.

---

# 115. HOUR 6–7 — Integration + Polish

STOP adding large features.

Focus on:

- bugs
- spacing
- responsive layout
- API errors
- loading states
- disabled buttons
- duplicate submission protection
- permission checks
- ledger correctness
- dashboard numbers

Run the complete demo.

---

# 116. HOUR 7–7:30 — Hardening

Test every P0 flow.

Test:

```text
login
signup
logout
refresh
product create
duplicate SKU
receipt
delivery
insufficient stock
transfer
adjustment
ledger
dashboard
permissions
```

No major architecture changes.

---

# 117. HOUR 7:30–8:00 — Demo Lock

At 7:30:

**Feature freeze.**

Only:

- critical bugs.
- visual fixes.
- demo data fixes.
- presentation fixes.

Then rehearse:

```text
Login
→ Dashboard
→ Receive 100
→ Transfer 30
→ Deliver 20
→ Adjust -3
→ Ledger
→ Dashboard
```

---

# 118. Definition of Done for P0

A feature is DONE only when:

```text
UI exists
+
API exists
+
Validation exists
+
Authorization exists
+
Database persists
+
Transaction is correct
+
Stock changes correctly
+
Ledger entry exists
+
Error case works
+
Demo path works
```

A button connected to no real API is not done.

---

# 119. QA Test Matrix

## Authentication

| Test | Expected |
|---|---|
| valid signup | 201 |
| duplicate email | 409 |
| valid login | tokens |
| bad password | 401 |
| refresh | new access token |
| expired OTP | 409/400 |
| too many OTP attempts | rate limited |
| logout/session invalidation if implemented | session ends |

---

# 120. Product Tests

| Test | Expected |
|---|---|
| create product | success |
| duplicate SKU | 409 |
| blank name | 400 |
| negative reorder level | 400 |
| get product | correct |
| update product | correct |
| deactivate product | historical data remains |

---

# 121. Receipt Tests

| Test | Expected |
|---|---|
| create draft | no stock change |
| validate | stock increases |
| ledger created | yes |
| duplicate validate | rejected/safe |
| cancel | no stock effect |

---

# 122. Delivery Tests

| Test | Expected |
|---|---|
| valid delivery | stock decreases |
| insufficient stock | 409 |
| duplicate validate | rejected/safe |
| canceled delivery | no stock effect |
| ledger created | yes |

---

# 123. Transfer Tests

| Test | Expected |
|---|---|
| valid transfer | source -, destination + |
| insufficient source | 409 |
| same source/destination | 400/409 |
| total stock | unchanged |
| ledger created | yes |

---

# 124. Adjustment Tests

| Test | Expected |
|---|---|
| physical = system | delta 0 |
| physical lower | stock decreases |
| physical higher | stock increases |
| reason missing | validation error |
| apply twice | rejected/safe |
| ledger created | yes |

---

# 125. Ledger Tests

Every completed operation must result in exactly one corresponding movement record.

Test:

```text
Receipt -> 1 move
Delivery -> 1 move
Transfer -> 1 move
Adjustment -> 1 move
```

No silent stock changes should exist outside the transaction service.

---

# 126. Authorization Tests

Verify:

```text
STAFF cannot access manager-only configuration.
STAFF cannot perform manager-only approval.
MANAGER can access manager functions.
Unauthenticated user cannot access inventory APIs.
```

---

# 127. Dashboard Acceptance Tests

After receipt:

```text
stock KPI updates
recent movement updates
risk status recalculates if relevant
```

After delivery:

```text
stock decreases
movement appears
```

After transfer:

```text
location quantities change
total remains unchanged
```

After adjustment:

```text
stock changes by delta
movement appears
```

---

# 128. Manual Reconciliation Test

Take the hero product.

Start:

```text
0
```

After receipt:

```text
100
```

After transfer:

```text
100 total
70 source
30 destination
```

After delivery:

```text
80
```

After adjustment:

```text
77
```

Verify database and UI both show:

```text
77
```

---

# 129. Logging

Useful backend logs:

- application startup.
- authentication errors where safe.
- major operation failures.
- transaction exceptions.

Do not log:

- passwords.
- raw JWTs.
- OTP values in production-like logs.
- database credentials.

---

# 130. Frontend Error UX

For 409 business errors, show meaningful messages.

Bad:

```text
Request failed.
```

Better:

```text
Delivery cannot be completed.

Available stock: 20
Requested: 30

Reduce the quantity or replenish stock.
```

For duplicate SKU:

```text
SKU STL-001 already exists.
Choose a unique SKU.
```

---

# 131. Performance Minimum

Do not prematurely optimize, but avoid obvious anti-patterns.

Avoid:

- loading all ledger rows.
- N+1 relation fetching.
- repeated dashboard requests.
- fetching all products for small dropdowns when pagination/search is available.
- unnecessary database calls inside loops.

Use pagination and targeted queries.

---

# 132. Offline / Resilience

The judging requirements mention considering local resilience.

For this hackathon, implement practical resilience rather than an offline inventory database.

Minimum:

- Show connection/API errors clearly.
- Preserve unsaved form input during recoverable failures where practical.
- Prevent duplicate submission.
- Use local seed database for demonstration.
- Keep core inventory logic server-side.

Do not implement full offline conflict synchronization unless the P0 system is already complete.

---

# 133. Deployment / Run Instructions

The project must have a clear README containing:

## Backend

```text
cd backend
mvn spring-boot:run
```

## Frontend

```text
cd frontend
npm install
npm run dev
```

## Database

Document:

- PostgreSQL database name.
- required user.
- required password environment variable.
- schema initialization/migrations.
- seed data.

---

# 134. README Requirements

README must include:

1. Project overview.
2. Features.
3. Architecture.
4. Tech stack.
5. Folder structure.
6. Database setup.
7. Environment variables.
8. Backend startup.
9. Frontend startup.
10. API base URL.
11. Demo credentials if provided.
12. Test command.
13. Git contribution information.
14. Known limitations.

---

# 135. Demo Credentials

If demo credentials are used, create explicit development/demo users.

Example:

```text
Manager:
manager@stocksense.local

Staff:
staff@stocksense.local
```

Never commit real passwords.

Provide safe local setup instructions for demo passwords.

---

# 136. Presentation Story

The presentation should not be:

> “We built a CRUD inventory management system.”

Use this problem framing:

> Inventory becomes unreliable when physical movement and digital records stop matching.

Then:

> StockSense makes every inventory change transaction-driven.

Then:

```text
Receive
→ Transfer
→ Deliver
→ Adjust
→ Audit
```

Then demonstrate that the system keeps:

```text
Stock
Location
Ledger
Dashboard
```

synchronized.

---

# 137. 3–4 Minute Judge Demo

## 0:00–0:20

Login.

Immediately show the dashboard.

Say:

> “This is StockSense, an inventory command center that shows current stock, operational risk, and movement activity.”

## 0:20–0:50

Open Steel Rod.

Show:

```text
0 kg
```

## 0:50–1:20

Create receipt:

```text
+100 kg
```

Validate.

Show stock becomes:

```text
100 kg
```

and ledger entry appears.

## 1:20–1:50

Transfer:

```text
30 kg
Rack A → Production
```

Show:

```text
70 + 30
Total remains 100
```

## 1:50–2:20

Delivery:

```text
-20 kg
```

Show:

```text
80 total
```

## 2:20–2:50

Adjustment:

```text
Physical count = 77
System = 80
Difference = -3
Reason = Damaged
```

Apply.

Show:

```text
77 kg
```

## 2:50–3:20

Open ledger.

Show:

```text
+100 Receipt
Internal Transfer 30
-20 Delivery
-3 Adjustment
```

## 3:20–3:50

Return to dashboard.

Show updated:

- stock.
- risk.
- recent movements.

Close with:

> “StockSense does not just store inventory records. Every validated movement updates the physical-stock model, location state and audit trail together.”

---

# 138. Demo Failure Recovery

If an optional feature breaks:

**Skip it.**

Never let a broken AI/barcode/chart feature stop the core demo.

Core recovery path:

```text
Dashboard
→ Product
→ Operation
→ Validate
→ Ledger
```

Keep the demo data pre-seeded so the demo can proceed even if a non-core service fails.

---

# 139. UI Quality Gate

Before final demo verify:

- Sidebar alignment.
- Header alignment.
- Consistent spacing.
- Consistent font.
- Consistent button sizes.
- Consistent card radius.
- Status colors.
- No broken icons.
- No placeholder copy.
- No dead navigation.
- No console errors where practical.
- No empty API placeholders.
- No accidental debug UI.
- No giant unnecessary charts.
- No mobile overflow.

---

# 140. Security Quality Gate

Before final demo verify:

- Passwords hashed.
- JWT signing key externalized.
- DB credentials externalized.
- CORS restricted.
- Role checks work.
- Staff cannot access protected manager actions.
- Invalid token rejected.
- Expired token handled.
- OTP expiry works.
- OTP attempts limited.
- Raw secrets absent from Git.

---

# 141. Data Integrity Quality Gate

Before final demo verify:

```text
Receipt:
stock + ledger + document state all change together.

Delivery:
stock - ledger + document state all change together.

Transfer:
source - destination + ledger + document state together.

Adjustment:
delta + ledger + document state together.
```

No partial commits.

---

# 142. Scope Cut Order

If the team is running late, cut features in this order:

## First cut

- AI.
- Barcode.
- Advanced analytics.
- Stock aging.
- Supplier analytics.
- Expiry.
- Lot/serial.

## Second cut

- Cycle counts.
- Advanced reorder intelligence.
- Complex approval workflow.

## Never cut

- Product.
- Receipt.
- Delivery.
- Transfer.
- Adjustment.
- Stock.
- Ledger.
- Dashboard.
- Validation.
- Authorization.
- PostgreSQL persistence.
- Demo flow.

---

# 143. Common Failure Modes to Avoid

## Failure 1 — CRUD-only design

Problem:

Screens work independently but stock is not connected.

Fix:

Make transaction services the center.

## Failure 2 — Stock edited directly

Problem:

History becomes unreliable.

Fix:

All stock changes go through validated operations.

## Failure 3 — Static dashboard

Problem:

Judges can see that values do not respond to operations.

Fix:

Dashboard reads PostgreSQL and refreshes after mutation.

## Failure 4 — AI decoration

Problem:

AI answers sound impressive but do not solve inventory control.

Fix:

Use AI only after deterministic inventory logic works.

## Failure 5 — Overcrowded UI

Problem:

Judges cannot understand the main screen.

Fix:

Minimal dashboard hierarchy.

## Failure 6 — One-person Git history

Problem:

Fails collaboration requirement.

Fix:

Meaningful commits from every team member.

## Failure 7 — No server-side validation

Problem:

Frontend can be bypassed.

Fix:

Business rules must be enforced in services.

## Failure 8 — Broken concurrency

Problem:

Two deliveries can consume the same stock.

Fix:

Transactional stock access with appropriate locking/versioning.

## Failure 9 — Fake integrations

Problem:

Buttons only change local state.

Fix:

Every P0 mutation must call real backend APIs.

---

# 144. Code Quality Rules for AI-Assisted Development

AI-generated code may be used, but every team member must understand code they commit.

Before accepting generated code:

1. Read the class.
2. Check business logic.
3. Check security implications.
4. Check error cases.
5. Check database behavior.
6. Run the relevant test.
7. Explain it to another team member if needed.

Do not blindly paste generated implementation.

---

# 145. Code Style

Backend:

- Clear service methods.
- Meaningful variable names.
- Avoid unnecessary abstraction.
- Use immutable DTOs where practical.
- Keep controllers thin.
- Prefer explicit business rules.

Frontend:

- Reusable components.
- Avoid giant single-file pages.
- Keep API calls outside presentation where practical.
- Keep forms predictable.
- Avoid inline duplicated styles.

---

# 146. Suggested Frontend File Structure

```text
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── stock.ts
│   │   ├── receipts.ts
│   │   ├── deliveries.ts
│   │   ├── transfers.ts
│   │   ├── adjustments.ts
│   │   ├── ledger.ts
│   │   ├── dashboard.ts
│   │   └── reorder.ts
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── data-display/
│   │   ├── forms/
│   │   └── navigation/
│   │
│   ├── layouts/
│   │   └── AppLayout.tsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── stock/
│   │   ├── receipts/
│   │   ├── deliveries/
│   │   ├── transfers/
│   │   ├── adjustments/
│   │   ├── ledger/
│   │   ├── risk/
│   │   ├── reorder/
│   │   ├── warehouses/
│   │   └── profile/
│   │
│   ├── hooks/
│   ├── routes/
│   ├── types/
│   ├── utils/
│   └── styles/
```

---

# 147. Suggested Backend File Structure

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/com/stocksense/
│   │   │   ├── config/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   ├── entity/
│   │   │   ├── exception/
│   │   │   ├── mapper/
│   │   │   ├── repository/
│   │   │   ├── security/
│   │   │   ├── service/
│   │   │   └── util/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       └── db/migration/
│   │
│   └── test/
│       └── java/com/stocksense/
```

---

# 148. API Documentation

Document endpoints in:

```text
docs/API.md
```

At minimum:

- method
- path
- auth requirement
- request
- response
- validation
- error cases

Optional if time permits:

- OpenAPI/Swagger

Do not spend hackathon time manually perfecting generated API documentation if it delays core functionality.

---

# 149. Architecture Documentation

Create:

```text
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/API.md
docs/DEMO.md
```

These should be concise and truthful.

---

# 150. Database Documentation

`docs/DATABASE.md` should include:

- entity list
- relationships
- indexes
- stock invariants
- ledger semantics
- transaction behavior

---

# 151. Final Project Tree

The final repository should roughly resemble:

```text
stocksense/
├── backend/
├── frontend/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── DEMO.md
├── .gitignore
├── README.md
└── .env.example
```

Do not commit secrets.

---

# 152. Final Integration Checklist

## Backend

- [ ] Spring Boot starts.
- [ ] PostgreSQL connects.
- [ ] Entities compile.
- [ ] Repositories work.
- [ ] Auth works.
- [ ] JWT works.
- [ ] Refresh works.
- [ ] Roles work.
- [ ] Validation works.
- [ ] Errors are consistent.

## Inventory

- [ ] Products.
- [ ] Categories.
- [ ] Warehouses.
- [ ] Locations.
- [ ] Stock.
- [ ] Receipts.
- [ ] Deliveries.
- [ ] Transfers.
- [ ] Adjustments.
- [ ] Ledger.

## Frontend

- [ ] Login.
- [ ] Sidebar.
- [ ] Dashboard.
- [ ] Products.
- [ ] Product detail.
- [ ] Stock.
- [ ] Receipts.
- [ ] Deliveries.
- [ ] Transfers.
- [ ] Adjustments.
- [ ] Ledger.
- [ ] Filters.
- [ ] Loading states.
- [ ] Error states.
- [ ] Responsive layout.

---

# 153. Final Business Validation

Confirm this exact mathematical story:

```text
Initial = 0

Receipt +100
= 100

Transfer 30
= 100 total
  70 source
  30 destination

Delivery -20
= 80

Adjustment -3
= 77
```

Then confirm:

```text
Dashboard = 77
Product page = 77
Stock overview = 77
Ledger explains how 77 was reached
```

If these values disagree, the application is not ready.

---

# 154. Final Judge Questions the Team Must Be Ready to Answer

## Why did you use StockMove?

Because receipts, deliveries, transfers and adjustments are all stock events that need a unified audit trail.

## How do you prevent incorrect stock?

Validated transactional services update stock and ledger atomically.

## How do internal transfers work?

They decrement source location and increment destination location while leaving total company stock unchanged.

## How do you prevent overselling?

The delivery service checks available stock inside the transaction before decrementing it.

## Why PostgreSQL?

Inventory data needs durable relational transactions, constraints and reporting.

## Why Spring Boot?

The team can implement a structured, secure monolithic REST backend quickly.

## Why React?

The application needs a responsive operational UI with reusable components.

## Why not let AI calculate stock?

Inventory quantity is business-critical; deterministic backend logic must remain the source of truth. AI can explain or recommend based on validated data.

## What makes the system auditable?

Every completed stock-affecting operation produces an attributed movement record.

---

# 155. Final Product Positioning

Do not pitch StockSense as:

> “An app to manage products.”

Pitch it as:

> **A transaction-driven inventory control system that keeps stock, location, operations and audit history synchronized.**

The product has two layers:

## Execution Layer

```text
RECEIVE
TRANSFER
DELIVER
ADJUST
AUDIT
```

## Intelligence Layer

```text
DETECT RISK
REORDER
EXPLAIN
ALERT
ACT
```

The execution layer must be complete before the intelligence layer is expanded.

---

# 156. Final Implementation Rule

At every point during development, ask:

> **Does this change make the core inventory workflow more correct, more understandable, or more demoable?**

If the answer is no, do not spend the limited hackathon time on it.

---

# 157. FINAL SUCCESS CRITERIA

StockSense is considered hackathon-ready only when all of the following are true:

### Functional

- User can authenticate.
- User can create/view products.
- User can see inventory.
- User can receive stock.
- User can transfer stock.
- User can deliver stock.
- User can adjust stock.
- User can view the ledger.
- User can identify low stock.

### Technical

- PostgreSQL is real and persistent.
- API is versioned.
- Business logic is server-side.
- Transactions are atomic.
- Role authorization works.
- Validation works.
- Errors are consistent.

### UX

- Dashboard is minimal.
- Navigation is intuitive.
- UI is responsive.
- Status states are consistent.
- Operations have clear success/error feedback.
- No dead buttons.
- No unnecessary clutter.

### Collaboration

- Every member has meaningful commits.
- API contract is shared.
- Ownership is clear.
- Integration is completed before demo.

### Demo

The following sequence runs without failure:

```text
LOGIN
 ↓
DASHBOARD
 ↓
PRODUCT
 ↓
RECEIVE 100
 ↓
TRANSFER 30
 ↓
DELIVER 20
 ↓
ADJUST -3
 ↓
STOCK = 77
 ↓
LEDGER
 ↓
DASHBOARD UPDATE
```

---

# 158. STOP CONDITION

Do not continue adding features once:

1. The complete demo works.
2. P0 requirements are satisfied.
3. Data is correct.
4. Security is functional.
5. UI is polished.
6. Tests pass.
7. Git history is healthy.

At that point:

**Freeze features.**

Only fix critical issues and rehearse.

---

# 159. Final One-Sentence Architecture Summary

> **StockSense is a Spring Boot + PostgreSQL + React modular monolith in which validated receipts, deliveries, transfers and adjustments atomically update location-aware stock and an immutable movement ledger, while the dashboard and risk/reorder views expose the resulting inventory state.**

---

# 160. Implementation Readiness Gate

Before generating large amounts of source code, the team must be able to answer YES to:

- [ ] Architecture frozen.
- [ ] Entities frozen.
- [ ] Enums frozen.
- [ ] API paths frozen.
- [ ] Error response frozen.
- [ ] Security flow frozen.
- [ ] UI navigation frozen.
- [ ] Team ownership frozen.
- [ ] Demo flow frozen.
- [ ] Seed data prepared.

Only after this gate should implementation proceed at full speed.
