# KeepReady — Functional Specifications & Feature Breakdown

This document provides a detailed specification of all functional modules, calculation logic, user workflows, and data relationships for the **KeepReady** application.

---

## Module 1: Household Profile & Emergency Parameters

Allows users to define the specific composition and survival criteria of their household.

### 1.1 Household Member Definition
* Member Profiles: Name, age category (Infant, Child, Adult, Senior), and physiological states (pregnant, lactating, high physical activity).
* Caloric Baseline: 
  - Default: 2,100 kcal / person / day based on The Sphere Handbook Standards.
  - Customizable target per individual (e.g., 2,500 kcal for manual labor or 1,600 kcal for sedentary elderly).
* Hydration Baseline:
  - Default: 3.0 liters / person / day (drinking and rehydration).
  - Optional hygiene allowance (+2.0 to +10.0 liters / day).
* Pet Tracking: Support for domestic pets (dogs, cats) with daily dry/wet food and water requirements.

### 1.2 Scenario & Environmental Factors
* Climate Adjustment: Dynamic increase of +100 kcal / day for every 5°C ambient temperature drop below 20°C.
* Cooking Constraints:
  - Standard (Full grid / gas available).
  - No Electricity / Boiling Only (Filters meals to items requiring only boiled water, e.g., freeze-dried, oatmeal, ramen).
  - Zero Cooking / No Heat (Filters to ready-to-eat rations, canned meats, crackers, peanut butter).

---

## Module 2: Dynamic Living Calculator

The core mathematical engine that bridges what the household needs with what is currently in stock.

### 2.1 Real-Time Autonomy Gauges
* Days of Food (Caloric Autonomy): Total consumable calories divided by the household's aggregate daily caloric burn.
* Days of Water (Hydration Autonomy): Total stored potable water divided by daily household requirements.
* Limiting Factor Warning: Explicitly highlights the shortest bottleneck (e.g., "You have 90 days of food, but your water reserve expires in 14 days").

### 2.2 Nutritional Balance & Macro Breakdown
* Macronutrient Distribution:
  - Protein: 10% to 15% of total caloric intake.
  - Fat / Lipids: 17% to 20% of total caloric intake.
  - Carbohydrates: Remainder (55% to 70%).
* Micronutrient & Salt Check: Tracks minimum daily sodium (iodized salt) requirements (~5g/day/adult) and vital vitamin reserves.

### 2.3 Gap Analysis & Shopping List Generator
* Compares current inventory against target duration (e.g., 90-day goal).
* Identifies exact deficits (e.g., Deficit: -18 kg legumes, -12 liters oil).
* Automatically generates prioritized shopping lists to bridge deficits without food waste.

---

## Module 3: Hierarchical Inventory Management

Enables physical organization from rooms down to individual sealed bags.

### 3.1 Multi-Level Storage Hierarchy
* Level 1: Locations / Rooms (e.g., Basement, Garage, Pantry Closet, Bug-Out Bag).
* Level 2: Furniture / Zones (e.g., Shelf Unit A, Storage Rack 3).
* Level 3: Containers & Bins (e.g., 5-Gallon Bucket #04, Heavy Duty Tote #2).
* Level 4: Items & Batches (e.g., 10x White Rice 1kg in Mylar Bag with 300cc O2 Absorber).

### 3.2 Product Catalog & Barcode Scanning
* Global Barcode Lookup: Instant product identification via Open Food Facts API and USDA FoodData Central.
* Bulk Goods Support: Direct manual entry for non-barcoded commodities (beans, grains, honey, sugar, salt).

### 3.3 Batch & Expiration Management (FIFO)
* First-In, First-Out (FIFO) Sorting: Shows which batch of a product should be eaten or rotated first.
* Opened vs. Unopened Status: Tracking of opened goods with reduced shelf life.
* Lot Numbers & Packaging Dates: Detailed traceability for home-canned or home-packaged goods.

---

## Module 4: The Storage Instructor & Safety Advisor

In-app educational engine derived from verified scientific preservation literature.

### 4.1 Preservation Knowledge Base
* Shelf-Life Advisor: Integrated offline data from USDA FSIS FoodKeeper showing expected lifespan across room temperature, cool cellars, and freezers.
* Mylar & Oxygen Absorber Sizing: Automatic calculation of required cubic centimeter (cc) rating of oxygen absorbers based on container volume and food bulk density (derived from USU Extension Guidelines).

### 4.2 Critical Safety Rules
* Anaerobic Hazard Detection (Botulism Warning): Hard system alert warning users never to use oxygen absorbers on items with >10% moisture content (e.g., brown rice, nuts, dried fruits, flour).
* Temperature Degradation Curve: Visual explanation of how storage temperatures above 24°C (75°F) cut vitamin and nutritional lifespan by half.

---

## Module 5: Rotation Alerts & Notifications

* Staged Expiration Alerts: Push notifications at customizable intervals (e.g., 6 months, 90 days, 30 days before best-by date).
* Rotation Suggestions: Suggests incorporating items nearing expiration into daily household meals before they spoil.

---

## Module 6: Offline Resilience & Cloud Sync

* 100% Local-First: All database queries run locally against SQLite on the device. Zero loading spinners, works in airplane mode or during grid outages.
* Background Cloud Sync: Automatically reconciles local SQLite with Supabase PostgreSQL using PowerSync when an active internet connection is detected.
* Emergency Data Export: Generates clean, printable PDF inventory sheets and offline CSV backups for physical binder storage.

---

## Module 7: Tiered Feature Matrix

| Feature | Community / Free | Pro / Family Subscriber |
| :--- | :--- | :--- |
| Duration Horizon | Up to 30 days | Unlimited (up to 5 years) |
| Household Capacity | Up to 4 members | Unlimited members & pets |
| Storage Depth | 2 locations, 100 items | Unlimited locations, deep container nesting |
| Barcode Scanner | Enabled | Enabled |
| Storage Instructor | Basic guides | Full safety warnings & O2 sizing engine |
| Multi-Device Sync | Single device backup | Real-time multi-device family collaboration |
| Export Formats | Screen view only | Formatted Emergency PDF & CSV exports |
