# 🍲 Kind Table

> **"Good food, shared in time."**

Kind Table is the responsive, accessible, full-stack web edition of our Java capstone project **FoodBridge (Group 76, SDG 2: Zero Hunger)**. It connects food donors (restaurants, hostels, event caterers, and canteens) with local NGOs and volunteers before surplus food spoils, while providing administrators with a permanent tamper-evident audit record and guarantees safe atomic claims.

---

## 🌟 The Three Core Guarantees

1. **Safe Simultaneous Claims (T1 & T8):** When 50 NGOs claim the same surplus batch at the exact same millisecond, exactly one wins and the rest are told immediately and politely. Zero duplicate claims can ever occur.
2. **Permanent Activity Record (T4):** Every donation, claim, and automatic expiry is permanently logged with an exact ISO timestamp down to the second.
3. **Instant Live Alerts (T5):** When a donor lists food, connected NGOs receive real-time notifications via WebSocket in under 50ms without needing to refresh the page.

---

## 🚀 Quick Start (One Command to Start Everything)

### 1. Prerequisites
- **Node.js** v20+ or v24+ (uses built-in SQLite engine)
- **npm** v9+

### 2. Install Dependencies
```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 3. Start Development Server
```bash
npm run dev
```
This runs both the backend server (on `http://localhost:4000`) and the Vite client (on `http://localhost:5173`) concurrently.

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Acceptance Tests

All acceptance tests from Section 7 of the report are automated:

### Run Concurrency Test (T1: 50 simultaneous claim requests)
```bash
npm run test:concurrency
```
**Result:** Exactly 1 claim succeeds (HTTP 200), 49 receive the calm "already claimed" response (HTTP 409), and database verifies 0 duplicate claims.

### Run Full Test Suite (T1 through T9)
```bash
npm run test:all
```

| ID | Scenario | Result | Evidence |
|----|----------|--------|----------|
| **T1** | 50 simultaneous claim requests on one batch | **PASS** | Exactly 1 HTTP 200, 49 HTTP 409, 0 duplicate claims |
| **T2** | Donation with 0 or negative portions | **PASS** | Rejected with HTTP 400 and friendly message ("Please enter at least 1 portion...") |
| **T3** | Donation with expiry in the past | **PASS** | Rejected with HTTP 400 and friendly message ("That time has already passed...") |
| **T4** | Any donation, claim or expiry | **PASS** | Present in permanent activity log with ISO timestamp |
| **T5** | Donor lists food while NGO page is open | **PASS** | NGO page receives WebSocket `BATCH_CREATED` alert without page refresh |
| **T6** | Download backup, change data, restore backup | **PASS** | State returns exactly to earlier snapshot |
| **T7** | Submit Donor form | **PASS** | Batch appears immediately in NGO available board |
| **T8** | Two simultaneous claims on one batch | **PASS** | 1 wins, other receives calm friendly message |
| **T9** | Batch passes expiry time | **PASS** | Background worker marks batch 'Expired' and removes from NGO board |

---

## 🏗️ Architecture

```
kindtable/
├── client/                     # Front-end (React + Vite + TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, Footer, InfoPopover, StatusChip, GuidedTour)
│   │   ├── context/            # LiveAlertsContext (WebSocket sync), ThemeContext (Light/Dark)
│   │   ├── pages/
│   │   │   ├── HomePage.tsx        # Hero, 3-step strip, live counter, 3 guarantees, SDG 2 info
│   │   │   ├── DonorPage.tsx       # "Share food" form with live preview card & my donations
│   │   │   ├── NgoPage.tsx         # "Find food" live urgency grid & atomic claim action
│   │   │   ├── AdminPage.tsx       # Summary metrics, all batches table, activity log, backup/restore
│   │   │   └── HowItWorksPage.tsx  # Walkthrough + interactive 2-hands-1-plate claim simulation
│   │   └── types.ts            # FoodBatch, AuditLog, Category types
├── server/                     # Back-end (Node.js + Express + WebSocket + SQLite)
│   ├── src/
│   │   ├── domain/
│   │   │   └── rules.js        # Business rules, validation, friendly error translations
│   │   ├── db/
│   │   │   └── database.js     # Synchronous SQLite transactions, atomic claims, audit logging
│   │   ├── services/
│   │   │   └── websocket.js    # Sub-50ms live alert broadcaster
│   │   ├── jobs/
│   │   │   └── expiryJob.js    # Non-blocking periodic background expiry cleanup
│   │   ├── routes/
│   │   │   └── api.js          # REST endpoints for batches, claims, stats, logs, backups
│   │   └── index.js            # Express app + HTTP server + WebSocket entry point
├── scripts/
│   ├── test-concurrency.mjs    # Concurrency test script (T1)
│   └── test-acceptance.mjs     # Complete acceptance test suite (T1 - T9)
└── package.json                # Root package with one-command scripts
```

---

## 🎨 Design & Usability Highlights

- **14-Year-Old Readability:** Written in simple, human English. No technical jargon or stack traces.
- **Icon Cards for Categories:** 5 fixed options (Cooked meal, Bakery, Fruit and vegetables, Packaged food, Dairy) displayed as accessible visual cards.
- **Color-Coded Freshness Countdown:**
  - 🟢 **Green:** $> 2\text{ hours}$
  - 🟡 **Amber:** $30\text{ min} - 2\text{ hours}$
  - 🔴 **Red:** $< 30\text{ min}$ (Urgent rescue needed)
- **Guided Tours:** Skippable 3-step tour on Donor, NGO, and Admin pages stored in localStorage.
- **"What is this?" Popovers:** Every section has an `(i)` button explaining its purpose in 2 plain sentences.
- **Mobile Responsive:** Works seamlessly down to 360px viewport width with keyboard accessibility.
- **Light & Dark Mode:** Community warm palette (cream `#FDFBF7`, deep green `#1B4332`, amber `#D97706`, terracotta `#C84B31`).

---

## 📋 Out of Scope / Future Improvements

As specified by the project guidelines:
- **Authentication & Roles:** Roles are currently chosen by navigating to the respective page (Donor, NGO, Admin). Future editions will add multi-factor authentication.
- **Payments & Delivery Routing:** Out of scope. Kind Table focuses entirely on food rescue matching and collection.
- **Native Mobile Apps:** Out of scope. The web application is mobile-first and responsive on all mobile viewports.
