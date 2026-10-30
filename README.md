# SitePulse — Executive Construction Progress & Bottleneck Tracker

[![Node.js CI](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](package.json)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-336791.svg)](https://www.postgresql.org/)
[![Tests: 37 Passing](https://img.shields.io/badge/Tests-37%20Passed-brightgreen.svg)](backend/tests/)

> **SitePulse** is an executive-grade construction progress tracker and predictive analytics engine built for commercial and retail fitout programs. It transforms fragmented site data into real-time health indicators, automated trade bottleneck identification, velocity-based delay forecasts, and data-driven manpower interventions.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Definition](#problem-definition)
3. [Proposed Solution](#proposed-solution)
4. [User Stories](#user-stories)
5. [Customer Goals](#customer-goals)
6. [Features & Implemented Functionality](#features--implemented-functionality)
7. [Technology Stack & Architecture](#technology-stack--architecture)
8. [Execution Plan](#execution-plan)
9. [Rollout & Deployment Plan](#rollout--deployment-plan)
10. [Installation & Local Setup](#installation--local-setup)
11. [Project Structure](#project-structure)
12. [Future Improvements](#future-improvements)
13. [Contributing & License](#contributing--license)

---

## Project Overview

In multi-site commercial retail fitouts—such as restaurant rollouts, specialty retail chains, and franchise expansions—opening dates are non-negotiable business milestones. Delays directly result in idle retail lease expenditure, postponed revenue generation, and vendor cost overruns.

**SitePulse** provides fitout executives, program directors, and site supervisors with a single pane of glass to:
- Monitor planned versus actual completion across all active sites and individual trades (Civil, Electrical, Lighting, Carpentry, Painting).
- Automatically pinpoint the single critical trade causing delivery friction (the bottleneck).
- Accurately project completion dates using empirical run-rate velocity calculations rather than optimistic subjective estimates.
- Prescribe immediate, root-cause-specific corrective interventions (e.g., exact extra workforce counts for labour deficits vs. logistics expediting for supply disruptions).
- Capture daily on-site trade headcounts and percentage completions through a lightweight update modal with strict role-based access control.

---

## Problem Definition

### The Commercial Fitout Reality
Retail and commercial interior fitouts are high-velocity, multi-trade projects operating on compressed timelines (typically 30–60 days). Five core specialized trades execute concurrently in confined spaces: Civil, Electrical, Lighting, Carpentry, and Painting.

### Existing Challenges & Pain Points
1. **Fragmented & Stale Communication:** Site engineers traditionally report progress via disconnected WhatsApp messages, end-of-day phone calls, or unstandardized spreadsheets. Executives receive status reports 24 to 72 hours late.
2. **Hidden Critical Path Dependencies:** A delay in Electrical or Civil conduit work silently stalls Carpentry and Painting. Without trade-level visibility, managers only discover delays when milestones are already missed.
3. **Subjective Completion Estimations:** Site reports routinely show "90% complete" for weeks due to optimism bias, masking severe completion lag until the scheduled handover date.
4. **Blunt-Force Mitigation Mistakes:** When a site slips behind schedule, management often reflexively floods the site with generic labor. However, if the bottleneck is caused by a missing switchgear delivery (Material Delay) or inspection hold (Quality Rework), adding manpower increases site congestion and costs without advancing the timeline.
5. **Lack of Cross-Portfolio Prioritization:** Leadership teams managing 10 to 50 concurrent store fitouts across multiple metropolitan areas lack a standardized mechanism to immediately know which project presents the highest commercial risk today.

### Why Solving This Matters
Every single day a commercial store opening is delayed incurs substantial real costs: contractual delay penalties, idle store lease liabilities, missed sales seasons, and brand reputation impairment. Early detection of a 3-day trade slippage enables corrective intervention at nominal cost, preventing compounding delays that can derail an entire commercial launch.

---

## Proposed Solution

SitePulse solves these operational hurdles through a streamlined executive dashboard powered by a deterministic analytics engine and a centralized PostgreSQL/Express backend.

### Core Value Proposition
- **Objective Run-Rate Velocity:** Calculates empirical daily progress rates ($V = \frac{\text{Actual \%}}{\text{Days Elapsed}}$) to forecast project completion mathematically rather than subjectively.
- **Root-Cause Aware Recommendations:** Categorizes delay reasons (`Labour Shortage`, `Material Delay`, `Waiting on Another Trade`, `Quality Rework`, `Weather / Site Access`) and only recommends workforce additions when labor availability is the genuine constraint.
- **Exact Manpower Sizing:** Computes the exact number of additional skilled tradespeople required to recover the contractual deadline based on current productivity metrics.
- **Enterprise Portfolio Risk Matrix:** Sorts all active enterprise sites dynamically by delay days descending, trade gap severity, and urgency flags so executives can allocate supervision and resources to the sites that need it most.
- **Multi-Tenant Security & Role-Based Control:** Enforces strict tenant data isolation by organization ID and role permissions (`admin`, `site_engineer`, `viewer`) backed by Supabase Auth UUID integration.

---

## User Stories

### 1. Executive Fitout Manager / Director
- **As an** Executive Fitout Director,
- **I want** a portfolio-wide risk table that immediately highlights sites projected to miss their contractual opening dates,
- **So that** I can focus executive attention and supply chain intervention on the most critical stores first.

### 2. Project Manager
- **As a** Fitout Project Manager,
- **I want** to see overall planned versus actual percentage progress and schedule variance alongside days remaining,
- **So that** I can detect trade slippage weeks before the scheduled handover.

### 3. Site Engineer / Supervisor
- **As an** On-Site Project Engineer,
- **I want** an intuitive modal to log daily trade progress percentages, actual workers present, and specific delay reasons,
- **So that** I can update project records within two minutes from my laptop or mobile browser without maintaining spreadsheet reports.

### 4. Commercial Client / Retail Brand Viewer
- **As a** Retail Brand Stakeholder,
- **I want** read-only visibility into store readiness and milestone projections,
- **So that** I can coordinate store staffing, merchandise stock shipments, and marketing launch campaigns with confidence.

---

## Customer Goals

| Customer Need | Measurable Success Indicator | Associated Feature |
| :--- | :--- | :--- |
| **Prevent Opening Delays** | 0 unforecasted handover delays; $\ge 95\%$ of stores open on contractual schedule | Empirical Completion Forecasting (`calculateProjectedCompletion`) |
| **Eliminate Communication Lag** | Site progress logged within 1 hour of shift completion; 0-day executive reporting lag | Daily Site Update Modal with UPSERT persistence |
| **Optimize Labor Allocation** | Avoid premature or redundant contractor spend on supply-constrained sites | Smart Action & Manpower Recommendation Engine |
| **Ensure Enterprise Data Privacy** | 0 cross-organization data leakage incidents | Organization-scoped database queries & Supabase Auth |
| **Immediate User Adoption** | Zero training required; clean interface accessible in dark and light environments | High-contrast Glassmorphism UI with Dark/Light theme toggle |

---

## Features & Implemented Functionality

SitePulse consists of a fully functioning frontend client integrated with an Express REST API backend and dual-mode database layer (PostgreSQL with zero-dependency in-memory fallback).

### 1. Active Store Selector & Overview Cards
- **Multi-Store Navigation:** Switch between active sites via desktop pill tabs or mobile-friendly dropdown (e.g., *Biryani Blues - Gurugram*, *Cafe Chai Point - Delhi*, *P.TAL Homeware - Hyderabad*).
- **Core KPIs:** Real-time computation and display of:
  - **Overall Actual Progress:** Weighted trade average percentage.
  - **Overall Planned Progress:** Baseline contractual target percentage.
  - **Schedule Variance:** $+/-$ percentage point lead/lag.
  - **Timeline Tracker:** Calendar start date, contractual deadline, total project duration, days elapsed, and days remaining with visual timeline progress bar.
  - **Health Badge:** Categorized dynamically as `On Track`, `Attention Needed`, or `Behind Schedule`.

### 2. Granular Trade Breakdown Matrix
- Complete breakdown across all 5 fitout disciplines: **Civil**, **Electrical**, **Lighting**, **Carpentry**, and **Painting**.
- Visual dual progress bars showing Planned vs. Actual progress side-by-side.
- Manpower ratio indicator displaying `Workers Present / Workers Required`.
- Contextual delay reason badges with color-coded warning indicators.

### 3. Automated Bottleneck Detection & Forecasting Engine
- **Deterministic Bottleneck Detection:** Scans all trades to identify the single trade with the largest progress deficit:
  $$\text{Gap} = \text{Planned \%} - \text{Actual \%} \quad (\text{where } \text{Gap} > 0)$$
- **Projected Completion Date:** Estimates completion using linear run-rate velocity:
  $$\text{Daily Velocity} = \frac{\text{Actual Progress \%}}{\text{Days Elapsed}}$$
  $$\text{Remaining Days} = \frac{100\% - \text{Actual Progress \%}}{\text{Daily Velocity}}$$
  $$\text{Projected Date} = \text{Today} + \text{Remaining Days}$$
- **Delay Calculation:** Computes projected delay days against the contractual deadline:
  $$\text{Delay Days} = \text{Projected Completion Date} - \text{Contractual Deadline}$$

### 4. Smart Root-Cause Action & Manpower Sizing
- **Labour Deficits (`Labour Shortage` / `Waiting on Another Trade`):** Evaluates daily productivity per worker to compute the exact additional headcount required to hit the deadline:
  $$\text{Productivity per Worker} = \frac{\text{Actual \%}}{\text{Days Elapsed} \times \text{Workers Present}}$$
  $$\text{Required Daily Progress} = \frac{100\% - \text{Actual \%}}{\text{Days Left to Deadline}}$$
  $$\text{Required Workers} = \left\lceil \frac{\text{Required Daily Progress}}{\text{Productivity per Worker}} \right\rceil$$
  $$\text{Extra Workers Needed} = \max(0, \, \text{Required Workers} - \text{Workers Present})$$
- **Non-Manpower Bottlenecks:**
  - *Material Delay:* "Recommended action: Expedite material delivery. Additional manpower is unlikely to resolve the current constraint."
  - *Quality / Rework:* "Recommended action: Resolve rework / quality issue before increasing manpower."
  - *Site Access / Weather:* "Recommended action: Resolve site access / weather constraint."

### 5. Executive Portfolio Risk Table
- Cross-project risk matrix always accessible at the bottom of the dashboard.
- Sorted dynamically by:
  1. Projected Delay Days (descending)
  2. Bottleneck Gap (descending)
  3. Original Project Order (deterministic stability)
- Flags projects with `needsUrgentManpower` when delay exceeds 3 days.

### 6. Role-Based Daily Site Update Modal
- Modal interface accessible to `admin`, `manager`, and `site_engineer` roles.
- Allows recording:
  - Progress percentage ($0\% - 100\%$)
  - Headcount present and headcount required
  - Reason code (`On Track`, `Material Delay`, `Labour Shortage`, `Waiting on Another Trade`, `Quality Rework`, `Weather Access`)
  - Free-form engineer site notes
- Validation safeguards preventing future dates, negative headcounts, or out-of-range progress values.
- Atomic SQL `UPSERT` (`ON CONFLICT (trade_id, date) DO UPDATE`) to ensure idempotent daily logs.

### 7. Modern UI & Glassmorphism Design System
- Sleek dark theme default with instant light theme toggle (persisted in `localStorage`).
- Responsive typography using **Outfit** (display headings) and **Plus Jakarta Sans** (interface text).
- Real-time navigation header clock.
- Smooth CSS animations, glassmorphism card surfaces, and accessible focus states.

---

## Technology Stack & Architecture

### High-Level Architecture Diagram

```
+-----------------------------------------------------------------------+
|                            Web Browser                                |
|  - index.html (Responsive Semantic HTML5 + Glassmorphism UI)          |
|  - style.css (Vanilla CSS Design System + Dark/Light Theme Tokens)    |
|  - script.js (Single-State UI Controller & Dynamic DOM Renderers)     |
|  - js/auth.js (Supabase Auth Client + Dev Mock Token Session)         |
|  - js/api.js (Centralized REST API HTTP Client)                       |
+-----------------------------------+-----------------------------------+
                                    |
                                    | HTTP / JSON (Bearer Token)
                                    v
+-----------------------------------+-----------------------------------+
|                     Express.js Backend API                            |
|                                                                       |
|  [Middleware Pipeline]                                                |
|   - CORS Validation (Environment-aware, strict production origin)     |
|   - Express JSON Body Parser                                          |
|   - Supabase Auth Middleware (Bearer Token -> Immutable UUID Lookup)  |
|   - RBAC Middleware (admin, manager, site_engineer, viewer)           |
|   - Centralized Error Handler (Standardized JSON error responses)     |
|                                                                       |
|  [API Routes]                                                         |
|   - GET  /                                (Root API status)           |
|   - GET  /health                          (Health check)              |
|   - GET  /me                              (User & Organization info)  |
|   - GET  /portfolio                       (Risk-sorted store matrix)  |
|   - GET  /projects/:id/dashboard          (Single project analytics)  |
|   - POST /projects/:id/updates            (UPSERT daily trade update) |
|                                                                       |
|  [Core Services & Pure Analytics Engine]                              |
|   - projectService.js / updateService.js / userService.js             |
|   - analytics/index.js (Deterministic Pure Math: Zero DOM / Zero DB)  |
+-----------------------------------+-----------------------------------+
                                    |
                                    | pg Pool / SQL Queries
                                    v
+-----------------------------------+-----------------------------------+
|                         Data Storage Tier                             |
|                                                                       |
|  Mode A (Configured): PostgreSQL 15+ / Supabase                       |
|   - Normalized Schema: organizations, users, projects, trades, updates|
|   - Migration Tooling: node-pg-migrate                                |
|                                                                       |
|  Mode B (Zero-Config Fallback): In-Memory Store                       |
|   - Complete mock repository mirror for offline dev & test execution  |
+-----------------------------------------------------------------------+
```

### Technology Breakdown

| Tier | Technology / Library | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend Core** | HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 | Ultra-fast load times, zero build-step overhead, and full browser portability |
| **Design & Typography** | Google Fonts (Outfit & Plus Jakarta Sans), FontAwesome 6 | Professional executive aesthetic and clear information hierarchy |
| **Backend Framework** | Node.js (>=20), Express 4.21.2 | Lightweight, high-throughput asynchronous RESTful API server |
| **Authentication** | `@supabase/supabase-js` (2.49.1) | JWT verification, immutable Auth UUID mapping, secure password hashing |
| **Database & Migrations**| PostgreSQL (`pg` 8.13.3), `node-pg-migrate` (9.0.0) | Relational integrity, foreign key cascades, and predictable schema evolution |
| **Environment Config** | `dotenv` (16.4.7) | Twelve-factor application configuration management |
| **Testing** | Node.js Built-in Test Runner (`node:test`, `node:assert/strict`) | Fast native test execution with zero external test runner dependencies |

---

## Execution Plan

The development and deployment of SitePulse follows an iterative phased model:

```
[Phase 1: Domain Modeling & Prototype] -> COMPLETED
       |
[Phase 2: Pure Analytics Engine & Math Verification] -> COMPLETED
       |
[Phase 3: Database Schema, Migrations & In-Memory Store] -> COMPLETED
       |
[Phase 4: Express REST API & Enterprise Middleware] -> COMPLETED
       |
[Phase 5: Auth & Role-Based Security Enforcement] -> COMPLETED
       |
[Phase 6: Frontend Client Integration & Glassmorphism UI] -> COMPLETED
       |
[Phase 7: Comprehensive Automated Test Suite (37 Tests)] -> COMPLETED
       |
[Phase 8: Production Staging & Pilot Deployment] -> PLANNED NEXT STEP
```

### Completed Work
- [x] **Relational Schema Definition:** Normalized tables (`organizations`, `users`, `projects`, `trades`, `daily_updates`) with indexes and check constraints.
- [x] **Analytics Engine Extraction:** Decoupled calculation logic (`calculateProjectMetrics`, `getProjectBottleneck`, `calculateProjectedCompletion`, `getRecommendation`, `calculatePortfolioRisk`) into a standalone, testable module with zero DOM dependencies.
- [x] **Dual Database Architecture:** Built database client with seamless failover between live PostgreSQL and an in-memory repository for rapid testing and standalone demonstration.
- [x] **RESTful API Endpoints:** Implemented authenticated endpoints with organization-level scoping and role authorization.
- [x] **Frontend Refactor:** Bound dynamic DOM rendering to live backend endpoints with offline-friendly fallback and mock session switching.
- [x] **Comprehensive Test Coverage:** 37 automated tests verifying calculations, baseline regressions, API security, CORS rules, and input edge cases.

### Planned Work
- [ ] Automated daily email/SMS summary digests sent to retail brand project directors.
- [ ] Exportable executive PDF and Excel milestone reports for steering committee meetings.
- [ ] Native photo upload attachment support for site defect documentation.

---

## Rollout & Deployment Plan

### 1. Phased Rollout Strategy

```
+-----------------------------------------------------------------------------+
| Stage 1: Local & CI Validation                                              |
| - Automated unit & integration tests run via `npm test`                     |
| - Static lint and environment variable security audit                       |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| Stage 2: Staging Deployment                                                 |
| - Backend deployed to cloud container / serverless environment              |
| - Connect to Supabase Staging PostgreSQL instance                           |
| - Seed canonical multi-project test data                                    |
| - Internal UAT with site engineers and fitout managers                      |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| Stage 3: Limited Production Pilot (3 - 5 Stores)                            |
| - Deployed to production origin with strict CORS enforcement                |
| - Calibrate real-world worker productivity factors with actual site data    |
| - Establish monitoring and error alerting                                   |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| Stage 4: Full Multi-Site Enterprise Expansion                               |
| - Rollout across all regional retail stores                                 |
| - Self-service onboarding for external subcontractor trades                 |
+-----------------------------------------------------------------------------+
```

### 2. Testing & Quality Assurance
- **Unit Testing:** Core mathematical calculations and edge cases verified using native `node:test`.
- **Integration Testing:** Full HTTP request cycles tested against Express server with mock authentication and organization isolation assertions.
- **Fail-Fast Production Validation:** Backend automatically verifies mandatory environment variables (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) upon startup in production mode (`NODE_ENV=production`).

### 3. Monitoring & Operational Health
- **Health Check Route:** Unauthenticated `GET /health` endpoint responding with `{ "status": "ok" }` for container orchestrators (Docker, Kubernetes) and load balancers.
- **Graceful Shutdown:** Process traps `SIGTERM` and `SIGINT` to gracefully drain HTTP connections and close the PostgreSQL pool before terminating.

---

## Installation & Local Setup

### Prerequisites
- **Node.js**: Version `>= 20.0.0`
- **npm**: Version `>= 9.0.0`
- **PostgreSQL** *(Optional for local development)*: Version 14+ or a cloud-hosted Supabase instance. If omitted, SitePulse operates automatically using its built-in in-memory store.

### 1. Clone the Repository
```bash
git clone https://github.com/piyushsirsa0519/SitePulse_1.git
cd SitePulse_1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```

Configure your `.env` variables as needed:
```env
# Server Port
PORT=3000

# PostgreSQL Connection String (Optional in local dev - defaults to in-memory store if unset)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sitepulse

# Supabase Auth Credentials (Optional in local dev mode)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Production CORS Origin Restriction (Set to frontend URL in production)
CORS_ORIGIN=https://your-site-pulse-frontend.vercel.app
```

> **Security Notice:** Never commit `.env` or sensitive database connection strings to version control. The `.gitignore` file is pre-configured to exclude all `.env` files except `.env.example`.

### 4. Database Setup (Optional if using PostgreSQL)
If using a live PostgreSQL database, execute migrations and seed data:
```bash
# Run database migrations
npm run migrate

# Seed sample projects and trades
npm run seed
```

### 5. Running the Test Suite
Execute the 37 native automated tests:
```bash
npm test
```

### 6. Starting the Application

#### Start the Backend API Server
```bash
# Production start
npm start

# Development mode
npm run dev
```
The API server will listen on `http://localhost:3000`.

#### Launch the Frontend Client
Because SitePulse uses Vanilla JavaScript and HTML5, the frontend can be served with any local static HTTP server:
```bash
# Using Python
python -m http.server 8080

# Or using npx serve
npx serve . -p 8080
```
Open your browser at `http://localhost:8080` (or open `index.html` directly).

#### Default Local Development Credentials
In local development (`localhost`), you can sign in instantly using the built-in demo credentials:
- **Executive Manager (Admin):** `executive@apexfitouts.com` / `password`
- **Site Engineer:** `engineer@apexfitouts.com` / `password`
- **Client Viewer (Read-only):** `viewer@apexfitouts.com` / `password`

---

## Project Structure

```
SitePulse_1/
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git exclusion rules (sensitive files, node_modules)
├── .nvmrc                         # Node.js version declaration (>=20)
├── config.js                      # Frontend API and Supabase client configuration
├── index.html                     # Semantic application layout and modal markup
├── package.json                   # Project metadata, dependencies, and scripts
├── package-lock.json              # Deterministic package dependency tree
├── script.js                      # Frontend application state and UI rendering engine
├── style.css                      # Modern CSS design system, variables, and dark/light modes
│
├── backend/                       # Backend Application Core
│   ├── db/
│   │   ├── migrations/            # SQL migration scripts
│   │   ├── schema.sql             # Canonical PostgreSQL DDL schema
│   │   ├── seed.js                # Database seed runner script
│   │   └── seed.sql               # Seed data for projects, trades, and daily updates
│   │
│   ├── src/
│   │   ├── app.js                 # Express application, CORS, and route mounting
│   │   ├── server.js              # HTTP server entry point and graceful shutdown
│   │   │
│   │   ├── analytics/
│   │   │   └── index.js           # Pure mathematical analytics & forecasting engine
│   │   │
│   │   ├── db/
│   │   │   └── client.js          # PostgreSQL connection pool with in-memory fallback
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js            # Supabase JWT validation & user mapping
│   │   │   ├── authorization.js   # Role-based access control (RBAC) middleware
│   │   │   └── errorHandler.js    # Centralized JSON error formatting
│   │   │
│   │   ├── routes/
│   │   │   ├── health.js          # Unauthenticated health check endpoint (/health)
│   │   │   ├── me.js              # Authenticated user context endpoint (/me)
│   │   │   ├── portfolio.js       # Risk-sorted executive portfolio endpoint (/portfolio)
│   │   │   └── projects.js        # Project dashboard & daily update logging routes
│   │   │
│   │   └── services/
│   │       ├── portfolioService.js# Portfolio data aggregation service
│   │       ├── projectService.js  # Project details & metrics query service
│   │       ├── updateService.js   # Daily update validation & UPSERT service
│   │       └── userService.js     # User identity and organization lookup service
│   │
│   └── tests/                     # Automated Test Suites (Native Node Test Runner)
│       ├── analytics.test.js      # Pure analytics calculation tests
│       ├── api.test.js            # End-to-end HTTP API, auth, and RBAC tests
│       └── calculation_verification.test.js # Scenario-based regression tests (37 tests)
│
├── js/                            # Modular Frontend Client Utilities
│   ├── api.js                     # HTTP request client wrapper for Express API
│   └── auth.js                    # Supabase authentication and session manager
│
└── migrations/                    # Database migration tracking files
    └── 1700000000000_initial-schema.sql # Initial database structure migration
```

---

## Future Improvements

The following capabilities represent natural extensions for subsequent project iterations:

1. **Subcontractor Portal & Mobile PWA:** Provide specialized subcontractors (e.g., electrical contractor teams) with restricted views to confirm material arrivals and worker clock-ins via a mobile Progressive Web App.
2. **Defect Photo Uploads:** Enable site engineers to attach high-resolution photographic evidence directly to daily logs using Supabase Storage or AWS S3 buckets.
3. **Automated WhatsApp / Slack Alerts:** Broadcast instant notifications to project managers when a critical trade is identified as a bottleneck with greater than 3 days delay.
4. **Historical Productivity Calibration:** Train a machine-learning regression model on completed fitout projects to replace linear velocity with trade-specific non-linear learning curve projections.
5. **Multi-Calendar Integrations:** Sync projected completion dates and handover milestones directly with Google Calendar and Microsoft Outlook.

---

## Contributing & License

### Contributing Guidelines
1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-feature`).
2. Adhere to existing code conventions and write clean, self-documenting code.
3. Ensure all 37 automated tests pass before committing (`npm test`).
4. Commit your changes with descriptive, conventional commit messages.
5. Push to your branch (`git push origin feature/amazing-feature`) and open a Pull Request.

### License
This project is licensed under the **ISC License** as specified in [`package.json`](package.json).
