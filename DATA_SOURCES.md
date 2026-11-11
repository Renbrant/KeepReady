# KeepReady — Authoritative Public Data Sources & Scientific Standards

This document catalogs all verified scientific databases, government APIs, humanitarian standards, and civil defense frameworks integrated into **KeepReady**.

---

## 1. Food Safety, Shelf-Life & Long-Term Preservation

* **[USDA FSIS FoodKeeper Dataset](https://catalog.data.gov/dataset/fsis-foodkeeper-data)**
  - *Publishing Body:* USDA Food Safety and Inspection Service, Cornell University, and FMI.
  - *Format:* JSON / CSV open dataset on Data.gov.
  - *Application:* Provides empirical shelf-life baselines across ambient room-temperature pantry, cool cellar, refrigeration, and freezer storage for over 500 food categories.

* **[Utah State University (USU) Extension — Preserve the Harvest](https://extension.usu.edu/preserve-the-harvest/food-storage-packaging)**
  - *Publishing Body:* Utah State University Extension.
  - *Application:* The benchmark scientific guidelines for long-term dry packaging: oxygen absorber sizing (cc ratings), moisture thresholds (<10% to prevent anaerobic botulism risks in Mylar), and temperature shelf-life reduction curves.

* **[National Center for Home Food Preservation (NCHFP)](https://nchfp.uga.edu/)**
  - *Publishing Body:* Cooperative Extension System / USDA.
  - *Application:* Peer-reviewed scientific thermal processing tables for pressure canning, boiling water-bath canning, and food dehydration.

---

## 2. Disaster Nutrition, Caloric Standards & Global Barcodes

* **[The Sphere Handbook — Humanitarian Charter and Minimum Standards](https://emergency.unhcr.org/sites/default/files/2024-05/SphereFS%2BN.pdf)**
  - *Publishing Body:* The Sphere Project (supported by UN, Red Cross, and international NGOs).
  - *Application:* Establishes the global disaster nutrition standard of **2,100 kcal / person / day**, macronutrient distribution (10–12% protein, 17–20% lipids), hydration minimum (3.0 L/person/day), and climate adjustment (+100 kcal/day for each 5°C below 20°C).

* **[USDA FoodData Central API](https://fdc.nal.usda.gov/)**
  - *Publishing Body:* USDA Agricultural Research Service.
  - *Format:* REST API / Downloadable CSV/JSON.
  - *Application:* Nutritional composition engine providing precise calories, proteins, carbohydrates, lipids, sodium, and vitamins per 100g and serving size.

* **[Open Food Facts Database & API](https://world.openfoodfacts.org/)**
  - *Publishing Body:* Open Food Facts Non-profit.
  - *Format:* Open REST API covering 3M+ products globally.
  - *Application:* Global barcode scanning engine (UPC, EAN, GTIN) to pull brand names, nutritional labels, and package weights instantly.

---

## 3. Civil Defense, Total Defence & National Resilience

* **[MSB Sweden — "If Crisis or War Comes" (Om krisen eller kriget kommer)](https://www.jonkoping.se/download/18.6a087b4c169dcff8c903056e/1556627549015/Engelska.pdf)**
  - *Publishing Body:* Swedish Civil Contingencies Agency (MSB).
  - *Application:* National resilience benchmark establishing the **7-Day Household Autonomy Standard**, unpowered thermal heating guidelines, and civilian cash reserve buffers during electronic banking outages.

* **[Finland National Emergency Supply Agency (NESA / 72 Hours Model)](https://72tuntia.fi/)**
  - *Publishing Body:* Ministry of the Interior of Finland.
  - *Application:* Sub-zero cold-weather survival checklists and domestic home reserve standards.

---

## 4. Radiological Protection & Nuclear Civil Defense

* **[Oak Ridge National Laboratory — Nuclear War Survival Skills (NWSS)](https://en.wikipedia.org/wiki/Nuclear_War_Survival_Skills)**
  - *Author:* Cresson H. Kearny (Oak Ridge National Laboratory / U.S. Department of Energy).
  - *Application:* Empirical fallout shielding physics: the **7-10 Radiation Decay Rule** (every 7x increase in hours reduces radiation by 10x), material half-thickness values (15 cm earth, 10 cm concrete, 18 cm water per half-value layer), and makeshift shelter ventilation.

---

## 5. Austere Trauma Care & Tactical First Aid

* **[Tactical Combat Casualty Care (TCCC Guidelines / CoTCCC)](https://tccc.org.ua/files/downloads/clinical-guidelines-2026-en.pdf)**
  - *Publishing Body:* U.S. Department of Defense Joint Trauma System.
  - *Application:* Prehospital trauma care based on the **MARCH** algorithm (Massive Hemorrhage, Airway, Respiration, Circulation, Hypothermia prevention), guiding KeepReady's trauma kit checklists.

---

## 6. Contingency Communications & Survival Fundamentals

* **[CISA Emergency Communications Ecosystem — PACE Protocol](https://www.cisa.gov/resources-tools/resources/leveraging-pace-plan-emergency-communications-ecosystem)**
  - *Publishing Body:* Cybersecurity and Infrastructure Security Agency (CISA / U.S. DHS).
  - *Application:* Communications redundancy hierarchy: **P**rimary (Cloud), **A**lternate (Local Wi-Fi/SMS), **C**ontingency (LoRa Mesh), and **E**mergency (Analog Radio with 3-3-3 schedule).

* **[U.S. Army Survival Manual (FM 21-76 / TC 3-21.76)](https://en.wikipedia.org/wiki/Survival_manual)**
  - *Publishing Body:* Department of the Army.
  - *Application:* The physiological **Rule of Threes** (3 minutes oxygen, 3 hours thermal shelter, 3 days water, 3 weeks food) governing survival prioritization.

---

## 7. Real-Time Hazard Feeds & Water Science

* **[openFDA Food Enforcement API](https://open.fda.gov/apis/food/enforcement/)**
  - *Publishing Body:* U.S. Food and Drug Administration.
  - *Application:* Automated cross-matching of inventory barcodes against active food recalls and biological contamination warnings.

* **[GDACS API (Global Disaster Alert and Coordination System)](https://gdacs.org/)**
  - *Publishing Body:* United Nations & European Commission.
  - *Application:* Multi-hazard real-time alerts for earthquakes, hurricanes, floods, and tsunamis without requiring API keys.

* **[NASA FIRMS API (Fire Information for Resource Management System)](https://firms.modaps.eosdis.nasa.gov/)**
  - *Publishing Body:* NASA Earthdata / LANCE.
  - *Application:* Satellite thermal imaging (MODIS/VIIRS) detecting active wildfires around the user's home or bug-out destination.

* **[NOAA Space Weather Prediction Center (SWPC) API](https://www.spaceweather.gov/)**
  - *Publishing Body:* NOAA / National Weather Service.
  - *Application:* Real-time planetary Kp-index and geomagnetic storm monitoring for electrical grid disruption early warnings.

* **[CDC Emergency Water Disinfection Protocols](https://www.cdc.gov/healthywater/emergency/making-water-safe.html)**
  - *Publishing Body:* Centers for Disease Control and Prevention / EPA.
  - *Application:* Built-in mathematical calculator converting raw collected water volume into exact chemical dosage requirements (bleach drops, chlorine dioxide, and altitude boiling times).
