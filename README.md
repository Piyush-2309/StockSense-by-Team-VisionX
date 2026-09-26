# StockSense — Enterprise Inventory Management System (IMS)

> **Tagline:** *"Smarter Inventory. Stronger Business."*  
> **Status:** Production-Ready Modular Web Application

---

## 📌 Executive Summary

**StockSense** digitizes and streamlines end-to-end stock and warehouse operations within a business. It completely replaces manual paper registers, fragile Excel spreadsheets, and fragmented tracking methods with a centralized, real-time, double-entry inventory command center.

---

## 🎯 Target Users & Role-Based Access Control (RBAC)

1. **Inventory Managers:** Supervise warehouse capacity, monitor low/out-of-stock risk alerts, approve vendor receipts, validate outgoing customer dispatches, and manage reordering thresholds.
2. **Warehouse Staff:** Execute physical picking, packing, internal bay-to-bay transfers, and periodic cycle counts.
3. **Administrators:** Configure multi-warehouse locations, product categories, and system permissions.

---

## 📋 Problem Statement & Compliance Matrix

| Requirement from Problem Statement | StockSense Implementation | Status |
|---|---|:---:|
| **Authentication Flow** | Email/Password login, Sign up, and **6-Digit OTP-based password reset** with countdown timer and instant session restore (`/login`, `/verify-otp`). | ✅ Complete |
| **Dashboard Landing View** | Real-time snapshot with **5 KPI Cards**: Total Products in Stock (4,820 units), Low Stock & Out of Stock counters, Pending Receipts, Pending Transfers, and Pending Deliveries. | ✅ Complete |
| **Inventory Risk Center** | Direct visual alerts for exhausted/below-minimum SKUs with 1-click `Reorder` & `Recommend` triggers. | ✅ Complete |
| **Stock by Location Donut** | Interactive distribution breakdown across Main Warehouse, Production, Warehouse 2, and transit docks. | ✅ Complete |
| **Dynamic Multi-Filters** | Live filtering across document types (Receipt, Delivery, Transfer, Adjustment), status (`Draft`, `Ready`, `Done`), warehouse, location, and category. | ✅ Complete |
| **Product Management** | Full CRUD for catalog items including Product Name, unique SKU code, Category, Unit of Measure (kg, roll, pcs, box, m), and initial stock allocation (`/products`). | ✅ Complete |
| **Product Details & Stock Availability** | Detailed SKU command view showing on-hand, available-to-promise, and reserved units per rack, with an audit timeline (`/products/:id`). | ✅ Complete |
| **Receipts (Incoming Goods)** | Vendor inbound shipments with state machine (`Draft` → `Ready` → `Done`). Validation atomically updates quants, logs ledger movements, and updates dashboard (`/receipts`). | ✅ Complete |
| **Delivery Orders (Outgoing Goods)** | Customer dispatch workflows with visual stepper (`Picked` → `Packed` → `Ready` → `Done`). Prominently verifies available stock and strictly prevents negative inventory (`/deliveries`). | ✅ Complete |
| **Internal Transfers** | Relocate inventory between warehouses and racks (`Main Warehouse / Rack A` → `Production / Rack P1`). Total product stock remains unchanged while location balances update atomically (`/transfers`). | ✅ Complete |
| **Stock Adjustments** | Reconciliation equation: $\text{System Qty} \to \text{Physical Count} = \text{Audited Variance}$. Supports damage/scrap reason codes (`/adjustments`). | ✅ Complete |
| **Move History (Stock Ledger)** | Complete, immutable, double-entry audit trail tracking every single movement reference, timestamp, user, signed quantity ($\pm$), and locations (`/ledger`). | ✅ Complete |
| **Cycle Counts** | Periodic floor auditing workflows (`Pending` → `Counting` → `Review` → `Completed`) with automated reconciliation (`/cycle-counts`). | ✅ Complete |
| **Multi-Warehouse Configuration** | Manage multiple facilities, aisle racks, bins, and parent-child location hierarchies (`/warehouses`, `/locations`). | ✅ Complete |
| **Product Categories & Reordering Rules** | Category management and automated min/max safety buffer triggers (`/categories`, `/reordering-rules`, `/reorder`). | ✅ Complete |
| **Universal Global Search** | Keyboard shortcut `Ctrl + K` instant lookup searching across products, SKUs, receipts, deliveries, transfers, and ledger references. | ✅ Complete |
| **Ask StockSense AI** | Grounded natural language intelligence assistant answering supply chain questions from *real* database state without hallucinations. | ✅ Complete |

---

## 🔄 Verified Inventory Flow (Golden Demo Scenario)

StockSense natively supports the canonical inventory flow both through manual user actions and via the 1-click **Golden Demo Guide** widget:

```text
START: Steel Rod (STL-001) at initial zero/baseline state
  │
  ├─► Step 1: Receive Goods from Vendor
  │    • Inbound receipt from ABC Metals: +100 kg
  │    • Total Steel Rod Stock: 100 kg (Main Warehouse / Rack A)
  │
  ├─► Step 2: Internal Transfer to Production
  │    • Transfer 30 kg: Main Store Rack A → Production Rack P1
  │    • Rack A = 70 kg, Production P1 = 30 kg (Total = 100 kg, Unchanged)
  │
  ├─► Step 3: Deliver Finished Goods
  │    • Dispatch 20 kg to customer Apex Manufacturing
  │    • Total Steel Rod Stock: 80 kg
  │
  ├─► Step 4: Adjust Damaged Items
  │    • Floor audit reveals 77 kg (3 kg damaged scrap)
  │    • Variance of -3 kg applied; Final Stock = 77 kg
  │
  └─► Step 5: Immutable Audit Ledger Verification
       • All 4 transactions (+100, -30, -20, -3) verified in Stock Ledger
       • Dashboard KPIs, Risk Center, and location breakdown reflect 77 kg in real-time
```

---

## 🛠 Tech Stack & Architecture

- **Frontend Core:** React 19 + TypeScript + Vite
- **Styling:** Custom Enterprise CSS Design System (`src/index.css`) with curated HSL design tokens, Inter & Plus Jakarta Sans typography, rounded cards (14px), and micro-animations.
- **Iconography:** Lucide React Line Icons
- **Database Engine:** Authoritative in-memory & local-storage persisted double-entry transactional engine (`src/services/inventoryEngine.ts`) conforming to Odoo / ERP design principles.
- **API Client:** Centralized REST client abstraction (`src/services/api.ts`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your web browser.

### 3. Production Build & Typecheck
```bash
npm run build
```
Generates an optimized bundle with 0 TypeScript/lint errors.
