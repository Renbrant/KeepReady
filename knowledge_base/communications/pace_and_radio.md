# Knowledge Base: Emergency PACE Communications & LoRa Mesh

## 1. The CISA PACE Plan Framework

* Primary (P): Cloud messaging (Supabase Realtime WebSockets over 4G/5G/Wi-Fi).
* Alternate (A): Direct cellular SMS and local battery-powered Wi-Fi LAN multicast.
* Contingency (C): Off-grid LoRa Mesh via Bluetooth LE connection to Meshtastic or MeshCore nodes.
* Emergency (E): Handheld analog two-way radios (FRS, GMRS, VHF/UHF) with standardized hailing schedules.

---

## 2. The 3-3-3 Radio Protocol

Standard operating procedure for family and group analog radio contact during long-term power outages:
* Frequency: Turn on radio on Channel 3 (FRS/GMRS/MURS).
* Schedule: Every 3 hours (03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00, 24:00 local time).
* Duration: Transmit/listen for exactly 3 minutes, then turn radio OFF to preserve battery.

---

## 3. LoRa Mesh Packet Optimization (Meshtastic / MeshCore)

LoRa transmission rates are narrow-band (approx. 0.3 to 5.4 kbps). KeepReady packet formatting rules:
* Byte Minimization: Keep text transmissions under 140 bytes per packet.
* High-Priority Status Codes (1-byte telemetry headers):
  - 0x01: Safe / At Shelter
  - 0x02: En Route to Meeting Point
  - 0x03: Need Immediate Assistance / SOS
  - 0x04: Battery Low (<20%)
* GPS Coordinates: Transmit in compressed delta integer format (micro-degrees) rather than raw floating-point strings.
