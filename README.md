# KeepReady — Emergency Food Storage & Household Nutrition Planner

**KeepReady** is an offline-first, cross-platform emergency food storage inventory tracker, survival nutrition calculator, and instructional preparedness guide designed for individuals and families worldwide.

> "Know what you have. Plan what you need. Keep ready for tomorrow."

---

## 1. Project Overview & Vision

Most home inventory applications are designed either to prevent everyday refrigerator food waste or act as static spreadsheets. Preppers, homesteaders, and disaster-preparedness planners require a system that answers one mission-critical question:

> "If all supply chains and services cut out today, how many days will my household survive with our current stock, and what critical nutritional or water deficits must we solve first?"

KeepReady bridges that gap by combining:
1. A Dynamic Living Calculator: Translates real-time inventory into days of survival based on verified humanitarian nutrition standards.
2. A Hierarchical Inventory Manager: Tracks physical items across nested containers (e.g., Mylar bag in Bucket #4, Basement Shelf B) with FIFO rotation and batch expiration monitoring.
3. An Embedded Storage Instructor: Educates users on safe, long-term preservation methods using authoritative public datasets.
4. Resilient Local-First Architecture: Completely operational offline without cellular or grid connectivity, automatically reconciling data via cloud sync once reconnected.

---

## 2. Core Architecture & Technology Stack

- Frontend: Flutter (Dart) compiling to native Android APK and Web
- Local Storage: SQLite via Drift / PowerSync SQLite core
- Backend & Auth: Supabase (PostgreSQL, Row-Level Security, Google OAuth2)
- Offline Data Sync: PowerSync (Bi-directional sync and local caching)
- Hosting & Delivery: Cloudflare Pages
- Billing: Stripe or Lemon Squeezy

---

## 3. Public Data Sources & Standards

- Shelf Life & Food Safety: USDA FSIS FoodKeeper Dataset, Utah State University Extension, National Center for Home Food Preservation (NCHFP).
- Nutritional Composition: USDA FoodData Central API and Open Food Facts API (global barcodes).
- Emergency Rationing: The Sphere Handbook Standards (2,100 kcal/person/day baseline, 2.5 to 3.0 L water/day).

---

## 4. Freemium Feature Matrix

- Free Tier: 30-day projection for up to 4 members, up to 100 tracked items, 3 storage locations, full offline operation, single-device backup.
- Pro Tier: Unlimited timeframe (up to 5 years), unlimited items and nested containers, multi-device family real-time sync, smart FIFO rotation alerts, print-ready PDF reports and CSV/Excel exports.

---

## 5. Development Roadmap

1. Phase 1: Specifications & Repository Initialization under keepready.
2. Phase 2: Database & Offline Sync Setup (Supabase PostgreSQL + PowerSync).
3. Phase 3: Core Flutter Development (Living Calculator & Storage Manager MVP).
4. Phase 4: Pre-Release APK & Web Deployment (Cloudflare Pages).
5. Phase 5: Monetization & Public Launch (Stripe integration & App Stores).
