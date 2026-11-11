# KeepReady — Emergency Communications (PACE) & Offline Tactical Mapping

This document details the resilient crisis communication architecture, off-grid LoRa mesh integration (Meshtastic and MeshCore), and the downloadable offline vector mapping engine for **KeepReady**.

---

## 1. The PACE Emergency Communications Framework

In catastrophe and grid-down scenarios, telecommunications fail in predictable stages. KeepReady structures family and group communications following the U.S. CISA PACE methodology:

### Primary (P) — Cloud Encrypted Messaging
* Transport: High-speed HTTPS and WebSockets via Supabase Realtime.
* Network: Active cellular (4G/5G) or residential Wi-Fi.
* Capabilities: Instant text, delivery confirmations, read receipts, and end-to-end encryption.
* Transition Rule: When the app detects loss of internet for more than 45 seconds, it automatically engages the Alternate or Contingency layer.

### Alternate (A) — Local LAN & SMS Contingency
* Transport: Standard cellular SMS and Local Wi-Fi Peer-to-Peer.
* Network: Local battery-backed home router (LAN multicast/mDNS) even when the external internet service provider (ISP) line is severed.
* Capabilities: Synchronizes family status across devices connected to the same local home network or via direct SMS fallbacks.

### Contingency (C) — Off-Grid LoRa Mesh Networks (Meshtastic & MeshCore)
* Transport: Bluetooth Low Energy (BLE) connection from the smartphone to a paired LoRa radio node (915 MHz, 868 MHz, or 433 MHz).
* Supported Hardware: Standard commercial nodes (Heltec V3, LILYGO T-Beam, RAK Wireless WisBlock, nRF52/ESP32).
* Decoupled Setup: Users configure complex radio settings (frequencies, modem presets, antennas) in native Meshtastic/MeshCore apps once. KeepReady interfaces as a clean family chat UI.
* Automated Family Channel: Utilizes a shared private AES-256 encryption key. Family packets hop across public community mesh repeaters without exposing plaintext messages or locations.
* Bandwidth-Optimized Packets: Ultra-compact byte structures for status pings ("Safe", "Need Help", "At Rendezvous Point") and GPS location beacons.

### Emergency (E) — Analog Two-Way Radio Protocols (Voice)
* Transport: Handheld UHF/VHF transceivers (FRS, GMRS, MURS, PMR446, Ham Radio).
* The 3-3-3 Radio Schedule: Pre-programmed reference guide instructing family members to turn on radios on Channel 3 every 3 hours for 3 minutes to conserve battery while maintaining scheduled contact windows.
* In-App Frequency Guide: Built-in offline directory of national emergency calling frequencies and repeater protocols.

---

## 2. Offline Vector Mapping & Tactical Navigation Engine

During severe emergencies, cloud map servers (Google Maps, Apple Maps) become inaccessible. KeepReady embeds an offline-first geospatial engine.

### 2.1 Downloadable Regional Map Packs
* Technology: Compact vector tile architecture (MapLibre / MBTiles format based on OpenStreetMap data).
* Storage Footprint: High compression allowing entire states, provinces, or travel corridors to be stored in 50 MB to 200 MB of local phone storage.
* Download Manager: Allows users to pre-download regional base maps, topographic elevation contours, and road networks while on Wi-Fi before disasters strike.

### 2.2 Tactical Overlays & Emergency Points of Interest (POIs)
Users can pin, customize, and store private tactical points on the offline map:
* Storage Caches: Specific coordinates of secondary supplies, buried caches, water wells, and bug-out cabins.
* Infrastructure Shutoffs: Water mains, electrical breaker panels, and residential natural gas shutoff valves.
* Family Rendezvous Points: Designated Primary, Secondary, and Tertiary meeting locations with pre-calculated distances from the home.
* Evacuation Routes: Primary and secondary egress routes avoiding low-lying flood zones and choke points.

### 2.3 Live Family Beaconing on Offline Maps
* Dual-Route Beaconing: Receives family member GPS coordinates via Cloud (when online) or LoRa Mesh packets (when off-grid).
* Real-Time Plotting: Displays family pins on the downloaded vector map with timestamped freshness indicators.
* Tactical Directional Compass: Shows bearing and direct distance (e.g., "Sarah: 2.4 km North-East | Battery 68% | 4 min ago").

### 2.4 Offline Navigation & Grid Coordinates
* 100% Sensor Autonomy: Operates using the phone's internal hardware GPS sensor, compass, and accelerometer without cellular towers or data signal.
* Coordinate Support: Standard Latitude/Longitude, MGRS (Military Grid Reference System), and UTM coordinates.
