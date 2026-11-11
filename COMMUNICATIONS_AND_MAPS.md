# KeepReady — Emergency Communications (PACE), SDR Intelligence & Offline Mapping

This document details the crisis telecommunications architecture, off-grid LoRa mesh networks (Meshtastic and MeshCore), Software-Defined Radio (WebSDR, KiwiSDR, and local USB-OTG RTL-SDR tuning), licensing regulatory frameworks, and the offline vector mapping engine for **KeepReady**.

---

## 1. Regulatory Compliance, Licensing & The Freedom to Listen

Operating radio transceivers requires a clear understanding of international telecommunications law (governed by the ITU globally, the FCC in the United States, Anatel in Brazil, and Ofcom in the UK):

### 1.1 The Universal Right to Listen (No License Required)
* **100% Free & Legal Worldwide:** Receiving, listening to, and monitoring radio frequencies (known as Shortwave Listening / SWL or Scanner Monitoring) requires **NO license, permit, or certification**.
* Anyone can legally use WebSDR, KiwiSDR, or a physical USB-OTG RTL-SDR dongle to monitor amateur radio bands, commercial broadcasts, aviation tower chatter, marine channels, and civil defense alerts without registering with any government body.

### 1.2 Transmission Licensing Requirements (Amateur Radio / Ham Radio)
* **Certification Mandatory for Transmit:** Transmitting radio signals on amateur radio frequencies (e.g., VHF 144–148 MHz, UHF 420–450 MHz, and HF 80m/40m/20m bands) **strictly requires an official government-issued Amateur Radio License** and an assigned callsign.
* Transmitting without an amateur radio license in non-emergency conditions is a federal violation subject to equipment confiscation, heavy fines, and criminal penalties.
* How to Get Certified: Obtaining an entry-level license (e.g., FCC Technician Class in the U.S. or Anatel Classe C in Brazil) requires passing a straightforward 35-question multiple-choice exam covering basic electrical safety, operating rules, and radio etiquette (no Morse code requirement).

### 1.3 License-Free & Simplified Transmission Bands for Families
For routine family communications without taking technical government exams:
* **FRS (Family Radio Service - Americas):** License-free handheld UHF radios (channels 1–22, up to 2W).
* **MURS (Multi-Use Radio Service - USA):** License-free VHF frequencies (151–154 MHz, 2W), superior in dense wooded terrain.
* **PMR446 (Europe / UK):** License-free UHF frequencies (446 MHz, 0.5W).
* **CB Radio (Citizens Band / Faixa do Cidadão - 27 MHz):** License-free 4W AM/12W SSB voice communications for vehicles and base stations.
* **GMRS (General Mobile Radio Service - USA):** Higher power (up to 50W) and repeater-capable, requiring a simple family license issued upon payment of an FCC fee without technical examination.
* **ISM LoRa Bands (Meshtastic / MeshCore - 915 MHz / 868 MHz / 433 MHz):** Unlicensed digital spread-spectrum packet communications operating within legal power limits (typically under 1 Watt EIRP).

### 1.4 The Extreme Emergency Life-Safety Exception (FCC Part 97.403 / ITU Standard)
Under international radio regulations and U.S. federal law (47 CFR § 97.403):
* In a situation where there is an **immediate and grave threat to human life or property**, and when no other means of telecommunication are available, **anyone is legally permitted to transmit on any frequency** to summon life-saving assistance or broadcast emergency distress traffic.
* Important Caveat: This legal defense applies solely during genuine, imminent life-or-death emergencies. Preparing and training with your equipment beforehand strictly requires staying within license-free bands or obtaining an amateur radio license.

---

## 2. The PACE Emergency Communications Framework

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

## 3. Software-Defined Radio (SDR) Intelligence & Wideband Spectrum Receiver

KeepReady transforms the smartphone into a high-grade signal intelligence (SIGINT) receiver, providing both remote cloud SDR listening and autonomous, off-grid over-the-air spectrum tuning:

### 3.1 Local USB-OTG RTL-SDR Tuner (100% Offline / Wideband Autonomous Receiver)
When all cellular towers, internet lines, and electrical grids collapse, KeepReady allows users to plug an inexpensive USB SDR dongle (e.g., RTL-SDR v4, HackRF One, or Nooelec NESDR) directly into the smartphone's USB-C port via a standard USB-OTG cable:
* Architecture: Native USB communication powered directly by the phone's internal battery (~280 mA draw), utilizing the Flutter `core_rtlsdr` DSP engine (running native C/C++ FFI demodulators).
* Zero-Infrastructure Dependency: Operates completely air-gapped without internet, Wi-Fi, or cellular network access, capturing physical electromagnetic radio waves directly through an attached portable antenna.
* Continuous Wideband Tuning Range: 500 kHz to 1.766 GHz (covers HF, VHF, and UHF).
* Tunable Spectrum & Demodulation Modes:
  - AM (Amplitude Modulation): AM broadcast band (530-1700 kHz), international shortwave, and Aviation Tower/Airband (118-137 MHz).
  - WFM (Wideband FM with stereo & RDS): Commercial broadcast FM stations (88-108 MHz) for local government emergency decrees.
  - NFM (Narrowband FM): Citizen walkie-talkies (FRS, GMRS, MURS, PMR446), marine radio (VHF Ch 16 @ 156.8 MHz), and amateur radio repeaters (144-148 MHz and 420-450 MHz).
  - USB / LSB (Single Sideband): Long-distance high-frequency disaster nets (14.300 MHz MMSN, 7.268 MHz HWN) and military strategic communications.
  - CW (Continuous Wave / Morse Code).
* Visual Real-Time Waterfall Scope: Displays a live graphical RF waterfall and spectrum analyzer, allowing users to visually spot active radio signals and transmissions across the band without knowing the exact frequency in advance.
* ADS-B Aircraft Tracking (1090 MHz): Decodes unencrypted transponder beacons from commercial and emergency aircraft flying overhead, plotting their altitude, speed, and heading live on KeepReady's offline map without internet!

### 3.2 Remote WebSDR & KiwiSDR Streaming (Connected / Satellite Mode)
When internet, Starlink, or local Wi-Fi connectivity is present:
* Direct WebSocket Audio Stream: Connects to hundreds of public, distributed WebSDR and KiwiSDR stations globally without opening third-party web browsers.
* Pre-Configured Emergency Bookmarks: 1-click tuning to 14.300 MHz (MMSN), 14.325 MHz (Hurricane Watch Net), WWV Solar Storm alerts, and USAF 11.175 MHz HFGCS strategic monitoring.
* Global 24/7 News Audio: Direct streaming presets for BBC World Service, NPR, VOA, RFI, and integration with the community Radio-Browser API (45,000+ local AM/FM stations worldwide).

---

## 4. Offline Vector Mapping & Tactical Navigation Engine

During severe emergencies, cloud map servers become inaccessible. KeepReady embeds an offline-first geospatial engine.

### 4.1 Downloadable Regional Map Packs
* Technology: Compact vector tile architecture (MapLibre / MBTiles format based on OpenStreetMap data).
* Storage Footprint: High compression allowing entire states, provinces, or travel corridors to be stored in 50 MB to 200 MB of local phone storage.
* Download Manager: Allows users to pre-download regional base maps, topographic elevation contours, and road networks while on Wi-Fi before disasters strike.

### 4.2 Tactical Overlays & Emergency Points of Interest (POIs)
Users can pin, customize, and store private tactical points on the offline map:
* Storage Caches: Specific coordinates of secondary supplies, buried caches, water wells, and bug-out cabins.
* Infrastructure Shutoffs: Water mains, electrical breaker panels, and residential natural gas shutoff valves.
* Family Rendezvous Points: Designated Primary, Secondary, and Tertiary meeting locations with pre-calculated distances from the home.
* Evacuation Routes: Primary and secondary egress routes avoiding low-lying flood zones and choke points.

### 4.3 Live Family Beaconing on Offline Maps
* Dual-Route Beaconing: Receives family member GPS coordinates via Cloud (when online) or LoRa Mesh packets (when off-grid).
* Real-Time Plotting: Displays family pins on the downloaded vector map with timestamped freshness indicators.
* Tactical Directional Compass: Shows bearing and direct distance (e.g., "Sarah: 2.4 km North-East | Battery 68% | 4 min ago").

### 4.4 Offline Navigation & Grid Coordinates
* 100% Sensor Autonomy: Operates using the phone's internal hardware GPS sensor, compass, and accelerometer without cellular towers or data signal.
* Coordinate Support: Standard Latitude/Longitude, MGRS (Military Grid Reference System), and UTM coordinates.
