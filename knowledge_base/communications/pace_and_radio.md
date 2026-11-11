# KeepReady — Operational PACE Plan, Frequencies & Radio Protocols

This document details the standardized communication procedures, frequency channels, brevity codes, and radio protocols used to coordinate family and group movements during civil disruptions and grid collapse.

---

## 1. The Operational PACE Plan Architecture

The CISA PACE model provides mandatory redundancy so that no single infrastructure failure silences the household:

| Layer | Protocol & Hardware | Range / Reach | Infrastructure Dependency | Use-Case Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **P — Primary** | KeepReady Cloud / WebSockets / LTE | Global | Cellular Towers, Internet ISP, Power Grid | Day-to-day operations and initial crisis warnings. |
| **A — Alternate** | Direct SMS / Local Wi-Fi Mesh LAN | Local / Regional | Local battery router or degraded cell tower | Fiber internet cut, but cell voice/SMS or local Wi-Fi active. |
| **C — Contingency** | LoRa Mesh (Meshtastic / MeshCore via BLE) | 3 - 15 km (Multi-hop) | **Zero (100% Off-Grid)** | Complete grid collapse, cellular blackout, internet blackout. |
| **E — Emergency** | Handheld Analog VHF/UHF Transceivers | 1 - 5 km (Simplex) | **Zero (100% Off-Grid)** | Immediate tactical tactical contact, search-and-rescue, visual SOS. |

---

## 2. Standard Prepper & Emergency Radio Frequencies

Program these exact frequencies into all household transceivers before emergencies occur:

### 2.1 The Standard 3-3-3 Radio Protocol Channels
* FRS / GMRS Channel 3: **462.6125 MHz** (No CTCSS / DCS privacy tones — Carrier Squelch).
* MURS Channel 3: **151.940 MHz** (High penetration in dense rural and wooded terrain).
* PMR446 (Europe) Channel 3: **446.03125 MHz**.
* Amateur Radio 2m National Simplex Calling: **146.520 MHz** (VHF).
* Amateur Radio 70cm National Simplex Calling: **446.000 MHz** (UHF).

### 2.2 NOAA Weather Radio Broadcast Frequencies
* Channel 1: 162.400 MHz
* Channel 2: 162.425 MHz
* Channel 3: 162.450 MHz
* Channel 4: 162.475 MHz
* Channel 5: 162.500 MHz
* Channel 6: 162.525 MHz
* Channel 7: 162.550 MHz

---

## 3. Radio Discipline, Brevity & EMCON (Emission Control)

In hostile scenarios, social unrest, or military patrol environments, transmitting over radio broadcasts your physical location via RF direction finding (triangulation):

### Radio Rules of Engagement:
1. Listen Before You Speak: Always monitor the channel for 30 seconds before transmitting to avoid breaking into active emergency traffic.
2. The 3-3-3 Protocol Discipline: Transmit only on Channel 3 every 3 hours for exactly 3 minutes. Keep radios switched OFF between windows to eliminate RF signature and conserve battery.
3. Think, Key, Speak: Plan your transmission in your head before keying the Push-To-Talk (PTT) button. Keep transmissions under 10 seconds.
4. NATO Phonetic Alphabet: Use standard phonetics (Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliett, Kilo, Lima, Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu) to spell names, coordinates, and license plates.
5. Standard Brevity Codes:
   - "ROGER": Message received and understood.
   - "SAY AGAIN": Repeat your last transmission.
   - "WAIT OUT": I have heard you, standby for my response (do not reply).
   - "SITREP": Situation Report (requesting status, position, and needs).
   - "WILCO": Will Comply (I understand and will execute the instruction).
