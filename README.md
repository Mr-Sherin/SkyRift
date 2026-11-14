# SkyRift: Mission Control
## NASA Space Apps Challenge 2026 Edition

> **"Design the mission. Own every decision. Reach beyond."**

SkyRift is a browser-based, mathematically grounded space mission design and flight operations game. Players assume the role of mission designers balancing interconnected engineering trade-offs: every added instrument alters mass, electrical power draw, inverse-square solar attenuation, Tsiolkovsky $\Delta v$, Deep Space Network communications lag, and monetary grants.

---

## 🚀 Key Features

1. **Law of Coupled Constraints (Physics Engine)**
   - **Tsiolkovsky Rocket Equation:** Dry mass vs. propellant mass fraction, specific impulse ($I_{sp}$), and exact $\Delta v$ expenditure calculations.
   - **Inverse-Square Law for Power:** Distance attenuation ($1/r^2$) showing why Mars produces only 43% of solar power compared to Earth, forcing deep-space missions to switch to RTGs.
   - **Deep Space Network (DSN) Latency & Data Budget:** Accurate one-way light-time latency ($t = d/c$) and onboard solid-state storage overflow mechanics.

2. **The 8 Authentic Spacecraft Subsystems**
   - Structure & Bus
   - Electrical Power Systems (EPS)
   - Propulsion & Tanks
   - Deep Space Communications
   - Guidance, Navigation & Control (GNC)
   - Thermal Control Systems (TCS)
   - Command & Data Handling (C&DH)
   - Scientific Payloads (Radar, Multispectral, Spectrometers, Magnetometers)

3. **4 Playable NASA Mission Scenarios**
   - **Orbital Sentinel:** Low Earth Orbit (LEO) Sun-Synchronous disaster monitoring.
   - **Artemis Surveyor:** Trans-Lunar Injection (TLI) and crater water-ice prospecting.
   - **Red Frontier:** 7-month heliocentric transfer to Mars with severe solar loss and 20-minute light-lag.
   - **Deep Primitive:** Autonomous asteroid rendezvous utilizing high-efficiency ion propulsion.

4. **Multi-Stage Launch & Telemetry Operations**
   - Real-time countdown terminal with engine throttle, Max-Q tracking, staging, and orbit injection.
   - In-flight anomaly response tree (Coronal Mass Ejections, Reaction Wheel Saturation, Transmitter Thermal Alarms).
   - Speed controls ($1\times, 5\times, 20\times$, Pause) and real-time battery SoC vs. eclipse simulation.

5. **100-Point Transparent Scoring & Debrief**
   - Detailed breakdown across Science (35 pts), Trajectory (20 pts), DSN Downlink (15 pts), Subsystem Health (10 pts), Budget (10 pts), and Operations (10 pts).
   - Root-cause diagnostics pointing to exact component design choices.

6. **Web Audio Synthesizer (No External Audio Assets Required)**
   - Procedural Web Audio API soundboard generating tactical clicks, engine ignition rumbles, telemetry pings, and emergency klaxons.

---

## 🛠️ How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
# Visit http://localhost:3000 in your browser

# 3. Production build & test
npm run build
npm start
```

