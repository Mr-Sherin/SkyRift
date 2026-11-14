import { SpacecraftComponent } from '@/game/types';

export interface FlightEventEffect {
  batteryDeltaWh?: number;
  craftHealthDelta?: number;
  propellantDeltaKg?: number;
  dataDeltaGb?: number;
  scienceDelta?: number;
  loseTurn?: boolean;
}

export interface FlightEventOption {
  label: string;
  description: string;
  consequenceText: string;
  effects: FlightEventEffect;
  requirementNote?: string;
  checkEligibility?: (components: SpacecraftComponent[]) => boolean;
}

export interface FlightEvent {
  id: string;
  title: string;
  triggerChance: number; // Base probability per turn (0.0 to 1.0)
  description: string;
  realMissionContext: string; // "What real missions do" educational explanation
  options: FlightEventOption[];
}

// ============================================================================
// 8 FLIGHT ANOMALIES & OPPORTUNITY EVENTS
// ============================================================================
export const FLIGHT_EVENTS: FlightEvent[] = [
  // 1. Solar Flare
  {
    id: 'event-solar-flare',
    title: 'Coronal Mass Ejection (CME) Radiation Storm',
    triggerChance: 0.22,
    description:
      'Space weather sensors detect an intense solar proton storm propagating directly across your orbital vector. High-energy ionizing flux threatens unshielded electronics.',
    realMissionContext:
      'When NASA SOHO and Parker Solar Probe detect severe CMEs, missions like Mars 2020 (Perseverance) and Europa Clipper put sensitive payloads into safe hold and point thick radiation-hardened spacecraft bulkheads towards the Sun.',
    options: [
      {
        label: 'Slew to Shielded Safe Mode',
        description: 'Rotate craft so main chassis shields electronics. Instruments powered down for 24 hours.',
        consequenceText: 'Spacecraft protected with 0 damage. Thermal survival heaters drew 60 Wh during the solar hold.',
        effects: {
          batteryDeltaWh: -60,
          craftHealthDelta: 0,
        },
      },
      {
        label: 'Maintain In-Situ Science Observations',
        description: 'Keep instruments active to capture historic particle flux dynamics in the solar wind.',
        consequenceText:
          'Extraordinary solar storm data captured (+85 science)! However, radiation flux degraded CPU and sensor health by -12%.',
        effects: {
          scienceDelta: 85,
          craftHealthDelta: -12,
          batteryDeltaWh: -30,
        },
      },
    ],
  },

  // 2. Comms Dropout
  {
    id: 'event-comms-dropout',
    title: 'DSN Ground Station Carrier Dropout',
    triggerChance: 0.20,
    description:
      'Earth antenna ground tracking at Goldstone experienced sudden atmospheric rain fade and transmitter lock loss. The primary high-frequency downlink carrier dropped.',
    realMissionContext:
      'Real deep-space explorers like Voyager 1 and New Horizons rely on multi-band fallback (X-band to omni S-band) and autonomous on-board data buffering when DSN ground stations face rain attenuation or maintenance blackouts.',
    options: [
      {
        label: 'Switch to Low-Gain Fallback Antenna',
        description: 'Re-route telemetry packet headers to omnidirectional backup antenna.',
        consequenceText:
          'Low-gain antenna maintained continuous carrier lock. Minor -20 Wh power used, with zero observation data lost.',
        effects: {
          batteryDeltaWh: -20,
          craftHealthDelta: 0,
        },
      },
      {
        label: 'Buffer Data and Wait for Next Clear Pass',
        description: 'Pause radio transmission and store observations in flash memory until clear weather.',
        consequenceText:
          'Saved transmitter power (+25 Wh). Stored observations remained buffered for the next orbital downlink window.',
        effects: {
          batteryDeltaWh: 25,
        },
      },
    ],
  },

  // 3. Micrometeoroid Hit
  {
    id: 'event-micrometeoroid-hit',
    title: 'Hypervelocity Micrometeoroid Impact',
    triggerChance: 0.18,
    description:
      'A millimeter-sized interplanetary dust particle struck the exterior spacecraft bus at 22 km/s. Acoustic sensors registered a sharp kinetic impact spike against the chassis.',
    realMissionContext:
      'NASA spacecraft like the James Webb Space Telescope (JWST) and Cassini are engineered with multi-layer Whipple shields and MLI blankets to absorb kinetic energy from micrometeoroids and orbital space debris.',
    options: [
      {
        label: 'Run Self-Test & Energize Thermal MLI Patch',
        description: 'Execute subsystem diagnostics and warm localized heaters around the impact zone.',
        consequenceText:
          'Chassis integrity verified. Thermal heaters sealed localized heat leakage, holding damage to only -5% health.',
        effects: {
          batteryDeltaWh: -35,
          craftHealthDelta: -5,
        },
      },
      {
        label: 'Emergency Roll & Bypass Impact Sector',
        description: 'Pivot craft to keep solar panels illuminated and bypass damaged thermal blanket.',
        consequenceText:
          'Conserved battery power, but exterior thermal localized cold spot caused -14% degradation to subsystem health.',
        effects: {
          craftHealthDelta: -14,
        },
      },
    ],
  },

  // 4. Optical Sensor Drift
  {
    id: 'event-sensor-drift',
    title: 'Optical Payload & Star Tracker Thermal Drift',
    triggerChance: 0.22,
    description:
      'Extreme thermal cycling in planetary shadow has induced microscopic expansion in optical lenses, introducing a 0.25-degree pointing bias in science cameras.',
    realMissionContext:
      'Telescopes like Hubble and Kepler regularly conduct autonomous star-calibration sweeps using on-board star catalogs to correct for focal plane thermal expansion.',
    options: [
      {
        label: 'Execute Full Deep Calibration Routine',
        description: 'Slew craft across guide stars and warm calibration heaters to re-zero optical instruments.',
        consequenceText:
          'Optical alignment restored to arc-second precision. Re-calibrated sensors earned +30 bonus science points!',
        effects: {
          batteryDeltaWh: -50,
          scienceDelta: 30,
        },
      },
      {
        label: 'Accept Raw Uncalibrated Observations',
        description: 'Continue running science observation routine without spending power on calibration sweeps.',
        consequenceText:
          'Saved battery power, but slight focal blur reduced incoming observation value (-20 science points).',
        effects: {
          scienceDelta: -20,
        },
      },
    ],
  },

  // 5. Battery Thermal Degradation
  {
    id: 'event-battery-degradation',
    title: 'Battery Cell Over-Temperature Warning',
    triggerChance: 0.19,
    description:
      'Prolonged continuous charge cycling has driven core lithium-ion accumulator temperatures to +55°C, approaching chemical degradation limits.',
    realMissionContext:
      'The Mars Curiosity and Perseverance rovers carefully manage depth-of-discharge (DoD) and cycle active cooling loops to extend multi-decade battery life in deep space.',
    options: [
      {
        label: 'Throttle Charge Rate & Cycle Radiator Louvers',
        description: 'Shunt surplus charging current into dissipators and open active thermal louvers.',
        consequenceText:
          'Cell thermals stabilized at +22°C. Shunting excess power cost -40 Wh, but prevented battery cell wear.',
        effects: {
          batteryDeltaWh: -40,
          craftHealthDelta: 4,
        },
      },
      {
        label: 'Sustain Peak Charge & Accept Accelerated Wear',
        description: 'Maintain maximum power flow to keep payload science instruments running at 100% capacity.',
        consequenceText:
          'Instruments remained fully powered, but sustained high temperatures permanently reduced battery capacity (-10% health).',
        effects: {
          craftHealthDelta: -10,
          scienceDelta: 25,
        },
      },
    ],
  },

  // 6. Data Corruption
  {
    id: 'event-data-corruption',
    title: 'Cosmic Ray Single-Event Data Corruption',
    triggerChance: 0.17,
    description:
      'A heavy cosmic ray iron nucleus passed through the on-board flash memory matrix, flipping bits across multiple observation sectors.',
    realMissionContext:
      'Spaceflight processors like the BAE RAD750 utilize Error-Correcting Code (ECC) memory and Triple-Modular Redundancy (TMR) to autonomously scrub single-event upsets (SEUs) caused by galactic cosmic rays.',
    options: [
      {
        label: 'Run Autonomous ECC Memory Scrubbing',
        description: 'Dispatch CPU error-correcting algorithms to verify and rebuild corrupted parity bits.',
        consequenceText:
          'CPU successfully restored memory integrity. Consumed 25 Wh during processing, recovering 100% of data.',
        effects: {
          batteryDeltaWh: -25,
        },
      },
      {
        label: 'Purge Corrupted Blocks from Solid-State Buffer',
        description: 'Flush the damaged observation sectors immediately to prevent telemetry bus hang-ups.',
        consequenceText:
          'Zero power consumed, but 2.4 GB of uncompressed science observations had to be discarded from the buffer.',
        effects: {
          dataDeltaGb: -2.4,
        },
      },
    ],
  },

  // 7. Thruster Valve Anomaly
  {
    id: 'event-thruster-anomaly',
    title: 'Propellant Feedline Valve Chill Anomaly',
    triggerChance: 0.18,
    description:
      'Cryogenic deep-space temperatures caused a propulsion manifold valve seal to stiffen, initiating a slow micro-vent of propellant vapor.',
    realMissionContext:
      'When the Juno Jupiter probe and New Horizons experienced fuel line chilling, mission controllers commanded line heaters and pulsed valve solenoids to break up cold propellant crystals.',
    options: [
      {
        label: 'Energize Valve Line De-Ice Heaters',
        description: 'Draw electrical power to warm fuel feedlines and restore seal flexibility.',
        consequenceText:
          'Heaters warmed manifold to nominal temperature. Leak arrested with zero fuel lost (-45 Wh power consumed).',
        effects: {
          batteryDeltaWh: -45,
          propellantDeltaKg: 0,
        },
      },
      {
        label: 'Isolate Sector & Vent Residual Vapor',
        description: 'Shut cross-feed pyro valves and vent the trapped propellant in that auxiliary branch.',
        consequenceText:
          'Saved battery power, but venting residual line propellant cost -6 kg of precious fuel margin.',
        effects: {
          propellantDeltaKg: -6,
        },
      },
    ],
  },

  // 8. Unexpected Opportunity
  {
    id: 'event-science-opportunity',
    title: 'Unexpected Target of Opportunity',
    triggerChance: 0.15,
    description:
      'Navigation cameras detect an uncatalogued outgassing plume / active micro-comet fragment crossing within sensor range of your spacecraft!',
    realMissionContext:
      'When Deep Impact and Cassini encountered unexpected active planetary phenomena (such as Enceladus ice geysers), NASA science teams modified flight schedules to command emergency high-resolution observation sweeps.',
    options: [
      {
        label: 'Command High-Resolution Burst Sweep',
        description: 'Power up spectrometers, imaging cameras, and radars at maximum gain for a historic flyby capture!',
        consequenceText:
          'Sensational discoveries returned! Captured +140 bonus science points (+4.2 GB data generated, -85 Wh power).',
        effects: {
          scienceDelta: 140,
          batteryDeltaWh: -85,
          dataDeltaGb: 4.2,
        },
      },
      {
        label: 'Conservative Optical Snapshot',
        description: 'Capture distant optical photos without placing heavy electrical demand on the battery bank.',
        consequenceText:
          'Valuable preliminary survey returned (+40 science points, +1.2 GB data) with only -20 Wh battery draw.',
        effects: {
          scienceDelta: 40,
          batteryDeltaWh: -20,
          dataDeltaGb: 1.2,
        },
      },
      {
        label: 'Bypass & Conserve Power for Primary Target',
        description: 'Ignore the transient target to ensure 100% battery reserve for the primary mission objective.',
        consequenceText:
          'Target passed safely. Spacecraft maintained 100% battery and propellant conservation.',
        effects: {},
      },
    ],
  },
  // 9. Funding Review & Operations Austerity (triggered when launching with budget deficit)
  {
    id: 'event-funding-review',
    title: 'Congressional Funding Review & Telemetry Throttling',
    triggerChance: 0.0, // Triggered explicitly by budget deficit blocker
    description:
      'Because the spacecraft launched with an unauthorized budget deficit, agency comptrollers have imposed immediate operational austerity. Premium Deep Space Network ground passes and telemetry allocations are curtailed.',
    realMissionContext:
      'When planetary missions face severe development cost overruns, NASA Headquarters and congressional oversight mandate operations descopes—often reducing Deep Space Network (DSN) tracking hours, delaying downlink schedules, or mothballing secondary sensors to contain ongoing fiscal costs.',
    options: [
      {
        label: 'Descope Ground Tracking Windows',
        description: 'Accept reduced ground station contact passes. High-bandwidth downlink is throttled to cut operations fees.',
        consequenceText: 'Ground tracking hours curtailed. Science downlink throughput throttled with a -15 GB telemetry backlog penalty.',
        effects: {
          dataDeltaGb: -15,
          craftHealthDelta: 0,
        },
      },
      {
        label: 'Isolate Auxiliary Maneuvering Fuel',
        description: 'Seal off auxiliary propellant reserves to minimize costly in-flight trajectory ground-computation cycles.',
        consequenceText: 'Auxiliary thrusters locked out. Propellant reserve reduced (-10 kg) and engineering flexibility restricted.',
        effects: {
          propellantDeltaKg: -10,
          craftHealthDelta: -5,
        },
      },
    ],
  },
];

// ============================================================================
// SEEDED DETERMINISTIC PRNG (Mulberry32)
// ============================================================================
export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a numeric seed from a string identifier.
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 12345;
}

/**
 * Evaluates whether an event triggers on this turn based on:
 * - Deterministic PRNG roll
 * - Event base trigger chance
 * - Game difficulty multiplier
 */
export function evaluateEventTrigger(
  prng: () => number,
  difficulty: 'beginner' | 'standard' | 'expert',
  excludeIds: string[] = []
): FlightEvent | null {
  const difficultyMultiplier =
    difficulty === 'beginner' ? 0.35 : difficulty === 'expert' ? 1.85 : 1.0;

  const roll = prng();
  // Filter eligible events that haven't been triggered yet
  const available = FLIGHT_EVENTS.filter((e) => !excludeIds.includes(e.id));
  if (available.length === 0) return null;

  // Check against combined chance
  for (const event of available) {
    const adjustedChance = event.triggerChance * difficultyMultiplier;
    const eventRoll = prng();
    if (eventRoll < adjustedChance) {
      return event;
    }
  }

  return null;
}

