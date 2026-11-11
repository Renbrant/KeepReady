# KeepReady — Global Radio Directory: WebSDR, KiwiSDR & Live AM/FM News Streams

This directory provides pre-configured, one-click streaming presets within KeepReady for **Software-Defined Radio (WebSDR / KiwiSDR)** and **Global AM/FM 24/7 News Web Radios (Direct Audio Streams)**.

---

## 1. 24/7 Global News Web Radios (Direct Streaming Audio)

Pre-loaded audio feeds for real-time situational awareness, civil announcements, and geopolitical crisis monitoring:

### 1.1 International English News Broadcasters
* **BBC World Service (UK / Global):**
  - Scope: The global benchmark for international conflict and crisis reporting.
  - Stream Format: MP3 / AAC direct HTTP stream (`stream.live.vc.bbcmedia.co.uk/bbc_world_service`).
* **NPR 24/7 News (National Public Radio - USA):**
  - Scope: U.S. national emergency broadcasting, FEMA announcements, and federal crisis response.
  - Stream Format: MP3 stream (`npr-ice.streamguys1.com/live.mp3`).
* **Voice of America (VOA News - Global):**
  - Scope: U.S. official international news service covering global disaster zones.
* **CBC Radio One (Canada):**
  - Scope: Public emergency broadcasting for Arctic, North American, and Canadian severe weather/disasters.
* **Deutsche Welle (DW English):**
  - Scope: European continental perspective and international geopolitical analysis.
* **France 24 / RFI English (Radio France Internationale):**
  - Scope: European, African, and Middle Eastern crisis monitoring.
* **NHK World Radio Japan (English):**
  - Scope: Asia-Pacific earthquakes, tsunamis, and typhoon early warnings.

### 1.2 Lusophone / Portuguese News Broadcasters (Brasil, Portugal & África)
* **BBC News Brasil:** Noticiário global em português focado em grandes crises e análises internacionais.
* **RFI em Português (Radio France Internationale):** Cobertura diária em português de eventos geopolíticos europeus e globais.
* **RTP Antena 1 / RDP Internacional (Portugal):** Transmissões de notícias 24h e boletins da proteção civil europeia.
* **Rádio Nacional / EBC (Brasil):** Rede oficial de comunicação e serviços de emergência pública do governo brasileiro.
* **BandNews FM & CBN (Brasil):** Redes jornalísticas comerciais de notícias 24 horas por dia com cobertura em tempo real.

### 1.3 Spanish News Broadcasters (América Latina e Espanha)
* **Radio Nacional de España (RNE Radio 1 / Radio Exterior de España):** Noticiário nacional e internacional em espanhol.
* **BBC Mundo (Espanhol):** Cobertura de crises para toda a América Latina.
* **Caracol Radio & W Radio (Colômbia / América do Sul):** Notícias em tempo real para a região andina e América do Sul.

---

## 2. Global Radio-Browser API Integration (Local AM/FM Directory)

To enable users to listen to any local AM/FM station in their home city anywhere in the world, KeepReady integrates the community-driven **Radio-Browser API**:
* Service: [Radio-Browser.info API](https://www.radio-browser.info/)
* Access: 100% Free, Open Source (Community-maintained database of 45,000+ live stations).
* In-App Functionality: Users can search by country, city, language, or genre (`news`, `talk`, `emergency`) to bookmark their hometown AM/FM emergency radio stations directly inside KeepReady.

---

## 3. High Frequency (HF) WebSDR & KiwiSDR Emergency Presets

Direct WebSocket radio spectrum presets covering remote receiver listening:

| Frequency (MHz) | Mode | Channel Name / Organization | Operational Scope & Details |
| :--- | :--- | :--- | :--- |
| **14.300 MHz** | USB | **Maritime Mobile Service Net (MMSN)** | The world's primary civilian emergency net on 20 meters. Recognized by IARU as the Global Emergency Centre of Activity. Monitored continuously for vessels in distress, medical evacuations, and international emergency relays. |
| **14.325 MHz** | USB | **Hurricane Watch Net (HWN - Daytime)** | Activates whenever a hurricane is within 300 miles of land in the Atlantic, Caribbean, or Gulf of Mexico. Relays ground-truth weather reports directly to the National Hurricane Center (NHC) in Miami. |
| **7.268 MHz** | LSB | **Waterway Net & HWN (Nighttime)** | The 40-meter band counterpart to the Hurricane Watch Net. Engaged when daytime 20m propagation closes after sunset. |
| **7.110 MHz** | LSB | **IARU Region 1 & 3 Disaster Net** | Designated emergency frequency for Europe, Africa, and Asia-Pacific during regional earthquakes, tsunamis, and flood relief operations. |
| **7.060 MHz** | LSB | **IARU Region 2 Emergency Net** | Designated primary emergency channel for the Americas on 40 meters. |
| **3.760 MHz** | LSB | **IARU 80m Nighttime Emergency Net** | Short-to-medium range regional disaster communications during darkness. |
| **21.360 MHz** | USB | **IARU 15m Global Disaster Net** | High-sunspot daytime intercontinental disaster coordination. |

---

## 4. Standard Time & NOAA Space Weather Broadcasts

| Frequency (MHz) | Mode | Station Identifier | Broadcast Schedule & Tactical Intel |
| :--- | :--- | :--- | :--- |
| **5.000 / 10.000 / 15.000 MHz** | AM | **WWV (Colorado) & WWVH (Hawaii)** | NIST atomic time ticks. Voice time announcements every minute. |
| *Space Weather Alert* | Voice | **NOAA Geophysical Alert (via WWV)** | Broadcast **live at :18 past every hour** on WWV frequencies (and :45 past on WWVH). Announces planetary Kp-index, solar radiation storms (S-scale), and geomagnetic storm levels (G1 to G5). |
| **3.330 / 7.850 / 14.670 MHz** | USB | **CHU (Ottawa, Canada - NRC)** | Canadian official bilingual (English/French) time tick standard. |

---

## 5. Strategic Military Communications & Geopolitical Crisis Monitoring

| Frequency (MHz) | Mode | Network Name | Strategic Significance |
| :--- | :--- | :--- | :--- |
| **11.175 MHz** | USB | **USAF HFGCS (Primary 24/7 Global)** | High Frequency Global Communications System operated by the U.S. Air Force. Broadcasts coded **Emergency Action Messages (EAMs)** to airborne command posts and strategic bombers. An influx of EAMs is a primary indicator of sudden geopolitical conflict. |
| **8.992 MHz** | USB | **USAF HFGCS (Nighttime Primary)** | The 8 MHz night-frequency counterpart to 11.175 MHz. |
| **15.016 MHz** | USB | **USAF HFGCS (Daytime Secondary)** | High-frequency daytime long-distance global command traffic. |

---

## 6. International Maritime Distress & Search-and-Rescue (SAR)

| Frequency (MHz) | Mode | Function | Notes |
| :--- | :--- | :--- | :--- |
| **2.182 MHz** | USB | **International Maritime MF Distress** | Primary distress, urgency, and safety frequency for coastal marine vessels. |
| **8.291 MHz** | USB | **ITU / GMDSS Oceanic Distress** | Intercontinental high-frequency maritime search and rescue. |
| **12.290 MHz** | USB | **ITU / GMDSS Oceanic Distress** | Long-range ship-to-shore emergency communications. |
| **5.680 MHz** | USB | **International Aeronautical SAR** | Search and rescue aircraft on-scene coordination. |
