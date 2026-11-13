# KeepReady — All-in-One Family Preparedness & Off-Grid Crisis Resilience Platform

**KeepReady** is an offline-first, cross-platform emergency management platform, tactical supply tracker, off-grid communicator, and survival intelligence system designed to protect families and communities during short-term disruptions and catastrophic grid-down events.

> "Know what you have. Navigate the crisis. Stay connected off-grid. Keep ready for tomorrow."

---

## 📚 Project Documentation Index

* [Functional Specifications (FEATURES.md)](./FEATURES.md) — Complete specifications of all 10 core modules, the 7 purpose-built kits, the 10 threat scenarios, and the Free vs. Pro matrix.
* [Page Flows & Screen Architecture (PAGE_FLOWS.md)](./PAGE_FLOWS.md) — Comprehensive user journeys, wireflow logic, and layout adaptations for Mobile (APK) and Web.
* [Emergency Communications & Offline Maps (COMMUNICATIONS_AND_MAPS.md)](./COMMUNICATIONS_AND_MAPS.md) — The PACE framework, LoRa mesh bridge (Meshtastic / MeshCore), local USB-OTG RTL-SDR tuning, and downloadable offline vector maps.
* [Visual Identity & Design System (DESIGN_SYSTEM.md)](./DESIGN_SYSTEM.md) — Tactical minimalist UI specifications, color tokens, typography, and component styling inspired by Voxyl and MeshCrossway.
* [Brand Kit (brand/)](./brand/README.md) — Logos, app icons, social image and color/type tokens for the KeepReady identity.
* [Authoritative Public Data Sources (DATA_SOURCES.md)](./DATA_SOURCES.md) — Catalog of scientific standards, government APIs, humanitarian nutrition benchmarks, and civil defense frameworks with verified links.
* [Reference Knowledge Base (knowledge_base/)](./knowledge_base/README.md) — Structured directory containing empirical food storage profiles, cooking fuel physics, CDC water formulas, TCCC trauma protocols, and global SDR presets.
* [Database Schema (schema.sql)](./schema.sql) — Comprehensive PostgreSQL relational schema designed for Supabase with Row-Level Security (RLS).
* [License (LICENSE)](./LICENSE) — Business Source License 1.1 (BSL 1.1).

---

## 1. Vision & The 5 Pillars of Resilience

Most preparedness software is either a rigid spreadsheet, a generic pantry checklist, or a niche radio tool for engineers. **KeepReady** unifies household survival into five integrated operational pillars:

1. **Calculated Autonomy (Food & Water Logistics):**
   - Dynamic living calculations translating physical supplies into exact days of human survival based on the humanitarian Sphere Standard (2,100 kcal/day).
   - Zero-Cook and cooking fuel dependency audits to prevent reliance on foods requiring unavailable gas or electricity.

2. **Tactical Supply Management & Smart Containers:**
   - Multi-tier physical tracking: *Property -> Room -> Shelf -> Sealed Container -> Item*.
   - Smart Bin QR Tags: Printable QR labels allowing instant camera inspection of sealed 5-gallon buckets and totes without breaking hermetic Mylar seals.
   - Specialized inventory for batteries (recharge cycles, leak warnings) and TCCC trauma medical gear (tourniquets, hemostatic gauze).

3. **Multi-Hazard Threat Scenarios & Civil Defense:**
   - Actionable Three-Phase Plans (*Before, During, After*) across 10 critical hazards: Power Outage, Severe Storm, Earthquake, Winter Deep Freeze, Flooding, Wildfire, Civil Conflict, Nuclear Fallout, Wilderness Stranding, and Pandemics.
   - Embedded civil defense science: Swedish MSB 7-day self-sufficiency standard and Oak Ridge NWSS radiation decay physics.

4. **Off-Grid Communications Bridge (KeepReady Comms):**
   - Implementation of the CISA PACE plan: Primary (Cloud), Alternate (Local Wi-Fi/SMS), Contingency (LoRa Mesh via Meshtastic / MeshCore), and Emergency (Two-way radio 3-3-3 protocols).
   - Automated transport failover: sends via internet when connected, automatically routes through Bluetooth-paired LoRa nodes when the cellular grid collapses.
   - Dual-Mode SDR Receiver: Streams remote WebSDR/KiwiSDR frequencies online, and tunes local airwaves (500 kHz to 1.76 GHz) directly using a phone-connected USB-OTG RTL-SDR dongle offline.

5. **Downloadable Offline Vector Maps & Hazard Sentry:**
   - Pre-downloadable regional map packs (OpenStreetMap / MapLibre vector tiles) stored directly on the device for 100% offline navigation.
   - Live family beaconing over LoRa mesh or cloud, showing distance and compass bearing to family members.
   - Sentry intelligence: automated openFDA food contamination recalls, NASA FIRMS active wildfire perimeters, and GDACS disaster alerts.

---

## 2. Core Architecture & Technology Stack

- Frontend (Mobile & Web): Flutter (Dart) compiling to native Android APK and WebAssembly/HTML5.
- Local Storage (On-Device): Embedded SQLite via Drift / PowerSync SQLite core for instantaneous offline operation.
- Backend & Authentication: Supabase (Managed PostgreSQL, Row-Level Security, Google OAuth2).
- Offline Data Sync: PowerSync (Bi-directional delta synchronization and local caching).
- Hosting & Delivery: Cloudflare Pages (Fast Global CDN, Free Tier).
- Communications Bridge: Bluetooth LE (BLE) client to Meshtastic / MeshCore hardware nodes.
- Local Radio Receiver: USB-OTG RTL-SDR driver via Flutter FFI (`core_rtlsdr`).
- Geospatial Engine: MapLibre GL / MBTiles offline vector tiles.
- Billing & Subscriptions: Stripe or Lemon Squeezy.

---

## 3. Development Roadmap

1. Phase 1: Specifications & Documentation (Completed)
   - Defined comprehensive system architecture, brand identity, and freemium model.
   - Compiled authoritative scientific standards in DATA_SOURCES.md.
   - Formalized all 10 operational modules in FEATURES.md.
   - Documented mobile and desktop wireflows in PAGE_FLOWS.md.
   - Detailed PACE radio comms and offline maps in COMMUNICATIONS_AND_MAPS.md.
   - Standardized tactical visual identity in DESIGN_SYSTEM.md.
   - Established Business Source License 1.1 (BSL 1.1) in LICENSE.
2. Phase 2: Database & Backend Deployment
   - Deploy Supabase PostgreSQL schema with Row-Level Security (RLS).
   - Integrate PowerSync for local-to-cloud data replication.
3. Phase 3: Core Flutter Development (MVP)
   - Build the Living Calculator module.
   - Implement hierarchical storage manager and barcode scanner.
   - Embed offline USDA / USU reference data.
4. Phase 4: Comms, Mapping & Pre-Release APK
   - Integrate BLE bridge for Meshtastic/MeshCore.
   - Implement offline vector map pack downloader and USB RTL-SDR receiver.
   - Compile standalone Android APKs (keepready-v1.0.apk) for field testing.
   - Deploy web app to Cloudflare Pages (keepready.pages.dev).
5. Phase 5: Monetization & Public Launch
   - Integrate Stripe payment webhooks for Pro subscriptions.
   - Publish to Google Play Store and Apple App Store.

---

## 4. License

This project is licensed under the **Business Source License 1.1 (BSL 1.1)**. See the [LICENSE](./LICENSE) file for permitted non-commercial uses and commercial restrictions.
