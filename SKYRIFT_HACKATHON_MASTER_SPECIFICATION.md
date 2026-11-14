# SKYRIFT: MASTER MISSION CONTROL & ENGINEERING BLUEPRINT
## NASA Space Apps Challenge Edition — Complete Hackathon-Winning Specification

> **Mission Objective:** Provide Antigravity (and any autonomous coding agent) with a comprehensive, mathematically grounded, architecture-complete implementation plan to build the entire **SkyRift** web simulation game from ground zero into a NASA Space Apps winner.

---

## 1. Executive Summary & Winning Strategy

### 1.1 Why Most Space Hackathon Projects Fail vs. Why SkyRift Wins
- **Common Failure Mode:** Beautiful 3D landing pages that contain static mockups, fake unclickable sliders, mock telemetry that loops static numbers, disconnected calculations, or pure text quizzes.
- **The SkyRift Formula for 1st Place:**
  1. **Subsystem Interconnectedness (The Law of Coupled Constraints):** Changing any component recalculates mass, thermal balance, link budget, solar attenuation, delta-v, battery endurance, and monetary budget in real-time.
  2. **Deterministic Physics Engine with Real Math:** Ideal Rocket Equation ($I_{sp}$, propellant mass fraction, exponential expansion), Solar Inverse Square Law ($1/r^2$), Keplerian orbital periods, and Deep Space Network (DSN) round-trip light-time latency ($t = d/c$).
  3. **High-Stakes In-Flight Telemetry & Decision Tree:** Interactive launch sequence, orbital injection burns, realistic communications delay (e.g. 14-minute Mars lag where instant joystick steering fails, forcing autonomous flight computer scripting), and randomized subsystem anomalies with trade-off choices.
  4. **Multiplayer Space Agency Roles (Local & Realtime Ready):** 4 distinct roles (**Flight Director / Commander**, **Systems Engineer**, **Science Officer**, **Communications & Trajectory Officer**).
  5. **100-Point Transparent Scoring & NASA-Accredited Debrief:** Every victory or catastrophe is analyzed with an algorithmic breakdown pointing to root-cause design decisions.
  6. **Educational Transparency:** Explicit distinction between real-world physics equations, educational simplifications, and game-balancing constants.

---

## 2. Tech Stack & Project Architecture

### 2.1 Technology Choices
- **Framework:** Next.js 14+ (App Router) with React 18/19 and TypeScript (Strict Mode).
- **Styling & UI:** Tailwind CSS, Lucide React (icons), Radix UI primitives (`@radix-ui/react-*`), Class Variance Authority (`cva`), `clsx`, `tailwind-merge`.
- **Motion & Audio:** Framer Motion for UI telemetry animations; Web Audio API synth soundboard for telemetry beeps, countdown alarms, thruster rumbles, and radio squelch (zero external audio asset dependencies).
- **Visualization:**
  - Canvas 2D + SVG for real-time orbital trajectory maps, solar-system transfer orbits, and Hohmann arcs.
  - Three.js / React Three Fiber (procedural low-poly spacecraft renderer with modular attached subsystems, thruster particle plumes, and planetary bodies).
- **Charts:** Recharts for live telemetry graphs (Battery SoC vs. Eclipse cycles, Delta-V remaining, Uplink/Downlink data rates).
- **Persistence:** LocalStorage with typed state serialization, exportable/importable JSON mission flight logs.

### 2.2 Directory Layout
```text
SkyRift/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout with HUD headers & audio provider
│   │   ├── page.tsx                       # High-impact cinematic Landing Page
│   │   ├── missions/                      # Scenario Selection (Earth, Moon, Mars, Asteroid)
│   │   │   └── page.tsx
│   │   ├── hangar/                        # Spacecraft Subsystem Builder & Budget Matrix
│   │   │   └── page.tsx
│   │   ├── flight-plan/                   # Launch Vehicle, Orbit & Trajectory Planner
│   │   │   └── page.tsx
│   │   ├── preflight/                     # Automated Diagnostic Checklist & Warnings
│   │   │   └── page.tsx
│   │   ├── launch/                        # Interactive Staged Launch Sequence Simulator
│   │   │   └── page.tsx
│   │   ├── operations/                    # Mission Control Room (Telemetry & Flight Director)
│   │   │   └── page.tsx
│   │   ├── landing/                       # Surface Descent & Rover Mini-Simulation
│   │   │   └── page.tsx
│   │   ├── debrief/                       # 100-Point Mission Report & Root-Cause Analysis
│   │   │   └── page.tsx
│   │   ├── multiplayer/                   # 4-Player Local/Sync Role Delegation Terminal
│   │   │   └── page.tsx
│   │   ├── learn/                         # Interactive Spacecraft Engineering Knowledge Base
│   │   │   └── page.tsx
│   │   └── about/                         # NASA Hackathon Credits & Physics Disclaimers
│   │       └── page.tsx
│   ├── components/
│   │   ├── hud/                           # Space Agency TopNav, Alert Bar, Audio Toggle
│   │   ├── hangar/                        # Subsystem Slot Selector, Blueprint Canvas
│   │   ├── budgets/                       # Mass, Power, Delta-V, Cost, Data gauges
│   │   ├── simulation/                    # Live telemetry gauges, DSN Link visualizer
│   │   ├── visualizer/                    # Procedural 3D Spacecraft & 2D Orbital Map
│   │   └── ui/                            # Cards, Buttons, Dialogs, Sliders, Badges
│   ├── game/
│   │   ├── types/                         # Rigid TypeScript schemas for all subsystems
│   │   ├── data/                          # Catalogues of components, missions, launch vehicles
│   │   │   ├── components.ts              # 8 subsystems x 3-4 realistic tiers
│   │   │   ├── launchVehicles.ts          # Electron, Falcon 9, Falcon Heavy, SLS, Starship
│   │   │   ├── missions.ts                # Earth Obs, Lunar Echo, Red Frontier, Asteroid Scout
│   │   │   └── events.ts                  # In-flight anomalies & decision trees
│   │   ├── physics/                       # Core mathematical equations
│   │   │   ├── rocketEquation.ts          # Tsiolkovsky delta-v & fuel consumption
│   │   │   ├── powerBudget.ts             # Inverse square solar & battery eclipse drain
│   │   │   ├── orbitalMechanics.ts        # Vis-viva, orbital periods, Hohmann transfers
│   │   │   └── linkBudget.ts              # DSN latency, Friis path loss & downlink rate
│   │   ├── engine/                        # Mission State Machine & Simulation Clock
│   │   │   ├── simulationEngine.ts        # Ticks time, evaluates drain, schedules DSN passes
│   │   │   ├── anomalyEngine.ts           # Evaluates risks & triggers events
│   │   │   └── scoringEngine.ts           # 100-point transparent rubric evaluator
│   │   └── storage/                       # LocalStorage state sync & JSON mission exports
│   └── lib/
│       ├── audio.ts                       # Web Audio synthesizer for SFX
│       └── utils.ts                       # Formatting (kg, kW, km/s, AU, credits)
```

---

## 3. Mathematical & Physical Models

SkyRift must never use "random fantasy numbers". Every metric follows documented physical relationships:

### 3.1 Propulsion & The Tsiolkovsky Rocket Equation
$$\Delta v = I_{sp} \cdot g_0 \cdot \ln\left(\frac{m_0}{m_f}\right)$$
- $g_0 = 9.80665\text{ m/s}^2$
- $m_0 = m_{\text{dry}} + m_{\text{propellant}}$
- $m_f = m_{\text{dry}}$
- **Propellant Required for a Given $\Delta v$ Target:**
$$m_{\text{propellant}} = m_{\text{dry}} \cdot \left(e^{\frac{\Delta v}{I_{sp} \cdot g_0}} - 1\right)$$

*Educational Insight:* Players immediately observe that doubling their desired $\Delta v$ exponentially balloons the propellant mass, illustrating the "Tyranny of the Rocket Equation".

### 3.2 Solar Power Attenuation (Inverse-Square Law)
$$P(r) = P_{1\text{AU}} \cdot \left(\frac{1}{r^2}\right) \cdot (1 - d)$$
- $r$: Heliocentric distance in Astronomical Units (AU) ($r_{\text{Earth}} = 1.0\text{ AU}$, $r_{\text{Mars}} = 1.524\text{ AU}$, $r_{\text{Ceres/Asteroids}} = 2.77\text{ AU}$).
- At Mars, solar irradiance is $\frac{1}{(1.524)^2} \approx 0.430$ (43.0% of Earth orbit).
- $d$: Cell degradation factor over mission lifetime (0.01 per year in transit, up to 0.15 during Mars dust storm events).
- Deep space missions (> 2.0 AU) require Radioisotope Thermoelectric Generators (RTGs) ($P(t) = P_0 \cdot e^{-\lambda t}$) due to solar starvation.

### 3.3 Battery Capacity & Eclipse Energy Drain
$$E_{\text{consumed}} = P_{\text{active\_load}} \cdot t_{\text{eclipse\_hours}}$$
$$\text{State of Charge (SoC)} = \frac{E_{\text{battery}} - E_{\text{consumed}}}{E_{\text{battery\_max}}} \times 100\%$$
- If $\text{SoC} \le 0\%$, spacecraft enters Cold Emergency Shutdown; payload heaters fail, instruments suffer irreversible thermal fractures.

### 3.4 Deep Space Communications & Latency
- **One-Way Light Time (OWLT):**
$$t_{\text{latency}} = \frac{d}{c}$$
  - Moon ($384,400\text{ km}$): $\approx 1.28\text{ seconds}$.
  - Mars at Closest Approach ($0.38\text{ AU}$): $\approx 3.16\text{ minutes}$.
  - Mars at Conjunction ($2.52\text{ AU}$): $\approx 21.0\text{ minutes}$ (with complete solar conjunction blackout).
- **Downlink Data Volume:**
$$\text{Data Transmitted (Gb)} = \frac{R_{\text{downlink}} (\text{Mbps}) \cdot t_{\text{DSN\_window}} (\text{seconds})}{1000}$$
- If Onboard Solid-State Storage (SSDR) reaches 100% capacity before a DSN contact window, further scientific instrument data is dropped.

---

## 4. The 8 Spacecraft Subsystems Catalog

Every component in the game belongs to one of eight core subsystems. Below is the exact data set to implement in `src/game/data/components.ts`:

### 4.1 Structure & Bus
| ID | Name | Mass (kg) | Cost (Credits) | Power Draw (W) | Volume/Slots | Reliability | Specialty |
|---|---|---|---|---|---|---|---|
| `bus-cubesat-6u` | 6U CubeSat Chassis | 4 | 50,000 | 5 | 4 slots | 0.94 | Ultra-light, low shielding |
| `bus-smallsat-hex` | Hexagonal SmallSat Bus | 45 | 320,000 | 18 | 8 slots | 0.97 | Multi-mount payload deck |
| `bus-deepspace-titanium` | Deep Space Monocoque | 180 | 1,400,000 | 45 | 14 slots | 0.99 | Radiation hardened, high thermal shielding |

### 4.2 Electrical Power System (EPS)
| ID | Name | Mass (kg) | Cost (Credits) | Power Gen (W @ 1 AU) | Battery Capacity (Wh) | Reliability | Description |
|---|---|---|---|---|---|---|---|
| `eps-solar-fixed` | Body-Mounted Silicon Arrays | 12 | 120,000 | 160 | 200 | 0.96 | Inefficient pointing, durable |
| `eps-solar-deployable` | Dual-Wing Tracking Arrays | 38 | 580,000 | 650 | 800 | 0.93 | High generation, deployment risk |
| `eps-rtg-nextgen` | Next-Gen Multi-Mission RTG | 45 | 2,800,000 | 125 (Constant) | 300 | 0.999 | Sun-independent, high cost |
| `eps-li-ion-heavy` | Li-Ion Deep-Cycle Battery Pack | 30 | 180,000 | 0 | 2,400 | 0.98 | Eclipse buffer reservoir |

### 4.3 Propulsion & Propellant
| ID | Name | Mass Dry (kg) | Propellant Mass (kg) | $I_{sp}$ (s) | Thrust (N) | Cost (Credits) | Propellant Type |
|---|---|---|---|---|---|---|---|
| `prop-coldgas-rcs` | Cold Gas Nitrogen Thruster | 15 | 20 | 75 | 5 | 85,000 | Gaseous $N_2$ |
| `prop-monoprop-hydrazine`| Hydrazine Monopropellant System | 35 | 95 | 230 | 40 | 420,000 | Liquid $N_2H_4$ |
| `prop-bipropellant` | Storable Bipropellant Engine | 75 | 350 | 320 | 450 | 950,000 | MMH / NTO |
| `prop-ion-xenon` | Gridded Ion Thruster (NEXT-C) | 55 | 60 | 3,800 | 0.25 | 1,850,000 | Xenon (High Power Draw: 1200W) |

### 4.4 Communications & Telemetry
| ID | Name | Mass (kg) | Cost (Credits) | Power Draw (W) | Downlink Rate | Antenna Gain | Description |
|---|---|---|---|---|---|---|---|
| `comm-omni-lga` | S-Band Low-Gain Patch Antenna | 3 | 75,000 | 15 | 4 kbps | Low (Omnidirectional) | Safe-mode beacon, no pointing needed |
| `comm-parabolic-mga` | X-Band Medium Dish (0.5m) | 14 | 340,000 | 60 | 128 kbps | Medium | Solid compromise for Lunar/Inner Solar |
| `comm-deepspace-hga` | High-Gain Cassegrain Dish (1.5m)| 32 | 1,100,000 | 140 | 2.5 Mbps | High | High pointing precision required ($< 0.1^\circ$) |
| `comm-optical-laser`| Deep Space Optical Comm (DSOC) | 28 | 2,400,000 | 190 | 25.0 Mbps | Ultra-High | Massive throughput, sensitive to weather/pointing |

### 4.5 Guidance, Navigation & Control (GNC)
| ID | Name | Mass (kg) | Cost (Credits) | Power Draw (W) | Pointing Accuracy | Reliability |
|---|---|---|---|---|---|---|
| `gnc-sunsensors-magneto` | Coarse Sun Sensors & Magnetorquers | 6 | 90,000 | 12 | $\pm 3.0^\circ$ | 0.98 | Low precision, Earth orbit only |
| `gnc-reactionwheels-imu` | 3-Axis Reaction Wheels + IMU | 22 | 410,000 | 45 | $\pm 0.2^\circ$ | 0.96 | Requires desaturation thrusters |
| `gnc-dual-startracker` | Autonomous Dual Star Trackers | 15 | 890,000 | 25 | $\pm 0.005^\circ$ | 0.99 | Essential for optical comms & narrow imaging |

### 4.6 Thermal Control Subsystem (TCS)
| ID | Name | Mass (kg) | Cost (Credits) | Power Draw (W) | Thermal Operating Range |
|---|---|---|---|---|---|
| `tcs-passive-mli` | Multi-Layer Insulation (MLI) Blankets | 8 | 65,000 | 0 | $-60^\circ\text{C}$ to $+100^\circ\text{C}$ |
| `tcs-active-louvers` | Thermal Louvers & Embedded Heaters | 18 | 240,000 | 75 (Thermostat) | $-140^\circ\text{C}$ to $+160^\circ\text{C}$ |
| `tcs-cryocooler` | Closed-Cycle Stirling Cryocooler | 26 | 920,000 | 180 | Down to $40\text{ K}$ (Infrared sensors) |

### 4.7 Command & Data Handling (C&DH)
| ID | Name | Mass (kg) | Cost (Credits) | Power Draw (W) | Storage (SSDR) | Autonomy Tier |
|---|---|---|---|---|---|---|
| `cdh-microcontroller` | Single-String Flight Computer | 4 | 110,000 | 8 | 16 Gb | Tier 1 (Scripted commands only) |
| `cdh-fault-tolerant` | Dual-Redundant RAD750 Processor | 14 | 820,000 | 28 | 256 Gb | Tier 2 (Auto-safing & recovery) |
| `cdh-ai-autonomous` | Neuromorphic Edge Flight Computer| 18 | 1,950,000 | 55 | 2,048 Gb (2 Tb) | Tier 3 (Full autonomous science event detection) |

### 4.8 Scientific Payload Instruments
| ID | Name | Mass (kg) | Cost (Credits) | Power Draw (W) | Data Gen Rate | Science Target Match |
|---|---|---|---|---|---|---|
| `inst-multispectral`| Multi-Spectral Earth/Planet Imager | 18 | 650,000 | 45 | 450 MB / hr | Surface composition, vegetation, clouds |
| `inst-sar-radar` | Synthetic Aperture Radar (SAR) | 65 | 2,200,000 | 320 | 1,800 MB / hr| Day/night surface mapping, polar ice |
| `inst-magnetometer` | Dual-Fluxgate Magnetometer Boom | 6 | 210,000 | 8 | 12 MB / hr | Planetary magnetosphere, solar wind |
| `inst-gamma-neutron`| Gamma-Ray & Neutron Spectrometer | 24 | 950,000 | 38 | 65 MB / hr | Subsurface hydrogen & water-ice detection |
| `inst-seismometer` | Surface Micro-Seismometer Package | 12 | 780,000 | 15 | 8 MB / hr | Planetary core & tectonic activity (Lander required) |
| `inst-alpha-xray` | Alpha Particle X-Ray Spectrometer (APXS) | 8 | 620,000 | 12 | 20 MB / hr | Elemental rock chemistry (Rover required) |

---

## 5. Missions & Scenarios

### 5.1 Mission Matrix
1. **Mission 1 — Earth Observation ("Orbital Sentinel"):**
   - *Destination:* Low Earth Orbit (LEO, 600 km Sun-Synchronous Orbit).
   - *Challenge:* Extreme eclipse cycling (35 minutes in dark every 95-minute orbit); high data throughput; narrow ground-station contact cones.
   - *Budget:* 2,500,000 Credits | Mass Limit: 600 kg.
2. **Mission 2 — Lunar Explorer ("Artemis Surveyor"):**
   - *Destination:* Polar Lunar Orbit (100 km).
   - *Challenge:* Trans-Lunar Injection (TLI $\Delta v \approx 3,150\text{ m/s}$), Lunar Orbit Insertion (LOI $\Delta v \approx 850\text{ m/s}$), 2-week Lunar night thermal survival.
   - *Budget:* 6,500,000 Credits | Mass Limit: 1,800 kg.
3. **Mission 3 — Mars Pathfinder ("Red Frontier"):**
   - *Destination:* Areocentric Elliptical Orbit & Surface Landing.
   - *Challenge:* Trans-Mars Injection ($\Delta v \approx 3,800\text{ m/s}$), 7-month cruise, 43% solar attenuation, 3-to-22 minute light lag, entry descent and landing (EDL).
   - *Budget:* 14,000,000 Credits | Mass Limit: 3,200 kg.
4. **Mission 4 — Asteroid Scout ("Deep Primitive"):**
   - *Destination:* Near-Earth Asteroid (101955 Bennu rendezvous).
   - *Challenge:* Low gravity stationkeeping, ion-propulsion trajectory planning, ultra-long communication distances ($> 1.8\text{ AU}$).
   - *Budget:* 9,000,000 Credits | Mass Limit: 1,200 kg.

---

## 6. Launch Vehicles & Trajectory Planning

| Vehicle | Payload to LEO (kg) | Payload to Moon/TLI (kg) | Payload to Mars/TMI (kg) | Launch Cost (Credits) | Reliability |
|---|---|---|---|---|---|
| **AeroDart (Small)** | 400 kg | Ineligible | Ineligible | 450,000 | 0.94 |
| **Valkyrie-9 (Medium)** | 4,200 kg | 1,100 kg | 650 kg | 1,800,000 | 0.98 |
| **Titan-Heavy (Heavy)** | 14,000 kg | 4,800 kg | 3,100 kg | 4,200,000 | 0.99 |
| **Nova-Starship (Super-Heavy)** | 35,000 kg | 12,000 kg | 8,500 kg | 7,500,000 | 0.96 |

---

## 7. Dynamic In-Flight Anomaly Engine

During Mission Operations, deterministic and probabilistic events test player design:
1. **Solar Flare Radiation Pulse:**
   - *Condition:* Occurs during interplanetary cruise.
   - *Impact:* Bit-flip memory corruption in C&DH; solar panel efficiency drops 8%.
   - *Player Action Tree:*
     - A: Reboot flight computer into safe mode (Loses 24 hours of science, 0% hardware risk).
     - B: Engage redundant secondary processor (Consumes 45W extra battery, preserves data).
     - C: Ignore and override (25% chance of catastrophic attitude tumble).
2. **Attitude Control Reaction Wheel Desaturation Limit:**
   - *Condition:* Cumulative reaction wheel momentum reaches 95%.
   - *Impact:* Spacecraft loses fine pointing; high-gain antenna loses DSN lock.
   - *Player Action Tree:*
     - A: Fire RCS thrusters to desaturate (Burns 4.5 kg propellant).
     - B: Use solar radiation torque balancing (Consumes 12 hours of drift time, saves fuel).
3. **Mars Dust Storm Encroachment (Landing Phase):**
   - *Condition:* Surface lander deployed during Mars global storm season.
   - *Impact:* Solar arrays drop to 18% power generation; thermal blankets cool rapidly.
   - *Player Action Tree:*
     - A: Sleep all scientific payloads, activate survive heaters (Preserves rover, pauses mission).
     - B: Run optical spectrometer before instruments freeze (Earns 500 science points, 40% risk of total battery depletion).

---

## 8. Transparent 100-Point Scoring Matrix

```text
================================================================================
SCORE CATEGORY                   MAX POINTS   EVALUATION CRITERIA
================================================================================
1. Science Objective Completion      35 pts   % of targeted science datasets downlinked
2. Trajectory & Orbit Delivery       20 pts   Reaching destination within Δv tolerances
3. Data Downlink & DSN Usage         15 pts   Zero buffer overruns; high downlink efficiency
4. Spacecraft Structural Health      10 pts   Subsystem degradation < 15% at mission end
5. Budget & Resource Efficiency      10 pts   Remaining financial margin & mass margins
6. Anomaly Resolution & Operations   10 pts   Rational, low-risk responses to flight events
--------------------------------------------------------------------------------
TOTAL SCORE                         100 pts
================================================================================
Result Tiers:
  - 90 - 100: Exceptional Mission Success (NASA Trophy Tier)
  - 75 - 89:  Nominal Mission Success (Primary Objectives Met)
  - 50 - 74:  Partial Success (Scientific Value Recovered despite Anomalies)
  - < 50:     Mission Failure (Post-Mortem Root Cause Diagnostics Provided)
```

---

## 9. Step-by-Step Implementation Roadmap for Antigravity

Follow this execution sequence to deliver a functional, error-free product:

### Milestone 1: Core Foundation & Next.js Setup
1. Initialize Next.js project with App Router, TypeScript, Tailwind CSS, Lucide icons, and Framer Motion.
2. Establish global HUD layout with mission stage tracker (`[1. Briefing] -> [2. Hangar] -> [3. Launch] -> [4. Operations] -> [5. Debrief]`).
3. Implement Web Audio Synthesizer service (`src/lib/audio.ts`) for retro-modern mission control sound feedback.

### Milestone 2: Game State Store & Subsystem Types
1. Create rigid TypeScript models (`src/game/types/`) for Components, Spacecraft Configuration, Budgets, Telemetry, and Events.
2. Implement state reducer / store supporting actions: `SELECT_MISSION`, `INSTALL_COMPONENT`, `REMOVE_COMPONENT`, `SET_LAUNCH_VEHICLE`, `ADVANCE_TIME`, `RESOLVE_EVENT`, `RESET_MISSION`.
3. Integrate typed LocalStorage persistence with version checking.

### Milestone 3: Real-Time Budget Engine & Validation
1. Implement physics calculations in `src/game/physics/`:
   - `calculateMassBudget`: Dry mass + propellant mass fraction vs. launcher limits.
   - `calculatePowerBudget`: Solar generation ($1/r^2$) vs. active load vs. battery reserve.
   - `calculateDeltaV`: Rocket equation with exact specific impulse calculations.
   - `calculateLinkBudget`: Range-based DSN data rates and light-time delay.
2. Implement automated diagnostic preflight checklist returning blocking errors (Red), warnings (Amber), and flight recommendations (Blue).

### Milestone 4: The Spacecraft Hangar UI
1. Build intuitive 3-column builder layout:
   - Left: Subsystem category accordion with rich component cards.
   - Center: 2D interactive spacecraft blueprint node view / procedural 3D preview.
   - Right: Real-time dynamic budget gauges (Mass, Power, Cost, Delta-V, Storage).
2. Live trade-off comparison cards when hovering over prospective component upgrades.

### Milestone 5: Launch & Trajectory Flight Engine
1. Multi-phase launch sequence: Countdown -> Ignition -> Liftoff -> Max-Q -> Staging -> Fairing Jettison -> Orbital Insertion.
2. Visual ascent telemetry HUD with interactive throttle and emergency abort controls.
3. 2D orbital trajectory canvas visualizing parking orbit, transfer trajectory, and target destination.

### Milestone 6: Mission Operations Room & Telemetry
1. High-tech Mission Control Console with real-time charts (Recharts).
2. DSN Link visualizer tracking ground station line-of-sight and signal latency.
3. Time acceleration controls ($1\times, 5\times, 10\times, 50\times$, Pause).
4. Anomaly popup modal freezing simulation clock and displaying consequential player choices.

### Milestone 7: 100-Point Debrief & Knowledge Hub
1. Animated mission outcome reveal with score breakdown and root-cause failure diagnostics.
2. Replay & Redesign buttons retaining mission configurations.
3. Comprehensive "Learn the Science" interactive glossary detailing real NASA equations vs. game simplifications.

---

## 10. Acceptance & Hackathon Demo Checklist
- [ ] Complete game loop playable without signing in or configuring API keys.
- [ ] No fake or non-functional buttons on any screen.
- [ ] Changing components triggers real mathematical budget recalculations.
- [ ] Launch mass exceeding rocket capacity triggers a clear blocking diagnostic error.
- [ ] Deep space missions correctly demonstrate solar attenuation and DSN latency.
- [ ] Telemetry charts update dynamically with simulation progression.
- [ ] Mission Debrief accurately breaks down points based on actual flight performance.
- [ ] Works cleanly on desktop and mobile viewports.
- [ ] Web Audio telemetry sound effects provide tactile immersion.
- [ ] Fully verified build with 0 TypeScript or linting errors.

