# KeepReady — Emergency Communications Equipment, Hardware & RF Catalog

This document provides a comprehensive hardware specification, antenna tuning guide, power requirements, and purchasing considerations for off-grid crisis telecommunications.

---

## 1. LoRa Mesh Hardware Nodes (Meshtastic & MeshCore)

LoRa (Long Range) operates on unlicensed ISM radio bands (Sub-GHz), transmitting low-bandwidth digital packets across peer-to-peer mesh networks without cell towers or internet.

### 1.1 Recommended Hardware Platforms
* Seeed Studio XIAO ESP32-S3 + Wio-SX1262:
  - Micro form-factor, dual-core processing, ultra-compact for pocket and EDC kits.
* Heltec WiFi LoRa 32 (V3) / Capsule Sensor:
  - ESP32-S3 platform with built-in 0.96-inch OLED screen, USB-C, and integrated battery charging circuitry. Low entry cost.
* LILYGO T-Echo & T-Beam (nRF52840 / ESP32):
  - T-Echo features the ultra-low-power Nordic nRF52840 chip and an E-Ink daylight-readable screen. Idle battery consumption is only 10 to 15 mA (runs for days on a single 18650 cell).
  - T-Beam features a built-in GPS/GNSS receiver (NEO-6M / M8N) for automatic location beaconing.
* RAK Wireless WisBlock (RAK4631):
  - Modular, industrial-grade reliability. Best choice for permanent solar-powered hilltop repeaters due to micro-ampere deep sleep currents.

### 1.2 Frequency Bands by Global Region
* North America / Latin America: 902 - 928 MHz (Standard: 915 MHz).
* Europe / UK / Africa: 863 - 870 MHz (Standard: 868 MHz).
* Asia / Global Emergency: 433 MHz.

### 1.3 Antenna Selection & RF Performance
Stock rubber-duck antennas shipped with cheap dev boards are notoriously detuned, wasting up to 70% of transmit power.
* Portable Antennas: Flexible tuned whip antennas (e.g., Gizont 915 MHz, PulseLarsen).
* Base Station & Roof Antennas: 5.8 dBi or 8.0 dBi fiberglass collinear omnidirectional antennas mounted on roof masts.
* Critical RF Rule: Never transmit without an antenna connected (reflected energy permanently burns out the SX1262 power amplifier). Keep VSWR (Voltage Standing Wave Ratio) below 1.5:1.

### 1.4 Power & Solar Node Engineering
* Node Roles:
  - Handheld Client: Connected to phone via BLE (1,000 to 3,000 mAh Li-Po battery).
  - Solar Router / Repeater: Deployed high in trees, attics, or rooftops to bounce family packets across terrain obstacles.
* Solar Repeater Spec: 5W to 10W monocrystalline solar panel + 2x 18650 or 1x 21700 LiFePO4 battery cells with MPPT charge controller (survives 7 continuous days of cloudy winter weather).

---

## 2. Handheld Analog Two-Way Radios (Walkie-Talkies & Transceivers)

### 2.1 Radio Service Categories
* FRS (Family Radio Service):
  - License-free in the US/Americas. 0.5W to 2W power on 22 UHF channels (462/467 MHz). Real-world range: 0.5 to 1.5 miles in suburban terrain.
* GMRS (General Mobile Radio Service):
  - Up to 5W on handhelds and 50W on vehicle/base stations. Repeater-capable (allows bouncing signals through high-altitude repeater towers across 10 to 30 miles). Requires simple, non-test family license in the US.
* MURS (Multi-Use Radio Service):
  - License-free 2W on 5 VHF frequencies (151 - 154 MHz). VHF waves penetrate dense forest foliage, brush, and rural terrain significantly better than UHF.
* PMR446:
  - License-free European standard (0.5W UHF, 446 MHz).
* Dual-Band VHF/UHF Transceivers (e.g., Baofeng UV-5R, Quansheng, Yaesu FT-65):
  - Versatile, low-cost radios covering 136-174 MHz (VHF) and 400-480 MHz (UHF). Capable of monitoring NOAA weather, local police/fire dispatch (analog), and transmitting across emergency frequencies.

### 2.2 Aftermarket Tactical Antenna Upgrades
* Nagoya NA-771 (15.6 inch whip): Doubles real-world transmit and receive range compared to stock short antennas.
* Super-Elastic Signal Stick: Indestructible titanium-alloy spring wire whip for bug-out bags.
* Directional Tape-Measure Yagi: Simple DIY 3-element directional antenna built from PVC pipe and a steel tape measure, delivering +6 dBi to +9 dBi directional gain to reach distant repeaters during grid down.

---

## 3. Emergency Broadcast Receivers (All-Band Intelligence Gathering)

In an acute emergency, one-way information reception is your primary defense against military movements, evacuation orders, and nuclear fallout plumes.

### Essential Specifications for Emergency Radios:
* Quad-Power Capabilities:
  1. Internal USB rechargeable Lithium battery.
  2. Hand-crank dynamo generator.
  3. Integrated solar panel on top surface.
  4. AA or AAA alkaline dry cell backup compartment.
* Band Coverage:
  - AM (Medium Wave): Long-distance regional broadcasts, especially at night.
  - FM: High-fidelity local civil defense and emergency broadcasts.
  - Shortwave (SW - 2.3 to 22 MHz): Global international news from outside the disaster zone.
  - NOAA Weather Radio (7 channels with S.A.M.E. alert decoding).

---

## 4. Satellite Communicators (Primary/Contingency Bridge)

* Devices: Garmin inReach (Mini 2 / Messenger), ZOLEO, Bivy Stick, Apple Satellite SOS.
* Network: Iridium low-earth-orbit constellation (100% global pole-to-pole coverage).
* Tactical Integration: Used for inter-city long-distance check-ins with out-of-state emergency contacts when national cell networks and regional power grids are dead.
