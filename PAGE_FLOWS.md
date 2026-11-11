# KeepReady — Application Page Flows & Screen Architecture

This document defines the user journey, screen navigation hierarchy, wireflow logic, and layout adaptations across both the **Mobile Application (Android APK/iOS)** and the **Web Application (Desktop/Browser)**.

---

## 1. Core Navigation Paradigm & Responsive Architecture

KeepReady employs an adaptive, responsive navigation structure that scales between hand-held touch devices and multi-pane desktop monitors:

### Mobile Navigation (Touch & 1-Hand Ergonomics)
* Bottom Navigation Bar (5 core destinations):
  1. Dashboard (Readiness Score & Living Calculator Gauges)
  2. Inventory (Hierarchical Containers, Barcode Scanner & Smart Bin QR Tags)
  3. Kits (The 7 Purpose-Built Kits & Threat Scenarios)
  4. Comms & Maps (PACE Emergency Hybrid Chat & Offline Vector Maps)
  5. Guide (Storage Instructor, O2 Calculator & Safety Sentry)
* Top Action Bar:
  - Dynamic Offline/Sync Status Pill (Green = Cloud Synced | Orange = Local SQLite Only | Blue = LoRa Mesh Active).
  - Quick Emergency SOS / Status Broadcast button.

### Web & Desktop Navigation (Multi-Column Master-Detail)
* Collapsible Left Sidebar: Provides persistent access to all modules, family profile switcher, and sync logs.
* 3-Column Workspace Layout for Inventory:
  - Column 1: Physical Location Tree (Rooms -> Shelves -> Containers).
  - Column 2: Container Contents & Batch Ledger (Items, quantities, FIFO sorting).
  - Column 3: Item Inspector, Nutritional Breakdown & Preservation Advice.
* Printable Center: Full-screen PDF preview for the Emergency Family Binder and custom inventory manifests.

---

## 2. Screen-by-Screen User Journey

### Flow 1: First-Run Onboarding Wizard
* Screen 1.1: Welcome & Mission Setup ("Family preparedness without guesswork").
* Screen 1.2: Household Definition (Add adults, children, seniors, pets, and individual caloric targets).
* Screen 1.3: Target Duration Selection (Select default goal: 72 hours, 14 days, 30 days, 90 days, or 1 year).
* Screen 1.4: Primary Shelter Location (Name primary home and assign basic storage areas: Pantry, Garage, Basement).
* Screen 1.5: Offline Reference Initialization (Unpacks local USDA FoodKeeper and nutritional SQLite tables into local storage).

### Flow 2: Dashboard & Living Calculator (Home Screen)
* Widget 2.1: Readiness Score Ring (0% to 100% weighted composite score).
* Widget 2.2: Dual Autonomy Gauges (Days of Caloric Autonomy vs. Days of Potable Water).
* Widget 2.3: Limiting Factor Critical Banner (Highlights the shortest bottleneck, e.g., "Water reserve expires in 12 days while food lasts 90 days").
* Widget 2.4: Zero-Cook Feasibility Toggle (Instant switch to recalculate days of survival assuming complete loss of cooking fuel or electricity).
* Widget 2.5: Active Sentry Feeds (Shows nearby disaster alerts via GDACS, active fire perimeters via NASA FIRMS, or active food recall warnings).
* Quick FAB (Floating Action Button): Open Barcode Scanner or Manual Item Entry.

### Flow 3: Hierarchical Inventory & Smart Container Tags
* Screen 3.1: Storage Hierarchy Explorer (Tree view: Property -> Room -> Shelf -> Container -> Item).
* Screen 3.2: Container Detail View (Shows bucket/tote contents, total stored calories, pack dates, and unsealed status).
* Screen 3.3: Smart Bin QR Tag Generator:
  - Generates a high-contrast printable QR code for physical placement on buckets.
  - Camera Scan Shortcut: Pointing the phone camera at a physical bucket instantly opens Screen 3.2 without unsealing Mylar bags.
* Screen 3.4: Item Inspector & Expiration Ledger:
  - Product barcode (Open Food Facts auto-population).
  - Batch entry with FIFO sorting (shows earliest expiration batch first).
  - Packaging shelf-life multiplier (adjusts lifespan based on Mylar + O2 absorber vs. original packaging).

### Flow 4: The 7 Purpose-Built Preparedness Kits
* Screen 4.1: Kit Selector Hub (Home Reserve, Bug-Out Bag, Family BOB, Vehicle Kit, Winter Kit, Get-Home Bag, Wilderness Kit).
* Screen 4.2: Kit Manifest & Checklist:
  - Category tabs: Water, Food Rations, Trauma/Medical (MARCH), Power/Batteries, Tools/Shelter.
  - Weight Calculator: Computes total backpack weight against body weight limits.
  - Essential vs. Optional progress bars.

### Flow 5: The 10 Threat Scenarios & Action Plans
* Screen 5.1: Threat Scenarios Grid (Power Outage, Severe Storm, Earthquake, Winter Freeze, Wildfire, Nuclear Fallout, etc.).
* Screen 5.2: Three-Phase Operational Action Plan:
  - Tab 1: Before (Preventative checklist, structural mitigation, stock confirmation).
  - Tab 2: During (Survival actions, unpowered cooking rules, shelter protocols).
  - Tab 3: After (Damage assessment, water decontamination, recovery steps).
* Screen 5.3: Nuclear & Fallout Physics Calculator (Oak Ridge NWSS 7-10 radiation decay tracker and material half-thickness shielding guide).

### Flow 6: KeepReady Comms & PACE Framework
* Screen 6.1: PACE Communication Matrix:
  - Primary (Cloud Chat via Supabase Realtime).
  - Alternate (Local Wi-Fi / SMS direct).
  - Contingency (LoRa Mesh bridge via BLE).
  - Emergency (Analog radio channel guide & 3-3-3 schedule).
* Screen 6.2: Family Mesh Chat Window:
  - Simplified messaging interface connected to pre-paired Meshtastic/MeshCore nodes.
  - One-Tap Quick Status Buttons ("Safe", "Need Assistance", "At Rendezvous Point").
* Screen 6.3: Hardware Pairing & Status:
  - Displays BLE connection status, battery percentage of the LoRa node, and mesh packet signal quality (SNR / RSSI).

### Flow 7: Offline Vector Maps & Tactical Navigation
* Screen 7.1: Regional Offline Map Downloader:
  - List of downloadable state/province vector map packages (MBTiles).
  - Storage space manager and auto-update prompts on Wi-Fi.
* Screen 7.2: Tactical Map Interface:
  - Full-screen offline vector map rendered via MapLibre.
  - Overlay toggles: Storage Caches, Utility Shutoffs, Evacuation Routes, Meeting Points.
  - Live Family GPS Pins: Shows last-known position, distance, and compass bearing received via Cloud or LoRa Mesh packets.

### Flow 8: Storage Instructor, Safety Sentry & CDC Calculator
* Screen 8.1: Preservation Guide Index (Grains, Legumes, Dehydrated, Home-Canned).
* Screen 8.2: Oxygen Absorber Sizing Tool (Calculates required cc based on container volume and food density).
* Screen 8.3: Botulism Safety Interlock (System alerts when user attempts to store high-moisture foods in anaerobic Mylar).
* Screen 8.4: CDC Water Disinfection Calculator (Calculates exact bleach drops or boiling times based on water clarity and altitude).

### Flow 9: Stockpile Valuation, Budget Optimizer & Shopping Lists
* Screen 9.1: Financial Dashboard (Total replacement value of stored supplies for home insurance).
* Screen 9.2: Dollar-to-Calorie Budget Optimizer (Recommends highest-yield purchases to fix active stockpile deficits within a monthly budget).
* Screen 9.3: Automated Shopping Replenishment List (One-tap export to Apple Reminders, Google Tasks, or printable text).

### Flow 10: Settings, Multi-Device Sync & Emergency Binder Exports
* Screen 10.1: Household Settings & Family Sync Pairing (Shareable invite code / QR code).
* Screen 10.2: Unit Toggles (Metric vs. Imperial unit switching across all screens).
* Screen 10.3: Emergency Family Binder Export Center:
  - Generates printable 1-page laminated summary card.
  - Generates comprehensive PDF multi-page physical binder inventory report.
