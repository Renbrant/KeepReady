# KeepReady — Food & Nutrition Mathematical Calculation Tables

This document provides empirical reference tables, demographic multipliers, food commodity nutritional profiles, water consumption ratios, and packaging calculations used directly by the **KeepReady Living Calculator** engine.

---

## Table 1: Demographic Caloric & Hydration Multipliers

Used to compute daily household baseline requirements based on age, physiological state, and crisis activity level.

| Demographic Profile | Age / Condition | Baseline Energy (kcal/day) | Protein Target (g/day) | Drinking Water (L/day) | Rehydration Allowance (L/day) | Total Daily Water (L/day) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Infant** | 0 - 12 months | 850 | 15 | 1.0 | 0.5 | 1.5 |
| **Toddler** | 1 - 3 years | 1,200 | 20 | 1.2 | 0.5 | 1.7 |
| **Child (Early)** | 4 - 8 years | 1,600 | 30 | 1.5 | 0.5 | 2.0 |
| **Child (Pre-Teen)** | 9 - 13 years | 2,000 | 45 | 2.0 | 0.8 | 2.8 |
| **Teen Male** | 14 - 18 years | 2,600 | 65 | 2.5 | 1.0 | 3.5 |
| **Teen Female** | 14 - 18 years | 2,200 | 55 | 2.2 | 0.8 | 3.0 |
| **Adult Male (Baseline)** | 19 - 64 years | 2,400 | 65 | 2.5 | 1.0 | 3.5 |
| **Adult Female (Baseline)** | 19 - 64 years | 2,000 | 55 | 2.0 | 1.0 | 3.0 |
| **Senior (65+)** | 65+ years | 1,800 | 55 | 2.0 | 0.8 | 2.8 |
| **Pregnant Mother** | 2nd/3rd Trimester | Baseline + 350 | Baseline + 25 | Baseline + 0.8 | 1.0 | 3.8 |
| **Lactating Mother** | Breastfeeding | Baseline + 500 | Baseline + 25 | Baseline + 1.2 | 1.0 | 4.2 |

### Environmental & Activity Correction Multipliers:
* **Activity Level Multiplier:**
  - Sedentary / Confinement (in shelter): x 1.0
  - Moderate Crisis Labor (hauling supplies, hand milling, patrols): x 1.25
  - Intense Manual Labor (digging, cutting timber, sub-zero clearing): x 1.50
* **Cold Weather Thermal Correction:**
  - Add +100 kcal / person / day for every 5°C that ambient temperature drops below 20°C (down to 0°C).

---

## Table 2: Universal 1-Year Food Supply Target per Adult (LDS & USU Standard)

Baseline benchmark to sustain 1 adult for 365 days (approx. 2,200 kcal/day average):

| Food Commodity Category | Daily Ration (grams/day) | Daily Energy (kcal/day) | Annual Quantity (kg/year) | Annual Quantity (lbs/year) | 5-Gallon Buckets Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Grains (Wheat, Rice, Oats, Pasta)** | 450 g | 1,620 kcal | 165 kg | 365 lbs | 10 - 12 Buckets |
| **Legumes (Beans, Lentils, Peas)** | 75 g | 255 kcal | 27.5 kg | 60 lbs | 2 Buckets |
| **Fats & Cooking Oils** | 35 g | 310 kcal | 13.0 kg (14.5 L) | 28 lbs (4 gal) | 1 Bucket (metal tins) |
| **Sugars & Pure Honey** | 75 g | 290 kcal | 27.5 kg | 60 lbs | 2 Buckets |
| **Non-Fat Dry Milk (Powdered)** | 30 g | 110 kcal | 11.0 kg | 24 lbs | 1 Bucket |
| **Iodized Table Salt** | 10 g | 0 kcal | 4.0 kg | 9 lbs | 0.5 Bucket |
| **Total Annual Baseline:** | **675 g/day** | **2,585 kcal/day** | **248 kg/year** | **546 lbs/year** | **17 - 19 Buckets** |

---

## Table 3: Commodity Profiles (Nutritional Density, Shelf Life & Cooking Fuel)

Used by the Living Calculator to convert inventory weights into days of survival, and audit cooking fuel requirements.

| Commodity | Energy (kcal / 100g) | Protein (g / 100g) | Fat (g / 100g) | Carbs (g / 100g) | Original Pack Lifespan | Mylar + O2 Lifespan | Cooking Water (mL/100g) | Simmer Time (min) | Zero-Cook Ready? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **White Rice (Polished)** | 360 | 7.0 | 0.7 | 80.0 | 18 months | 30 years | 200 mL | 15 - 20 min | No |
| **Hard Red Wheat Berries** | 340 | 13.0 | 2.5 | 71.0 | 24 months | 30+ years | 250 mL | 45 - 60 min | No |
| **Rolled Oats** | 380 | 13.5 | 6.5 | 68.0 | 12 months | 25 years | 200 mL | 5 - 10 min | No (or cold soak 4h) |
| **Pinto / Black Beans** | 340 | 21.0 | 1.2 | 62.0 | 18 months | 25 years | 350 mL | 60 - 90 min | No |
| **Lentils (Dry Brown/Red)** | 350 | 25.0 | 1.0 | 60.0 | 18 months | 25 years | 250 mL | 20 - 30 min | No |
| **Dry Durum Pasta** | 370 | 13.0 | 1.5 | 75.0 | 24 months | 20 years | 300 mL | 10 - 12 min | No |
| **Potato Flakes (Dehydrated)** | 360 | 8.0 | 0.5 | 82.0 | 12 months | 25 years | 300 mL | 1 min (instant) | Yes (with warm water) |
| **Pure Honey** | 304 | 0.3 | 0.0 | 82.0 | Indefinite | Indefinite | 0 mL | 0 min | **Yes** |
| **Granulated Sugar** | 387 | 0.0 | 0.0 | 100.0 | Indefinite | Indefinite | 0 mL | 0 min | **Yes** |
| **Non-Fat Dry Milk** | 360 | 36.0 | 0.8 | 52.0 | 12 months | 20 years | 900 mL | 0 min (instant) | **Yes** |
| **Vegetable / Olive Oil** | 884 | 0.0 | 100.0 | 0.0 | 12 months | 2 years max | 0 mL | 0 min | **Yes** |
| **Peanut Butter** | 590 | 25.0 | 50.0 | 20.0 | 12 months | 2 years max | 0 mL | 0 min | **Yes** |
| **Canned Tuna in Oil** | 200 | 29.0 | 9.0 | 0.0 | 3 - 5 years | N/A | 0 mL | 0 min | **Yes** |
| **Canned Beef / Pork (Spam)** | 315 | 13.0 | 27.0 | 3.0 | 3 - 5 years | N/A | 0 mL | 0 min | **Yes** |
| **Commercial Freeze-Dried Meal** | 450 | 22.0 | 14.0 | 58.0 | 5 years | 25 - 30 years | 250 mL | 10 min (soak) | Yes (cold or hot) |

---

## Table 4: Oxygen Absorber Sizing & Container Displacement

Formula: Required O2 Rating (cc) = (Container Volume in mL - Food Displacement Volume in mL) x 0.21

| Container Type | Gross Volume (mL) | Dense Foods (Rice, Wheat, Beans) Empty Air | Recommended O2 Absorber (Dense) | Aerated Foods (Pasta, Oats, Flakes) Empty Air | Recommended O2 Absorber (Aerated) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1-Quart Mason Jar** | 946 mL | ~400 mL | **100 cc** | ~600 mL | **150 cc** |
| **1-Gallon Mylar Bag** | 3,785 mL | ~1,600 mL | **300 - 500 cc** | ~2,400 mL | **500 cc** |
| **2-Gallon Bucket / Mylar** | 7,570 mL | ~3,200 mL | **700 - 1,000 cc** | ~4,800 mL | **1,000 cc** |
| **5-Gallon Bucket / Mylar** | 18,925 mL | ~8,000 mL | **1,500 - 2,000 cc** | ~12,000 mL | **2,500 cc** |
| **6-Gallon Bucket / Mylar** | 22,710 mL | ~9,500 mL | **2,000 cc** | ~14,500 mL | **3,000 cc** |

---

## Table 5: Cooking Fuel Consumption & Burn Autonomy

Used by the Zero-Cook & Fuel Feasibility Audit to calculate how long stored fuel will support hot meals.

| Fuel Type & Container Size | Total Fuel Weight | Continuous Burn Time (Med Flame) | Standard Cooking Meals (Household of 4) | Thermal Haybox Meals (Household of 4) | Days of Cooking (2 Hot Meals/Day) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Isobutane Camping Canister** | 230 g (8.1 oz) | ~75 minutes | 4 - 5 meals | 12 - 15 meals | 2 - 3 days |
| **Butane Aerosol Canister** | 227 g (8.0 oz) | ~70 minutes | 4 meals | 12 meals | 2 days |
| **1 lb Propane Cylinder** | 453 g (16 oz) | ~120 minutes | 8 meals | 24 meals | 4 days |
| **20 lb BBQ Propane Tank** | 9,070 g (20 lbs) | ~40 hours | 160 meals | 480 meals | 80 days |
| **Solid Fuel Tablet (Hexamine)** | 14 g tablet | ~12 minutes | 1 quick boil | 2 meals | Single use |
