# KeepReady — Visual Identity & Design System Specifications

This document defines the visual language, design tokens, color palette, typography hierarchy, and UI component styling for **KeepReady**, built around an **Instrument-Grade Tactical Minimalism** aesthetic inspired by *MeshCrossway* and *Voxyl*.

---

## 1. Design Philosophy & Aesthetic Pillars

KeepReady merges professional tactical instrument reliability with warm, approachable family ergonomics:

1. **Dark-First Architecture:** Optimized for OLED power savings during prolonged grid outages and low-light eye comfort in dark rooms or shelters. Full high-contrast Light Theme support is included for direct outdoor sunlight readability.
2. **High Information Density with Breathing Room:** Information is grouped into modular, crisp cards with generous internal padding and micro-spacers, avoiding visual fatigue.
3. **Instrument-Grade Precision:** Numeric figures (calories, days of water, countdown timers, GPS coordinates, frequencies, and voltages) use dedicated tabular monospace fonts to prevent layout jitter on live updates.
4. **Subtle Tactility over Skewmorphism:** Flat, clean surfaces defined by subtle 1px translucent borders (`rgba(255, 255, 255, 0.08)`) and muted slate backdrops rather than heavy, blurred shadows.

---

## 2. Color System & Semantic Tokens

### 2.1 Core Surfaces & Backgrounds
* **Background Deep (App Canvas):** `#0B0E14` (Deep obsidian slate, near-black for maximum OLED battery savings).
* **Surface Layer 1 (Cards, Modals & Sidebars):** `#141A24` (Subtle elevated charcoal-slate).
* **Surface Layer 2 (Nested Buckets, Bins, Inputs):** `#1D2433` (Distinct interactive containers).
* **Surface Layer 3 (Active Hover / Pressed States):** `#273144`.
* **Border Subdued (1px Dividers & Outlines):** `#2A3447` or `rgba(255, 255, 255, 0.08)`.

### 2.2 Brand & Functional Accents
* **Brand Primary (Preparedness Gold / Amber):** `#F59E0B` (Vibrant warm amber: signifies readiness, civil defense awareness, and warmth without inducing panic).
* **Brand Primary Hover / Glow:** `#D97706`.

### 2.3 Tactical Status Indicators (High Contrast)
* **Success / Ready / Cloud Online:** `#10B981` (Tactical Emerald Green).
* **Warning / Expiring / Low Stock / Standby:** `#F59E0B` (Safety Amber).
* **Danger / Critical Bottleneck / Expired / SOS:** `#EF4444` (Alert Crimson).
* **Comms / LoRa Mesh / Radio Bridge:** `#06B6D4` (Tactical Cyan / Radio Blue).
* **Neutral / Inactive / Offline:** `#64748B` (Muted Slate).

### 2.4 Typography Color Hierarchy
* **Text Primary (Headings, Primary Values):** `#F8FAFC` (Pure crisp off-white, 100% contrast).
* **Text Secondary (Labels, Metadata, Units):** `#94A3B8` (Soft muted slate).
* **Text Tertiary / Disabled:** `#64748B` (Darker neutral for secondary hints).

---

## 3. Typography Architecture

* **Primary UI & Headings:** `Inter`, `SF Pro Display`, or system default modern sans-serif.
  - Weight scale: Regular (400), Medium (500), SemiBold (600), Bold (700).
  - Used for module titles, action buttons, descriptions, and guide text.
* **Telemetry & Numeric Figures:** `JetBrains Mono`, `Roboto Mono`, or tabular monospace.
  - Used for days of food, days of water, Readiness Score percentage, lot numbers, expiration dates, MGRS/GPS coordinates, and LoRa SNR/RSSI metrics.
  - Ensures clean column alignment across all data tables and dashboards.

---

## 4. Component Anatomy & Layout Rules

### 4.1 Card & Container Shapes
* Border Radius:
  - Micro (Badges, Pills, Buttons): `6px` to `8px`.
  - Standard (Cards, Containers, Bins, Charts): `12px`.
  - Large (Bottom Sheets, Full Modals, Dialogs): `16px`.
* Borders:
  - Universal 1px solid `#2A3447` outline around all interactive cards, separating elements clearly without reliance on background tinting.

### 4.2 Status Pills & Live Badges
* Compact rounded badges with a leading illuminated LED dot:
  - `● 100% READY` (Green fill + emerald text).
  - `● 14 DAYS WATER` (Amber fill + amber text).
  - `● LORA MESH ACTIVE` (Cyan fill + cyan text).

### 4.3 Gauge & Metric Presentation
* Prominent circular progress rings and horizontal fill gauges:
  - Outer track: Deep translucent slate (`rgba(255, 255, 255, 0.05)`).
  - Active fill: Solid, ungradiented tactical color corresponding to status (Green, Amber, or Crimson).
  - Center: Monospace large metric with small uppercase label beneath (e.g., "94 DAYS / CALORIES").

### 4.4 Smart Bin QR & Tag Layout
* Physical container print labels:
  - High-contrast pure black and white QR codes framed in dark slate styling for screen preview, with standard inverted monochrome printing support.
  - Monospace bold container identifiers: `[BIN-04-GARAGE]`.

---

## 5. Light Theme (Sunlight Outdoor Mode)

While KeepReady defaults to the tactical dark aesthetic, outdoor field use under harsh midday sun requires high-reflectance rendering:
* Background: `#F8FAFC` (Clean off-white).
* Card Surface: `#FFFFFF` with 1px border `#E2E8F0`.
* Text Primary: `#0F172A` (Deepest navy slate).
* Accents maintain their semantic hue with calibrated saturation to preserve WCAG AAA accessibility.
