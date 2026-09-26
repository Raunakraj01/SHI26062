# POLAR-OPS — Integrated Polar Expedition Operations & Logistics Platform

**Problem Statement:** Smart India Hackathon 2026 — **SIH26062**  
**Organization:** National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Govt. of India  
**Platform Architecture:** Zero-dependency Vanilla HTML5 / CSS3 / ES6 Client-Side Application  
**Authoritative Storage:** LocalStorage-backed reactive data engine (`js/storage.js`)  

---

## 1. Executive Summary

**POLAR-OPS** is a specialized mission-control and operational logistics platform designed for Antarctic scientific research stations (**Maitri**, **Bharati**) and Arctic outpost (**Himadri**). It unifies field traverse coordination, cold-chain cargo tracking, strategic sub-zero inventory reserves, polar vehicle fleets, expedition crew rosters, and rapid search-and-rescue (SAR) emergency protocols into a singular, high-contrast, mission-critical operations center.

The application adheres strictly to a lightweight, zero-dependency, framework-less design that can operate reliably in low-bandwidth, air-gapped, or field-deployed environments without external CDNs, cloud databases, or backend services.

---

## 2. Key Operational Modules

| Module | Route | Primary Responsibilities |
|---|---|---|
| **Command Center Dashboard** | `pages/dashboard.html` | High-precision interactive polar stereographic SVG visualizer (1000x480), animated traverse routes, pulsing station beacons, live UTC mission clock, KPI telemetry, cargo pipeline summary, and segmented inventory health. |
| **Expeditions** | `pages/expeditions.html` | Multi-season expedition tracking (42nd, 43rd, 44th ISEA), route planning, traverse progress monitoring, crew capacity, and expedition dossier inspection with cross-module roster linkage. |
| **Cargo Tracking** | `pages/cargo.html` | End-to-end multi-stage supply chain tracking (Origin &rarr; Port Gateway &rarr; In Transit aboard icebreaker &rarr; Station Unloading &rarr; Delivered), container inspection, manifest filters, and pipeline advancement. |
| **Inventory & Cold Storage** | `pages/inventory.html` | Critical supplies management (fuel Jet-A1, rations, cryogenic medical packs, batteries, spare parts), dynamic reserve ratio health meters, shortage warnings, quick stock adjustments (`±`), and replenishment logging. |
| **Assets & Fleet** | `pages/assets.html` | Mission machinery telemetry (PistenBully 300 snowcats, heavy freight sledges, Caterpillar generators, satellite dishes, zodiac boats), mechanical condition monitoring, maintenance scheduling, and fleet status triage. |
| **Personnel Movement** | `pages/personnel.html` | Expedition crew rosters, field traverse assignments, movement status tracking (At Station, In Transit, At Base, Returning, On Leave), and satellite check-in ping verification. |
| **Emergency Response & SAR** | `pages/emergencies.html` | Incident escalation protocols, 4-stage SAR lifecycle (`Reported` &rarr; `Acknowledged` &rarr; `Response In Progress` &rarr; `Resolved`), severity-tier triage (CRITICAL, HIGH, MEDIUM, LOW), response team assignments, and station broadcast alerts. |

---

## 3. Technology Stack & Architecture

- **Interface:** Semantic HTML5 and responsive CSS3 utilizing strict Antarctic Command Center design tokens:
  - Deep polar navy background: `#070b14`
  - High-visibility polar cyan: `#00d9ff`
  - Polar ice white: `#e6f1ff`
  - Semantic status colors: Green (`#10b981`), Amber (`#f59e0b`), Red (`#ef4444`)
  - Command rail layout (64px desktop rail, auto-collapsing drawer on mobile)
- **Engine:** Vanilla Modern ES6+ JavaScript (`js/storage.js`, `js/app.js`, `data/dummyData.js`).
- **Data Persistence:** Client-side `localStorage` with automated idempotency, deep cloning, auto-seeding default dummy datasets on first boot, and zero network dependency.
- **Cross-Module Reactivity:** Standardized event-driven architecture, cross-tab synchronization via `storage` event listeners, and centralized activity logging.

---

## 4. Quick Start & Local Serving

No installation, build tools, or packages are required. Any standard static file server can host POLAR-OPS immediately.

### Option A: Python Built-in Server (Recommended)
```bash
# Navigate to the repository root
cd /path/to/polar-ops

# Start local server on port 5500
python3 -m http.server 5500
```
Open your browser to:
```
http://localhost:5500
```

### Option B: Node.js `http-server` / `npx serve`
```bash
npx serve -l 5500 .
```

### Option C: Direct File Opening
All pages can also be loaded directly via `file://` protocol in standard modern web browsers (Chrome, Edge, Firefox, Safari).

---

## 5. Automated Verification & Test Suites

The repository contains automated unit, integration, and UI shell regression suites validating all modules, storage persistence, and design systems:

```bash
# Run Phase 1 Foundation Validation
node scratch/validate_phase1.js

# Run Phase 2 Global Shell Validation
node scratch/validate_phase2.js

# Run Phase 3 Command Dashboard Validation
node scratch/validate_phase3.js

# Run UI Refinement Verification
node scratch/validate_ui_refinement.js

# Run Core Operations Validation
node scratch/validate_core_operations.js

# Run Comprehensive Final Prototype Suite
node scratch/validate_final_prototype.js
```

---

## 6. Deployment Guide

POLAR-OPS is 100% static and ready for direct zero-configuration deployment to:
- **GitHub Pages:** Enable Pages on branch `master` with root folder `/`.
- **Cloudflare Pages / Vercel / Netlify:** Connect Git repository with build command left empty and output directory set to `.`.
- **Air-Gapped Field Laptops:** Copy folder onto flash storage or local hard drive and open `index.html`.

---
*POLAR-OPS &bull; NCPOR Mission Control &bull; Smart India Hackathon 2026*
