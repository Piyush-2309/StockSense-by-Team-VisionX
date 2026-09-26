# StockSense — Enterprise Inventory Management System (IMS)

> **Tagline:** *"Smarter Inventory. Stronger Business."*  
> **Architecture:** Fully Integrated Full-Stack Monorepo (Spring Boot 3 + React 19 + TypeScript + Hybrid PostgreSQL/H2)

---

## 📁 Repository Structure

```text
StokeSense-frontend/
├── backend/                       # Spring Boot 3 Java 21 Backend
│   ├── pom.xml                   # Maven dependencies (Java 21, Spring Security, JPA, Flyway, H2/PostgreSQL)
│   ├── src/main/java/com/stocksense/
│   │   ├── controller/           # REST Controllers (/api/v1/auth, /api/v1/products, /api/v1/stock, /api/v1/receipts, /api/v1/transfers, /api/v1/deliveries, /api/v1/adjustments, /api/v1/search, /api/v1/dashboard, etc.)
│   │   ├── service/              # Core transactional business services & atomic inventory engine
│   │   ├── repository/           # Spring Data JPA repositories with optimistic locking
│   │   ├── model/                # Entity models (Product, Warehouse, Location, StockQuant, StockMove, Document, etc.)
│   │   ├── dto/                  # Data transfer objects & validation schemas
│   │   ├── config/               # SecurityFilterChain, DataInitializer demo seeder, CORS & OpenAPI config
│   │   └── security/             # JWT authentication, refresh token rotation & Spring Security filters
│   └── src/main/resources/       # application.yml and Flyway migrations (V1, V2, V3)
│
├── frontend/                      # StockSense React Enterprise Command Center
│   ├── package.json              # React 19, TypeScript, Lucide, Canvas Confetti
│   ├── vite.config.ts            # Vite dev proxy configuration (/api -> http://localhost:8080)
│   ├── index.html                # App entrypoint with Google Fonts (Inter, Plus Jakarta Sans)
│   ├── public/                   # Favicon & assets
│   └── src/
│       ├── context/              # Central AuthContext providing reactive session restoration & RBAC
│       ├── components/           # Sidebar, Topbar, SearchModal, GoldenDemoWidget, StockSenseAiDrawer, Toast
│       ├── views/                # All 15 operational views (Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, Ledger, etc.)
│       ├── services/
│       │   ├── apiClient.ts      # Centralized HTTP client with automatic JWT token refresh & retry queue
│       │   ├── backendApi.ts     # Typed service layer connecting to all Spring Boot REST endpoints
│       │   └── inventoryEngine.ts # Double-entry state engine automatically synchronized with backend database
│       ├── types/                # Shared TypeScript domain interfaces
│       ├── index.css             # Enterprise design tokens, HSL palette, and layout system
│       └── App.tsx               # Reactive application shell, auth gatekeeper & navigation router
│
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Inventory Manager** | `manager@stocksense.com` | `Password123` | Full access, product creation, receipt/delivery/transfer validation, inventory reconciliation & rules |
| **Warehouse Staff** | `staff@stocksense.com` | `Password123` | Stock movements, warehouse picking, physical count verification, shelving & transfers |

Quick-fill demo buttons are provided on the login page for rapid judge evaluation.

---

## 🚀 Running the Application

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **Java JDK** (21+)

### 2. Start the Backend Server
From the project root:
```bash
npm run backend:run
```
*(Or inside `cd backend && .\mvnw.cmd spring-boot:run`)*

The Spring Boot backend will start on:  
👉 **`http://localhost:8080/`** (Swagger docs available at `http://localhost:8080/swagger-ui.html`)

> **Note:** The backend automatically boots with an embedded, file-persisted H2 engine in PostgreSQL compatibility mode with complete seed data. If an external PostgreSQL instance is provided via `DB_URL` in `.env`, it will automatically connect to PostgreSQL.

### 3. Start the Frontend Application
In a separate terminal, from the project root:
```bash
npm run dev
```
*(Or inside `cd frontend && npm run dev`)*

The frontend command center will launch at:  
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🛡️ Authentication & Security Contract

1. **JWT Access & Refresh Rotation**:
   - `POST /api/v1/auth/login`: Authenticates user, issues short-lived JWT access token and secure refresh token.
   - `GET /api/v1/auth/me`: Validates session on application startup and loads authenticated profile.
   - `POST /api/v1/auth/refresh`: Seamlessly refreshes expired access tokens in the background without user interruption.
   - `POST /api/v1/auth/logout`: Revokes the refresh token and clears active session.
2. **Atomic Inventory Transactions**:
   - All receipts, deliveries, internal transfers, and adjustments are executed inside atomic `@Transactional` database boundaries.
   - Stock quantities cannot go negative (`INSUFFICIENT_STOCK` business exception enforced).
   - Every inventory change generates an immutable entry in the `stock_moves` ledger table.

---

## ⭐ Interactive Hackathon Golden Demo

The frontend includes a built-in **Golden Demo Guide** widget in the topbar that proves end-to-end transactional integrity:

1. **Step 1:** Inbound Receipt (+100 kg Steel Rod) $\to$ On-hand stock jumps from 0 to 100 kg.
2. **Step 2:** Internal Transfer (30 kg) from Main Store Rack A to Production Rack P1 $\to$ Total stock remains unchanged at 100 kg.
3. **Step 3:** Customer Delivery (20 kg) $\to$ Available stock safely decrements to 80 kg.
4. **Step 4:** Physical Count & Adjustment (-3 kg) $\to$ Discrepancy reconciled to exactly 77 kg.
5. **Step 5:** Stock Ledger Inspection $\to$ All 4 signed movements logged in the immutable audit trail.
