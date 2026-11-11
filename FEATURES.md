# KeepReady — Comprehensive Functional Specifications & Public Data Architecture

This document provides the complete technical and functional specification for **KeepReady**, detailing all modules, calculation algorithms, threat scenarios, kit frameworks, preservation intelligence, offline mesh communications, hazard sentry feeds, and authoritative public data integrations.

---

## 1. Authoritative Public Data Sources & Standards

KeepReady grounds its calculation engines, safety warnings, shelf-life recommendations, and hazard feeds in verified scientific, humanitarian, and public-domain databases:

### 1.1 Food Safety, Shelf-Life & Preservation Research
* **USDA FSIS FoodKeeper Dataset:** Published via Data.gov by the USDA Food Safety and Inspection Service, Cornell University, and FMI. Provides empirical shelf-life data across room-temperature pantry, cool cellar, refrigeration, and freezing.
* **Utah State University (USU) Extension — Preserve the Harvest:** Authoritative academic guidelines for long-term dry packaging, oxygen absorber sizing (cc ratings), moisture thresholds (<10% to eliminate anaerobic botulism risks), and storage temperature degradation curves.
* **National Center for Home Food Preservation (NCHFP / USDA):** Standardized scientific procedures for water-bath canning, pressure canning, and thermal dehydration.

### 1.2 Nutrition, Calories & Global Barcodes
* **The Sphere Handbook (Humanitarian Charter & Minimum Standards):** Internationally recognized disaster nutrition benchmark establishing the baseline of **2,100 kcal / person / day**, macronutrient balance (10–12% protein, 17–20% lipids), hydration baseline (minimum 3.0 L/person/day for consumption and rehydration), and temperature adjustment (+100 kcal/day for each 5°C below 20°C).
* **USDA FoodData Central API:** Open REST service providing comprehensive macronutrient, caloric, and micronutrient profiles per 100g and serving units.
* **Open Food Facts Database & API:** Global open database with over 3 million barcoded products (UPC / EAN / GTIN) for automated product identification across international markets.

### 1.3 Food Contamination & Safety Recalls
* **openFDA Food Enforcement API:** Open REST service from the U.S. Food and Drug Administration providing weekly updated public records on recalled and contaminated food batches (e.g., botulinum toxin, Salmonella, Listeria, foreign contaminants).

### 1.4 Global Disaster Feeds & Hazard Early-Warning
* **GDACS API (Global Disaster Alert and Coordination System):** Multi-hazard alert system operated jointly by the United Nations and the European Commission. Provides real-time public feeds (Common Alerting Protocol / GeoJSON) on earthquakes, tsunamis, tropical cyclones, floods, and volcanic activity without requiring API authentication.
* **NASA FIRMS API (Fire Information for Resource Management System):** Real-time global satellite thermal imaging (MODIS and VIIRS sensors) detecting active wildfires and thermal hotspots within customizable geographic radii.
* **NOAA Space Weather Prediction Center (SWPC) API:** Real-time planetary Kp-index and geomagnetic storm classifications (G1 to G5) tracking Coronal Mass Ejections (CMEs) and electrical grid disruption risks.

### 1.5 Emergency Water Purification Science
* **CDC Emergency Water Disinfection Protocols & EPA Guidelines:** Empirically verified chemical dosing formulas for disinfecting questionable surface/flood water using liquid household bleach (drops per liter/gallon for clear vs. turbid water), chlorine dioxide tablets, and elevation-corrected boiling times.

---

## 2. Module Breakdown

### Module 1: Household Profile & Nutrition Math
* **Member Profiles:** Name, age bracket (Infant, Child, Adult, Senior), and physiological modifiers (pregnancy, lactation, intense physical labor).
* **Caloric Customization:** Default 2,100 kcal baseline with custom overrides per member.
* **Hydration Calculator:** 3.0 L/day drinking baseline, with selectable allowances for hygiene (+2.0 to +10.0 L/day) and climate conditions.
* **Pet Requirements:** Tailored profiles for dogs and cats tracking dry/wet food and daily water requirements.

### Module 2: The 7 Purpose-Built Preparedness Kits
Pre-configured structural checklists with recommended quantities, essential vs. optional priority weighting, and packaging guidelines:
1. **Home Preparedness Kit (Static Reserve):** Primary shelter-in-place buffer for 14 days to 1+ year.
2. **Bug-Out Bag (BOB - 72h Individual):** Rapid-evacuation backpack limited to critical weight thresholds.
3. **Family Bug-Out Kit:** Coordinated multi-person evacuation system distributing communal supplies.
4. **Vehicle Emergency Kit:** Roadside survival, signaling, emergency water rations, and mechanical tools.
5. **Winter Vehicle Kit:** Sub-zero thermal protection, snow-traction gear, and high-calorie rations.
6. **Get-Home Bag (GHB - 24h to 48h):** Compact kit designed to transit from workplace/commute back to home.
7. **Camping & Wilderness Kit:** Remote self-reliance, wilderness water filtration, and field cooking.

### Module 3: Dynamic Living Calculator & Readiness Score
* **Readiness Score (0% to 100%):** Weighted readiness metric evaluating preparedness across Water, Food, and Supplies. Essential survival items carry higher mathematical weight than secondary comfort items.
* **Autonomy Gauges:** Real-time metrics showing exact days of food and days of water remaining based on active stock.
* **Limiting Factor Highlight:** Instantly flags the weakest link in the supply chain (e.g., *"Food: 120 days | Water: 10 days — Water is your critical bottleneck"*).
* **Cooking & Fuel Feasibility Audit (Zero-Cook Mode):** Audits food stock against cooking fuel availability. Flags if high-calorie items require long boiling times (e.g., raw beans) and recalculates immediate survival runway assuming zero grid power or cooking gas.
* **Hydration-Dependent Food Check:** Verifies whether stored potable water is sufficient to both rehydrate dehydrated rations and satisfy human metabolic drinking requirements.

### Module 4: The 10 Threat Scenarios & Action Plans
Structured action plans divided into three operational phases: **Before (Prepare)**, **During (Survive)**, and **After (Recover)**:
1. **Power Outage (Grid Failure):** Food preservation in unpowered freezers, backup lighting, water pressure loss.
2. **Severe Storm & Hurricane:** Windproofing, emergency water harvesting, safe indoor cooking without gas lines.
3. **Earthquake:** Structural mitigation, shutoff valve locations, rupture-resistant water storage.
4. **Winter Storm & Deep Freeze:** Hypothermia prevention, off-grid heating, frozen pipe contingencies.
5. **Flooding:** Moving stock above flood lines, biological water contamination, sealed dry-bags.
6. **Wildfire & Smoke Inhalation:** 15-minute evacuation readiness, air filtration (N95/P100), firebreaks.
7. **War & Civil Conflict:** Discretion/security, decentralized stockpiling, supply-chain blackout planning.
8. **Nuclear & Radiological Fallout:** Shelter sealing, shelf-stable non-perishables, potassium iodide protocol.
9. **Wilderness Survival & Stranded Isolation:** Field water purification, emergency shelter, foraging/emergency rations.
10. **Pandemic & Quarantine:** Supply isolation, medical stock, contact-free replenishment.

### Module 5: Comprehensive Inventory & Multi-Supply Tracking
* **Food & Potable Water:** Calories, shelf life, bulk grains, canned goods, water barrels, filtration filters.
* **Power & Batteries:** AA, AAA, 18650, LiFePO4 power stations, recharge cycles, and battery leak expiration tracking.
* **Medical & First Aid:** Prescription medicines, trauma kits, antibiotics, and expiration alerts.
* **Tools & Tactical Gear:** Flashlights, radios, stoves, fuel canisters, sanitation supplies.
* **Hierarchical Location Nesting:** Mappable storage structure: *Property → Room/Area → Shelf/Rack → Container/Bucket → Batch/Item*.
* **Smart Bin Tags (Printable QR Labels):** One-click generation of printable QR codes for storage tubs, boxes, and 5-gallon buckets. Scanning a tag with the app camera instantly displays all internal contents, expiration dates, and calories without unsealing containers.
* **Barcode & Expiry Scanning:** Rapid barcode lookup via Open Food Facts and camera OCR date recognition.

### Module 6: Storage Instructor & Safety Advisor
* **Preservation Methodology Engine:** Guides users on when to use standard pantries, food-grade HDPE buckets, glass jars, or Mylar bags.
* **Storage Method Expiration Multiplier:** Automatically recalculates shelf life when the storage method changes (e.g., store-bought white rice: 1–2 years; sealed Mylar with oxygen absorber: up to 30 years).
* **Oxygen Absorber Calculator:** Computes exact cc capacity needed based on container volume and food density.
* **Botulism Safety Alert:** Mandatory system warning blocking anaerobic packaging for goods with >10% moisture content.
* **Storage Temperature Visualizer:** Highlights shelf-life reduction curves when ambient heat exceeds 24°C (75°F).

### Module 7: Smart Rotation (FIFO), Valuation & Budgeting
* **First-In, First-Out (FIFO) Ledger:** Highlights the oldest batches to consume first.
* **Configurable Notification Milestones:** Automated alerts at 6 months, 90 days, 30 days, and 7 days before expiration.
* **Stockpile Valuation & Insurance Tracker:** Calculates total monetary value invested in emergency supplies for budgeting and home insurance records.
* **Budget-to-Nutrition Optimizer:** Given a monthly financial allowance (e.g., $50/month), recommends purchases that maximize caloric and nutritional yield to resolve the largest stockpile deficits first.

### Module 8: Local-First Architecture & Emergency Offline Binder
* **100% Offline Independence:** All queries and updates execute locally against SQLite on the device.
* **PowerSync Cloud Synchronization:** Seamless background replication to Supabase PostgreSQL when internet is available.
* **Emergency Family Binder One-Pager:** Generates a standardized, printable one-page laminated card containing emergency contacts, utility shutoff instructions, radio frequencies, and a critical inventory index.
* **Printable Emergency Inventory:** Formatted PDF reports and CSV raw data backups.

### Module 9: KeepReady Comms — Hybrid Emergency Communicator & Mesh Bridge
A resilient, family-oriented crisis communication bridge combining cloud messaging with off-grid LoRa mesh networks (Meshtastic & MeshCore protocols):
* **Smart Transport Failover (Internet vs. Mesh):**
  - *Primary Route (Cloud):* Sends encrypted messages and read receipts via Supabase Realtime WebSockets over active cellular/Wi-Fi networks.
  - *Secondary Route (LoRa Mesh Fallback):* When internet/cellular connectivity fails, the app automatically fails over to a Bluetooth LE (BLE) connected LoRa node (Meshtastic or MeshCore).
* **Decoupled Radio Configuration (Zero-Friction for Family):** Complex radio settings remain in native Meshtastic/MeshCore apps; KeepReady connects as a clean, simple communication UI.
* **Automated Family Channels & Encryption:** Encrypted private family group keys hopping transparently over public repeaters.
* **One-Tap Emergency Status Pings:** Bandwidth-optimized, low-byte broadcast messages (*"Safe"*, *"Need Assistance"*, *"At Rendezvous Point"*).
* **Offline Grid Map & Location Beaconing:** Periodic GPS coordinate exchange rendered on an offline vector map.

### Module 10: KeepReady Sentry — Hazard Early-Warning & Safety Feeds
Integrates automated intelligence from international monitoring bodies to safeguard supplies and alert households:
* **Automated Stock Contamination Sentry (openFDA API):** Background cross-referencing of stored barcodes and product names against active recall databases. Triggers immediate contamination alerts targeting the exact storage bin holding the recalled item.
* **Geographic Disaster Early-Warning (GDACS API):** Proximity-based alerts for emerging earthquakes, hurricanes, floods, and severe weather events, prompting the user to run the relevant preparedness checklist.
* **Wildfire Perimeter Tracking (NASA FIRMS API):** Real-time satellite thermal anomaly monitoring around the user's primary residence or bug-out destination.
* **Space Weather & Grid Vulnerability Gauge (NOAA SWPC API):** Geomagnetic storm (Kp-index) visual indicator alerting users to charge battery banks and store extra water ahead of solar grid disruptions.
* **Offline Emergency Water Disinfection Calculator (CDC Protocols):** Built-in mathematical calculator converting raw collected water volume into exact chemical dosage requirements (bleach drops, chlorine dioxide, or boiling minutes adjusted for altitude) without requiring an internet connection.

---

## 3. Freemium Feature Matrix

| Functional Area | Community Tier (Free) | Pro / Family Subscriber |
| :--- | :--- | :--- |
| **Emergency Kits** | 1 Complete Kit (Home Preparedness) | Unlimited kits across all 7 purpose-built types |
| **Threat Scenarios** | 1 Complete Plan (Power Outage) | All 10 Threat Scenarios with Before/During/After plans |
| **Duration Target** | Up to 30 days of autonomy | Unlimited duration (3 months, 1 year, up to 5 years) |
| **Household Size** | Up to 4 members | Unlimited members & domestic pets |
| **Inventory Limits** | Up to 100 tracked items & 2 storage rooms | Unlimited items & deep container nesting (totes, buckets, bags) |
| **Smart Bin QR Tags** | Up to 3 printable container QR codes | Unlimited container QR generation and instant camera scanning |
| **Cooking Feasibility** | Basic days calculation | Full Zero-Cook grid-down audit & cooking water check |
| **Valuation & Budget** | Item counts only | Total stockpile valuation & monthly budget optimizer |
| **Barcode & Scanning** | Standard barcode scanner | Barcode scanner + OCR expiration date camera reader |
| **Storage Instructor** | Standard storage guidelines | Full scientific engine, O2 absorber calculator & safety warnings |
| **Water Disinfection** | CDC Chemical Dosage Calculator | CDC Chemical Dosage Calculator + custom field filter tracking |
| **Hazard Sentry Feeds** | Manual refresh of local alerts | Automated openFDA food recall audits, GDACS alerts, NASA FIRMS wildfire proximity & NOAA space weather monitor |
| **Mesh Communications** | Local Bluetooth LoRa pings (SOS broadcast only) | Full Hybrid Smart-Routing (Cloud + LoRa Mesh), family channels, & GPS map tracking |
| **Synchronization** | Single-device local storage + backup | Real-time multi-device family cloud sync |
| **Exports** | In-app screen summary | Print-Ready Family Binder One-Pager, PDF & CSV exports |
