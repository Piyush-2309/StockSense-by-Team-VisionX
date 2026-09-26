# StockSense — Enterprise Inventory Management System (IMS)

> **Tagline:** *"Smarter Inventory. Stronger Business."*  
> **Architecture:** Modern Monorepo (Spring Boot Backend + React TypeScript Frontend)

---

## 📁 Repository Structure

```text
StokeSense-frontend/
├── backend/                       # Spring Boot 3 Java Backend
│   ├── pom.xml                   # Maven dependencies (Java 21, Spring Security, JPA, Flyway)
│   ├── src/main/java/com/stocksense/
│   │   ├── controller/           # REST Controllers (/api/auth, /api/products, /api/stock, etc.)
│   │   ├── service/              # Core business services & inventory operations
│   │   ├── repository/           # Spring Data JPA repositories
│   │   ├── model/                # Entity models (Product, Warehouse, Location, StockMove, etc.)
│   │   ├── dto/                  # Data transfer objects & validation schemas
│   │   └── security/             # JWT authentication & Spring Security filters
│   └── src/main/resources/       # application.yml and Flyway migrations (V1, V2, V3)
│
├── frontend/                      # StockSense React Enterprise Command Center
│   ├── package.json              # React 19, TypeScript, Lucide, Canvas Confetti
│   ├── vite.config.ts            # Vite build configuration (Port 5173)
│   ├── index.html                # App entrypoint with Google Fonts (Inter, Plus Jakarta Sans)
│   ├── public/                   # Favicon & assets
│   └── src/
│       ├── components/           # Sidebar, Topbar, SearchModal, GoldenDemoWidget, StockSenseAiDrawer, Toast
│       ├── views/                # All 15 operational views (Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, Ledger, etc.)
│       ├── services/             # Authoritative double-entry inventory engine & centralized REST API client
│       ├── data/                 # Initial dataset matching reference ERP parameters
│       ├── types/                # Complete TypeScript domain interfaces
│       ├── index.css             # Enterprise design tokens, HSL palette, and layout system
│       └── App.tsx               # Reactive application shell & navigation router
│
├── StockSense_Master_Implementation_Plan.md  # Detailed architecture & technical specs
├── LICENSE
└── README.md
```

---

## 🚀 Running the Project

### Running the Frontend

From the repository root:
```bash
npm run dev
```
*(Or navigate into `cd frontend && npm run dev`)*

The frontend command center will launch at:  
👉 **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**

To verify the production build:
```bash
npm run build
```

---

### Running the Backend

From the repository root:
```bash
npm run backend:run
```
*(Or navigate into `cd backend && ./mvnw spring-boot:run`)*

The Spring Boot REST API runs at:  
👉 **`http://localhost:8080/api`**

---

## ⭐ Interactive Hackathon Golden Demo

The frontend includes a built-in **Golden Demo Guide** widget in the topbar that proves end-to-end transactional integrity for judges:

1. **Step 1:** Inbound Receipt (+100 kg Steel Rod) $\to$ On-hand jumps from 0 to 100 kg.
2. **Step 2:** Internal Transfer (30 kg) from Main Store Rack A to Production Rack P1 $\to$ Total stock unchanged at 100 kg.
3. **Step 3:** Customer Delivery (20 kg) $\to$ Stock decrements to 80 kg.
4. **Step 4:** Physical Count & Adjustment (-3 kg) $\to$ Stock reconciles to 77 kg.
5. **Step 5:** Stock Ledger Inspection $\to$ All 4 signed movements logged in the immutable audit trail.
