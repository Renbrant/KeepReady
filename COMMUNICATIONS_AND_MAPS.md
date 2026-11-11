# KeepReady — Emergency Communications (PACE), SDR Intelligence & Offline Mapping

This document details the crisis telecommunications architecture, off-grid LoRa mesh networks (Meshtastic and MeshCore), Software-Defined Radio (WebSDR, KiwiSDR, and RTL-SDR), and the offline vector mapping engine for **KeepReady**.

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
* Network: Local battery-backed home router (LAN multicast/mDNS) even when external internet is severed.
* Capabilities: Synchronizes family status across devices connected to the same local home network or via direct SMS fallbacks.

### Contingency (C) — Off-Grid LoRa Mesh Networks (Meshtastic & MeshCore)
* Transport: Bluetooth Low Energy (BLE) connection from the smartphone to a paired LoRa radio node (915 MHz, 868 MHz, or 433 MHz).
* Supported Hardware: Standard commercial nodes (Heltec V3, LILYGO T-Beam, RAK Wireless WisBlock, nRF52/ESP32).
* Decoupled Setup: Users configure complex radio settings in native Meshtastic/MeshCore apps once. KeepReady interfaces as a clean family chat UI.
* Automated Family Channel: Utilizes a shared private AES-256 encryption key. Family packets hop across public community repeaters without exposing plaintext messages or locations.
* Bandwidth-Optimized Packets: Ultra-compact byte structures for status pings ("Safe", "Need Help", "At Rendezvous Point") and GPS location beacons.

### Emergency (E) — Analog Two-Way Radio Protocols (Voice)
* Transport: Handheld UHF/VHF transceivers (FRS, GMRS, MURS, PMR446, Ham Radio).
* The 3-3-3 Radio Schedule: Turn on radio on Channel 3 every 3 hours for 3 minutes to conserve battery while maintaining scheduled contact windows.
* In-App Frequency Guide: Built-in offline directory of national emergency calling frequencies and repeater protocols.

---

## 2. Software-Defined Radio (SDR) Intelligence & Emergency Monitoring

KeepReady integrates dual-mode Software-Defined Radio listening capabilities for intelligence gathering, civil defense alerts, and search-and-rescue:

### 2.1 Remote WebSDR & KiwiSDR Streaming (Connected Mode)
* Architecture: Connects directly via WebSocket JSON protocols to hundreds of globally distributed KiwiSDR and WebSDR receivers.
* Curated Emergency Directory: Pre-filtered 1-click bookmarks to critical HF emergency channels without requiring external antennas:
  - 14.300 MHz: Global Maritime Mobile Service Net (marine emergencies, hurricane tracking).
  - 7.055 / 7.110 MHz: Regional Amateur Radio Emergency Service (ARES) nets.
  - 5.000 / 10.000 / 15.000 MHz (WWV / CHU): Atomic time synchronization and solar storm forecasts.
  - International Shortwave Broadcasters (BBC World Service, Voice of America).
* Spectrum & Waterfall Display: In-app real-time waterfall display allowing users to visually spot active radio signals across the HF spectrum.

### 2.2 Local USB-OTG RTL-SDR Receiver (100% Offline Grid-Down Mode)
* Architecture: Native USB-OTG connection from an Android smartphone to an inexpensive RTL-SDR dongle (RTL2832U chip / v4 tuner) using the Flutter `core_rtlsdr` driver engine.
* True Air-Gap Reception: Operates with zero internet, zero cellular towers, and zero cloud dependencies.
* Receivable Over-The-Air Bands (24 MHz to 1.7 GHz):
  - NOAA Weather Radio (162.400 to 162.550 MHz with automated alert tone detection).
  - Local FM broadcast stations for civil emergency announcements.
  - VHF Marine & Aviation emergency hailing frequencies (121.5 MHz / 156.8 MHz Channel 16).
  - Local unencrypted analog emergency service dispatch.

---

## 3. Offline Vector Mapping & Tactical Navigation Engine

During severe emergencies, cloud map servers become inaccessible. KeepReady embeds an offline-first geospatial engine.

### 3.1 Downloadable Regional Map Packs
* Technology: Compact vector tile architecture (MapLibre / MBTiles format based on OpenStreetMap data).
* Storage Footprint: High compression allowing entire states, provinces, or travel corridors to be stored in 50 MB to 200 MB of local phone storage.
* Download Manager: Allows users to pre-download regional base maps, topographic elevation contours, and road networks while on Wi-Fi before disasters strike.

### 3.2 Tactical Overlays & Emergency Points of Interest (POIs)
Users can pin, customize, and store private tactical points on the offline map:
* Storage Caches: Specific coordinates of secondary supplies, buried caches, water wells, and bug-out cabins.
* Infrastructure Shutoffs: Water mains, electrical breaker panels, and residential natural gas shutoff valves.
* Family Rendezvous Points: Designated Primary, Secondary, and Tertiary meeting locations with pre-calculated distances from the home.
* Evacuation Routes: Primary and secondary egress routes avoiding low-lying flood zones and choke points.

### 3.3 Live Family Beaconing on Offline Maps
* Dual-Route Beaconing: Receives family member GPS coordinates via Cloud (when online) or LoRa Mesh packets (when off-grid).
* Real-Time Plotting: Displays family pins on the downloaded vector map with timestamped freshness indicators.
* Tactical Directional Compass: Shows bearing and direct distance (e.g., "Sarah: 2.4 km North-East | Battery 68% | 4 min ago").

### 3.4 Offline Navigation & Grid Coordinates
* 100% Sensor Autonomy: Operates using the phone's internal hardware GPS sensor, compass, and accelerometer without cellular towers or data signal.
* Coordinate Support: Standard Latitude/Longitude, MGRS (Military Grid Reference System), and UTM coordinates.
