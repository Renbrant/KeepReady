# KeepReady — Emergency Food Storage & Household Nutrition Planner

**KeepReady** is an offline-first, cross-platform emergency food storage inventory tracker, survival nutrition calculator, and instructional preparedness guide designed for individuals and families worldwide.

> "Know what you have. Plan what you need. Keep ready for tomorrow."

---

## 📚 Project Documentation Index

* [Functional Specifications (FEATURES.md)](./FEATURES.md) — Detailed specification of all 10 application modules, the 7 purpose-built kits, the 10 threat scenarios, and the complete Free vs. Pro matrix.
* [Page Flows & Screen Architecture (PAGE_FLOWS.md)](./PAGE_FLOWS.md) — Comprehensive user journeys, wireflow logic, and layout adaptations for Mobile (APK) and Web.
* [Visual Identity & Design System (DESIGN_SYSTEM.md)](./DESIGN_SYSTEM.md) — Tactical minimalist UI specifications, color tokens, typography, and component styling inspired by Voxyl and MeshCrossway.
* [Emergency Communications & Offline Maps (COMMUNICATIONS_AND_MAPS.md)](./COMMUNICATIONS_AND_MAPS.md) — The PACE framework, LoRa mesh bridge (Meshtastic/MeshCore), and downloadable offline vector mapping.
* [Authoritative Public Data Sources (DATA_SOURCES.md)](./DATA_SOURCES.md) — Catalog of scientific standards, government APIs, humanitarian nutrition benchmarks, and civil defense frameworks with verified links.
* [Database Schema (schema.sql)](./schema.sql) — Initial PostgreSQL relational database schema designed for Supabase with Row-Level Security (RLS).
* [License (LICENSE)](./LICENSE) — Business Source License 1.1 (BSL 1.1).

---

## 1. Project Overview & Vision

Most home inventory applications are designed either to prevent everyday refrigerator food waste or act as static spreadsheets. Preppers, homesteaders, and disaster-preparedness planners require a system that answers one mission-critical question:

> "If all supply chains and services cut out today, how many days will my household survive with our current stock, and what critical nutritional, water, or energy deficits must we solve first?"

KeepReady bridges that gap by combining:
1. A Dynamic Living Calculator: Translates real-time inventory into days of survival based on verified humanitarian nutrition standards.
2. A Hierarchical Inventory Manager: Tracks physical items across nested containers (e.g., Mylar bag in Bucket #4, Basement Shelf B) with FIFO rotation and batch expiration monitoring.
3. An Embedded Storage Instructor: Educates users on safe, long-term preservation methods using authoritative public datasets.
4. Hybrid Emergency Communications (PACE): Seamless failover from cloud messaging to off-grid LoRa Mesh networks (Meshtastic / MeshCore).
5. Offline Vector Mapping: Pre-downloaded map packs and live family GPS tracking over radio mesh.
6. Resilient Local-First Architecture: Completely operational offline without cellular or grid connectivity, automatically reconciling data via cloud sync once reconnected.

---

## 2. Core Architecture & Technology Stack

- Frontend (Mobile & Web): Flutter (Dart) compiling to native Android APK and Web
- Local Storage (On-Device): Embedded SQLite via Drift / PowerSync SQLite core
- Backend & Authentication: Supabase (Managed PostgreSQL, Row-Level Security, Google OAuth2)
- Offline Data Sync: PowerSync (Bi-directional sync and local caching)
- Hosting & Delivery: Cloudflare Pages (Fast Global CDN, Free Tier)
- Billing & Subscriptions: Stripe or Lemon Squeezy

---

## 3. Development Roadmap

1. Phase 1: Specifications & Documentation (Completed)
   - Defined system architecture, brand identity, and freemium model.
   - Compiled authoritative scientific standards in DATA_SOURCES.md.
   - Formalized functional modules in FEATURES.md.
   - Documented screen architecture and wireflows in PAGE_FLOWS.md.
   - Standardized tactical visual identity in DESIGN_SYSTEM.md.
   - Detailed PACE radio comms and offline maps in COMMUNICATIONS_AND_MAPS.md.
   - Established Business Source License 1.1 (BSL 1.1) in LICENSE.
   - Linked all specifications in README.md.
2. Phase 2: Database & Backend Deployment
   - Deploy Supabase PostgreSQL schema with Row-Level Security (RLS).
   - Integrate PowerSync for local-to-cloud data replication.
3. Phase 3: Core Flutter Development (MVP)
   - Build the Living Calculator module.
   - Implement hierarchical storage manager and barcode scanner.
   - Embed offline USDA / USU reference data.
4. Phase 4: Pre-Release APK & Web Deployment
   - Compile standalone Android APKs (keepready-v1.0.apk) for field testing.
   - Deploy web app to Cloudflare Pages (keepready.pages.dev).
5. Phase 5: Monetization & Public Launch
   - Integrate Stripe payment webhooks for Pro subscriptions.
   - Publish to Google Play Store and Apple App Store.

---

## 4. License

This project is licensed under the **Business Source License 1.1 (BSL 1.1)**. See the [LICENSE](./LICENSE) file for permitted non-commercial uses and commercial restrictions.
