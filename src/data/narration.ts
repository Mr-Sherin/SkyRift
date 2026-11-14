// ============================================================================
// SKY RIFT: Flight Director Narration, Mission Briefings & Press Headlines
// ============================================================================

import { FlightState, FlightAction } from '@/lib/simulation';

export interface DirectorLine {
  text: string;
  subtext?: string;
}

export interface MissionBriefing {
  missionId: string;
  directorName: string;
  callsign: string;
  title: string;
  quote: string;
  objectives: string[];
  keyRisk: string;
}

export interface MissionHeadline {
  publication: string;
  date: string;
  headline: string;
  subhead: string;
  lede: string;
  tag: string;
}

// ============================================================================
// 1. FLIGHT DIRECTOR SITUATIONAL COMMENTARY (45+ VARIED LINES)
// ============================================================================
export const FLIGHT_DIRECTOR_LINES = {
  // Situation: Battery critically low or drained by eclipse
  lowBattery: [
    {
      text: "Power bus is sagging dangerously! EECOM reports battery reserves are under critical threshold.",
      subtext: "Orient solar arrays to the Sun immediately or switch into Safe Mode before we brown out.",
    },
    {
      text: "Telemetry shows main bus voltage fluctuating below 24V. We can't power science payloads like this.",
      subtext: "Prioritize battery replenishment this turn or our avionics will initiate emergency load shedding.",
    },
    {
      text: "Those shadow passes are chewing right through our reserves. Battery depth-of-discharge is in the red.",
      subtext: "Run a Recharge cycle now to keep thermal heaters and essential command receivers alive.",
    },
    {
      text: "EECOM to Flight: solar array incidence angle isn't keeping up with battery drain.",
      subtext: "We need an idle or recharge turn to rebuild state-of-charge before the next observation.",
    },
    {
      text: "Warning: power margin is razor thin! If battery hits zero, flight computer triggers an automatic safe mode.",
      subtext: "Conserve every watt—power down secondary instruments until the bus stabilizes.",
    },
    {
      text: "We are burning battery reserve faster than our arrays can replenish it out here.",
      subtext: "Recharge now. Dead batteries mean dead spacecraft, people.",
    },
    {
      text: "Voltage dip detected on EPS channel Alpha. Don't risk firing high-draw sensors right now.",
      subtext: "Take a recharge turn to restore battery buffer.",
    },
  ],

  // Situation: Data storage buffer near capacity / risking overwrite
  dataFull: [
    {
      text: "Solid-state recorder is choked at over 85% capacity! Science data will overwrite if we don't dump it.",
      subtext: "Schedule a high-priority Downlink to Goldstone DSN immediately.",
    },
    {
      text: "Science team is thrilled with the volume, but our memory buffers are about to spill over.",
      subtext: "Lock the high-gain dish onto Earth and downlink before precious imagery gets purged.",
    },
    {
      text: "Data buffer overflow warning on the telemetry rack. We're generating bytes faster than we clear them.",
      subtext: "Clear the recorder backlog with a dedicated downlink pass this turn.",
    },
    {
      text: "Ground stations have clear line-of-sight. Use this DSN contact window to empty the data banks!",
      subtext: "Unsent data earns zero points in the final mission archive.",
    },
    {
      text: "INCO confirms high link margin to Earth right now. Dump that stored survey telemetry!",
      subtext: "Don't let valuable spectrometer sweeps get erased in the FIFO buffer.",
    },
    {
      text: "Storage capacity is redlining. Every new observation right now risks overwriting earlier scans.",
      subtext: "Commit to Downlink. Turn that raw telemetry into archived discoveries.",
    },
    {
      text: "Telemetry recorder is packing up. Madrid DSN has our carrier signal—start streaming data!",
      subtext: "Downlink now to free onboard storage space.",
    },
  ],

  // Situation: Spacecraft health damaged or micro-meteoroid/radiation impact
  healthDamaged: [
    {
      text: "Damage control report: hull integrity has taken a hit! Telemetry indicates structural stresses.",
      subtext: "Enter Safe Mode to isolate auxiliary circuits and allow diagnostic self-healing routines to run.",
    },
    {
      text: "Subsystem health is degraded. Our attitude control thrusters and harness are reporting micro-faults.",
      subtext: "Avoid high-stress maneuvers; nurse this bird through the cruise phase.",
    },
    {
      text: "We took a beating on that last turn. Thermal blankets and solar cell laminates are degraded.",
      subtext: "Run diagnostics in Safe Mode to prevent cascading hardware failures.",
    },
    {
      text: "GNC and EPS telemetry show sensor noise following that anomaly. Watch hull temperatures closely.",
      subtext: "Keep power consumption balanced to minimize internal thermal gradients.",
    },
    {
      text: "Health index is below 70%. Flight, we're testing the structural limits of this airframe.",
      subtext: "Stabilize systems with a conservative recharge or maintenance turn.",
    },
    {
      text: "Micrometeoroid shielding took the brunt of the impact. Hull integrity is compromised but holding.",
      subtext: "Prioritize stable thermal orientation and gentle operations.",
    },
    {
      text: "Telemetry packet losses flagged by INCO. Subsystem damage is straining bus electronics.",
      subtext: "Safe mode can stabilize temperatures and restore baseline craft health.",
    },
  ],

  // Situation: High science yields / milestone observation returns
  goodScience: [
    {
      text: "Principal Investigator just walked into Mission Control with a massive grin. That was a textbook pass!",
      subtext: "Spectrometry resolution exceeded mission baselines. Keep this momentum rolling!",
    },
    {
      text: "Spectacular telemetry! Ground computers just reconstructed a stunning multi-band mosaic.",
      subtext: "Sensor integration went flawlessly. Ensure we maintain downlink cadence to secure the yield.",
    },
    {
      text: "Science Return score is climbing nicely. The science working group is already drafting papers.",
      subtext: "We're capturing high-priority targets right on schedule.",
    },
    {
      text: "Clean observation run! Payload power was stable and pointing accuracy was sub-arcsecond.",
      subtext: "Keep tracking thermal limits while the science suite stays online.",
    },
    {
      text: "Outstanding sensor return. That last observation slice returned pure gold for the science archive.",
      subtext: "Downlink when ready to convert those gigabytes into permanent mission points.",
    },
    {
      text: "Target acquisitions confirmed locked. Photometry curves are cleaner than simulated models predicted.",
      subtext: "Great job, crew. Keep the momentum going through orbital recon.",
    },
    {
      text: "We just secured a vital dataset. That observation will define the post-mission press conference.",
      subtext: "Store and downlink to bank the scientific return.",
    },
  ],

  // Situation: Nominal cruise / steady operations
  nominalCruise: [
    {
      text: "All consoles green across the floor. Spacecraft attitude is rock solid and telemetry is crystal clear.",
      subtext: "Flight dynamics confirm we are dead center in our planned trajectory corridor.",
    },
    {
      text: "Guidance is tracking true, battery state is healthy, and the high-gain dish is locked onto Earth.",
      subtext: "A textbook flight sequence. Choose your next action to advance primary objectives.",
    },
    {
      text: "Thermal loops are balanced and radiation counters are calm. She's humming like a Swiss watch.",
      subtext: "Take advantage of this calm turn to gather science or downlink pending survey files.",
    },
    {
      text: "EECOM, GNC, and INCO all report GO. Systems performing exactly as configured in the Hangar.",
      subtext: "Maintain cadence and monitor your battery reserves before upcoming shadow passes.",
    },
    {
      text: "Telemetry signal-to-noise ratio is pristine. Craft attitude is nominal across all 3 axes.",
      subtext: "We have orbital geometry in our favor this turn.",
    },
    {
      text: "Quiet pass on the loops. That's how we like our orbital missions—quiet and predictable.",
      subtext: "Select your action when ready to begin the next turn sequence.",
    },
  ],

  // Situation: Maneuver executed
  maneuver: [
    {
      text: "Burn complete! GNC reports clean delta-V execution with negligible residual drift.",
      subtext: "New trajectory vector confirmed by Deep Space Network Doppler tracking.",
    },
    {
      text: "Thruster chambers cooled down nominally. Orbit trim achieved our intended pericenter target.",
      subtext: "Watch propellant reserves—ensure we keep enough margin for end-of-mission disposal.",
    },
    {
      text: "That burn placed us right in the sweet spot for upcoming planetary flyby imaging passes.",
      subtext: "Guidance has transferred control back to reaction wheels.",
    },
    {
      text: "Good delta-V burn. Vector velocity trimmed within 0.2 m/s of planned flight dynamics target.",
      subtext: "Telemetry shows tank pressures nominal following chamber shutoff.",
    },
    {
      text: "Trajectory correction executed cleanly. We shaved off unwanted orbital inclination.",
      subtext: "Propellant level is logged in flight telemetry.",
    },
    {
      text: "Chamber pressure nominal during burn duration. Orbit eccentricity trimmed as commanded.",
      subtext: "Attitude holding steady for post-burn telemetry relay.",
    },
  ],

  // Situation: Recovering from safe mode or low power
  safeMode: [
    {
      text: "Safe Mode automated routines executed as designed. Non-essential loads shed to preserve battery.",
      subtext: "Main computer is rebooting science subsystems. Run a recharge cycle to build safety margin.",
    },
    {
      text: "Heartbeat signal confirmed! We survived the blackout and ground control has regained carrier lock.",
      subtext: "Take it slow—let battery banks charge back to healthy levels before firing hungry sensors.",
    },
    {
      text: "Spacecraft stabilized in Sun-pointing safe mode. Attitude drift arrested.",
      subtext: "Begin re-activating primary subsystems systematically.",
    },
    {
      text: "Emergency load shed averted a fatal power death. Batteries are cold but absorbing charge again.",
      subtext: "Nurse the electrical system back to nominal before attempting big observation runs.",
    },
    {
      text: "Telemetry recovery complete. We took a hit to our timeline, but the bird is alive and answering commands.",
      subtext: "Rebuild confidence and state-of-charge this turn.",
    },
  ],
};

// ============================================================================
// 2. OPENING MISSION BRIEFINGS (FOR /missions)
// ============================================================================
export const MISSION_BRIEFINGS: Record<string, MissionBriefing> = {
  'mission-earth-obs': {
    missionId: 'mission-earth-obs',
    directorName: 'Flight Director Sofia Reyes',
    callsign: 'SENTINEL FLIGHT',
    title: 'Orbital Sentinel // Earth Environmental Survey',
    quote:
      "Welcome to Sentinel Ops. We're launching into a 600 km Sun-Synchronous orbit. Your job is to return high-cadence multispectral imaging of climate shifts and wildfire hotzones without blowing your launch budget or blacking out in Earth's shadow.",
    objectives: [
      'Deliver 250+ GB of calibrated multispectral Earth observations',
      'Survive recurring 35-minute eclipse periods without battery failure',
      'Downlink data swiftly over high-frequency ground station passes',
      'Maintain propellant reserves for end-of-mission orbit de-orbit burn',
    ],
    keyRisk:
      'Eclipse Shadows: Passing through Earth’s umbra for 35 minutes each orbit drains battery reserves rapidly if onboard battery storage is undersized.',
  },
  'mission-lunar-echo': {
    missionId: 'mission-lunar-echo',
    directorName: 'Flight Director Sofia Reyes',
    callsign: 'ARTEMIS FLIGHT',
    title: 'Artemis Surveyor // Lunar Polar Reconnaissance',
    quote:
      "Flight crew, this is the frontier. We're heading into a high-inclination lunar polar orbit. Deep inside Shackleton Crater lies permanently shadowed water-ice that future human crews will rely on. Give me clean neutron spectroscopy and keep comms alive through lunar farside blackouts.",
    objectives: [
      'Execute Trans-Lunar Injection (TLI) and Lunar Orbit Insertion (LOI) (~3,950 m/s Δv)',
      'Map lunar hydrogen concentrations inside permanently shadowed craters',
      'Survive severe 48-minute communications and thermal blackouts behind the Moon',
      'Preserve spacecraft health against lunar regolith abrasive radiation',
    ],
    keyRisk:
      'Farside Comms Silence: When the spacecraft dips behind the Moon, ground control loses telemetry. Autonomy and recorder capacity are critical.',
  },
  'mission-mars-frontier': {
    missionId: 'mission-mars-frontier',
    directorName: 'Flight Director Sofia Reyes',
    callsign: 'AREO FLIGHT',
    title: 'Red Frontier // Mars Mineral & Atmosphere Exploration',
    quote:
      "Listen up: Mars is the grandmaster of orbital mechanics. You have a 7-month heliocentric cruise where the Sun dims by 57%. At 1.5 AU, light-speed radio delays mean you cannot joystick this craft. Build a powerhouse that can survive the cold and capture the red planet.",
    objectives: [
      'Complete 240-day interplanetary Hohmann transfer with high avionics reliability',
      'Execute high-energy Mars Orbit Insertion burn using high-ISP propulsion',
      'Survive low solar flux (43% solar constant) using expanded arrays or nuclear RTG',
      'Downlink high-resolution mineral biosignature spectra via the Deep Space Network',
    ],
    keyRisk:
      'Inverse-Square Solar Loss: Sunlight drops to 43% at Mars. Standard solar panels generate less than half their rated Earth power—plan power generation accordingly.',
  },
  'mission-asteroid-scout': {
    missionId: 'mission-asteroid-scout',
    directorName: 'Flight Director Sofia Reyes',
    callsign: 'DEEP SPACE FLIGHT',
    title: 'Deep Primitive // Bennu Asteroid Rendezvous',
    quote:
      "We're sending this probe out to rendezvous with asteroid Bennu (orbiting between 0.90 and 1.36 AU)—a 500-meter carbonaceous time capsule from the birth of our Solar System. Microgravity navigation requires pinpoint guidance and high-specific-impulse electric thrusters.",
    objectives: [
      'Survive a 360-day deep space cruise requiring upwards of 5,200 m/s delta-V',
      'Operate in weak, irregular microgravity without collision or attitude tumbling',
      'Perform close-proximity laser altimetry and elemental spectroscopy',
      'Downlink pristine primordial asteroid chemical fingerprints back to Earth',
    ],
    keyRisk:
      'Extreme Range & Fuel Demands: Bennu requires 5,200 m/s Δv. Conventional chemical rockets will bloat the craft mass—electric ion engines are almost mandatory.',
  },
};

// ============================================================================
// 3. CLOSING NEWS-STYLE HEADLINE RESULTS (FOR /debrief)
// ============================================================================
export const MISSION_NEWS_HEADLINES: Record<
  string,
  {
    stellar: MissionHeadline;
    partial: MissionHeadline;
    failure: MissionHeadline;
  }
> = {
  'mission-earth-obs': {
    stellar: {
      publication: 'GLOBAL SCIENCE CHRONICLE',
      date: 'MISSION DAY 30 // CAPE CANAVERAL PRESS WIRE',
      headline: 'ORBITAL SENTINEL SMASHES EARTH RECONNAISSANCE RECORDS',
      subhead: 'Continuous multispectral data stream provides unprecedented wildfire and climate monitoring.',
      lede: 'In what mission controllers are calling an unqualified triumph of aerospace engineering, Orbital Sentinel completed its 30-day baseline campaign with flawless electrical stability and zero data loss. Climate scientists across six continents celebrated the delivery of ultra-crisp multispectral imagery that has already detected developing drought corridors across equatorial basins.',
      tag: 'HISTORIC SUCCESS',
    },
    partial: {
      publication: 'AEROSPACE DAILY REPORT',
      date: 'MISSION DAY 30 // ORBITAL DESK',
      headline: 'ORBITAL SENTINEL CONCLUDES CHOPPY EARTH PATROL WITH PARTIAL HARVEST',
      subhead: 'Data buffer overflows and battery dips trim final science yield, but critical climate passes survive.',
      lede: 'Orbital Sentinel concluded its Earth observation mission today with mixed operational marks. While the craft successfully returned valuable terrestrial observation sweeps, telemetry blackouts and data memory constraints forced flight directors to discard secondary sensor packets during key orbital passes.',
      tag: 'QUALIFIED MISSION',
    },
    failure: {
      publication: 'SPACEFLIGHT INVESTIGATION WIRE',
      date: 'MISSION ARCHIVE REVIEW',
      headline: 'ORBITAL SENTINEL MISSION CUT SHORT BY POWER STARVATION',
      subhead: 'Spacecraft succumbs to recurring eclipse battery depletion in low Earth orbit.',
      lede: 'A formal review board was convened this morning following the loss of the Orbital Sentinel probe. Telemetry logs confirm the spacecraft drained its secondary battery packs during repeated orbital shadow transits, triggering permanent safe mode dropouts and leaving climate monitoring targets unfulfilled.',
      tag: 'MISSION ANOMALY',
    },
  },
  'mission-lunar-echo': {
    stellar: {
      publication: 'THE LUNAR HERALD',
      date: 'DAY 60 // ARTEMIS COMMAND POST',
      headline: 'ARTEMIS SURVEYOR CONFIRMS VAST WATER-ICE RESERVES IN PERMANENT LUNAR SHADOW',
      subhead: 'Neutron spectrometer mappings unlock historic fuel and life-support roadmap for future crewed bases.',
      lede: 'History was written today 100 kilometers above the Moon’s south pole. Artemis Surveyor returned an extraordinary flood of subsurface hydrogen maps, conclusively identifying billions of tons of accessible water ice locked inside the frigid interior of Shackleton Crater. Mission Director Sofia Reyes praised the spacecraft’s resilient thermal and comms architecture.',
      tag: 'GROUNDBREAKING DISCOVERY',
    },
    partial: {
      publication: 'INTERPLANETARY GAZETTE',
      date: 'DAY 60 // HOUSTON SPACE WIRE',
      headline: 'ARTEMIS SURVEYOR RETURNS LUNAR POLAR SKETCH DESPITE RECURRENT FARSIDE COMM DROPS',
      subhead: 'Probe secures water-ice evidence between deep communications blackouts and battery brownouts.',
      lede: 'Artemis Surveyor has formally completed its two-month lunar reconnaissance campaign. Operating in the harsh thermal swings of lunar polar orbit, the probe gathered baseline hydrogen spectroscopy while battling lengthy radio silences behind the lunar limb that caused significant data queues.',
      tag: 'MIXED RETURN',
    },
    failure: {
      publication: 'AEROSPACE REVIEW BOARD',
      date: 'POST-FLIGHT TELEMETRY BRIEFING',
      headline: 'ARTEMIS SURVEYOR SILENCED: INSUFFICIENT DELTA-V AND POWER END LUNAR PROSPECT',
      subhead: 'Spacecraft lost after failing to sustain orbital injection and shadow cycle thermal heating.',
      lede: 'Mission control confirmed telemetry loss from Artemis Surveyor following a critical power breakdown in lunar polar orbit. Undersized energy storage and propulsion margins left the spacecraft incapable of sustaining attitude lock during deep crater shadow passes.',
      tag: 'CRITICAL FAILURE',
    },
  },
  'mission-mars-frontier': {
    stellar: {
      publication: 'THE MARTIAN DISPATCH',
      date: 'SOL 240 // DEEP SPACE EXPLORATION NETWORK',
      headline: 'RED FRONTIER ORBITS MARS: UNLOCKS HIGH-RESOLUTION ANCIENT LAKEBED BIOSIGNATURES',
      subhead: 'Flawless interplanetary cruise delivers premier spectroscopic survey of Jezero crater delta.',
      lede: 'After a harrowing 240-day voyage across the inner solar system, Red Frontier fired its orbital insertion engine with millisecond precision, slipping smoothly into areocentric orbit. The Deep Space Network has begun receiving high-resolution mineral spectra revealing clay carbonates and ancient delta deposits.',
      tag: 'TRIUMPH AT MARS',
    },
    partial: {
      publication: 'INTERSTELLAR OBSERVER',
      date: 'SOL 240 // PASADENA SPACE CORRIDOR',
      headline: 'RED FRONTIER ACHIEVES MARS ORBIT BUT SYSTEM WEAR LIMITS SPECTRAL HARVEST',
      subhead: 'Low solar flux and communications lag restrict volume of returned biosignature telemetry.',
      lede: 'Red Frontier has achieved orbit around the Red Planet, marking an undeniable engineering achievement. However, severe power throttling caused by inverse-square solar decay forced mission controllers to operate scientific instruments at a reduced duty cycle throughout the survey.',
      tag: 'PARTIAL VICTORY',
    },
    failure: {
      publication: 'GLOBAL EXPLORATION TIMES',
      date: 'INCIDENT TELEMETRY INQUEST',
      headline: 'RED FRONTIER DRIFTS PAST MARS: INSERTION FAILED IN DEEP SPACE FREEZE',
      subhead: 'Interplanetary probe runs dry of propulsion and power before completing Mars orbit capture.',
      lede: 'Silence fell over Mission Control today as the expected Mars orbit insertion carrier signal failed to materialize. Post-mortem telemetry indicates the spacecraft suffered crippling power starvation as it drifted away from the Sun, leaving its thrusters unpowered at the critical braking node.',
      tag: 'LOST IN TRANSIT',
    },
  },
  'mission-asteroid-scout': {
    stellar: {
      publication: 'ASTEROID DEFENSE & MINING CHRONICLE',
      date: 'DAY 360 // DEEP SPACE TRACKING RADAR',
      headline: 'DEEP PRIMITIVE RENDEZVOUS WITH BENNU: MAPS PRIMORDIAL ORGANIC COMPOUNDS',
      subhead: 'Autonomous ion-drive spacecraft reveals carbonaceous chemistry from the Solar System’s dawn.',
      lede: 'In one of the most audacious deep-space missions ever flown, Deep Primitive completed a 360-day ion-propulsion cruise across Bennu\'s orbit (0.90 to 1.36 AU) to lock into close rendezvous with asteroid 101955 Bennu. The probe returned pristine laser altimetry and mass spectrometry confirming hydrated clays and amino-acid building blocks.',
      tag: 'DEEP SPACE MASTERY',
    },
    partial: {
      publication: 'AEROSPACE TECHNOLOGY WEEKLY',
      date: 'DAY 360 // NEAREARTH MONITOR',
      headline: 'DEEP PRIMITIVE GRAZES BENNU WITH SCATTERED SPECTROMETRY HARVEST',
      subhead: 'Thruster propellant squeeze and extreme comms lag complicate autonomous proximity ops.',
      lede: 'Deep Primitive successfully reached the vicinity of asteroid Bennu today, sending back low-resolution surface imagery and coarse gravitational readings. Tight propulsion margins and recorder overflow prevented the execution of high-detail proximity imaging passes.',
      tag: 'LIMITED SUCCESS',
    },
    failure: {
      publication: 'PLANETARY SOCIETY BULLETIN',
      date: 'MISSION TELEMETRY ARCHIVE',
      headline: 'DEEP PRIMITIVE TUMBLE: ASTEROID PROXIMITY OPS TERMINATED BY ATTITUDE ANOMALY',
      subhead: 'Microgravity navigation error and depleted reaction wheels leave spacecraft lost in heliocentric orbit.',
      lede: 'Ground radar has confirmed that Deep Primitive missed its rendezvous trajectory with asteroid Bennu. With depleted fuel reserves and unresponsive guidance electronics, the probe has entered an untracked orbit around the Sun.',
      tag: 'MISSION TERMINATED',
    },
  },
};

// ============================================================================
// 4. DYNAMIC COMMENTARY SELECTOR
// ============================================================================
export function getFlightDirectorComment(
  missionId: string,
  state: FlightState,
  action: FlightAction,
  hasEventModal: boolean = false
): {
  situation: 'lowBattery' | 'dataFull' | 'healthDamaged' | 'goodScience' | 'nominalCruise' | 'maneuver' | 'safeMode';
  directorName: string;
  callsign: string;
  badge: 'CRITICAL' | 'WARNING' | 'NOMINAL' | 'EXCELLING';
  badgeColor: string;
  line: DirectorLine;
} {
  const director = MISSION_BRIEFINGS[missionId] || {
    directorName: 'Flight Director Sofia Reyes',
    callsign: 'FLIGHT',
  };

  // Determine situation hierarchy (most critical first)
  if (state.isSafeMode || state.batterySoC <= 10) {
    const lines = FLIGHT_DIRECTOR_LINES.safeMode;
    const line = lines[state.turn % lines.length];
    return {
      situation: 'safeMode',
      directorName: director.directorName,
      callsign: director.callsign,
      badge: 'CRITICAL',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      line,
    };
  }

  if (state.batterySoC < 38) {
    const lines = FLIGHT_DIRECTOR_LINES.lowBattery;
    const line = lines[state.turn % lines.length];
    return {
      situation: 'lowBattery',
      directorName: director.directorName,
      callsign: director.callsign,
      badge: 'WARNING',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      line,
    };
  }

  const storagePct = (state.storedDataGb / Math.max(1, state.maxStorageGb)) * 100;
  if (storagePct >= 82 || state.dataLossGb > 0) {
    const lines = FLIGHT_DIRECTOR_LINES.dataFull;
    const line = lines[state.turn % lines.length];
    return {
      situation: 'dataFull',
      directorName: director.directorName,
      callsign: director.callsign,
      badge: 'WARNING',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      line,
    };
  }

  if (state.craftHealth < 65) {
    const lines = FLIGHT_DIRECTOR_LINES.healthDamaged;
    const line = lines[state.turn % lines.length];
    return {
      situation: 'healthDamaged',
      directorName: director.directorName,
      callsign: director.callsign,
      badge: 'WARNING',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      line,
    };
  }

  if (action === 'observe' && state.scienceCollected >= 50) {
    const lines = FLIGHT_DIRECTOR_LINES.goodScience;
    const line = lines[state.turn % lines.length];
    return {
      situation: 'goodScience',
      directorName: director.directorName,
      callsign: director.callsign,
      badge: 'EXCELLING',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      line,
    };
  }

  if (action === 'maneuver') {
    const lines = FLIGHT_DIRECTOR_LINES.maneuver;
    const line = lines[state.turn % lines.length];
    return {
      situation: 'maneuver',
      directorName: director.directorName,
      callsign: director.callsign,
      badge: 'NOMINAL',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      line,
    };
  }

  // Nominal fallback
  const lines = FLIGHT_DIRECTOR_LINES.nominalCruise;
  const line = lines[state.turn % lines.length];
  return {
    situation: 'nominalCruise',
    directorName: director.directorName,
    callsign: director.callsign,
    badge: 'NOMINAL',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    line,
  };
}

// ============================================================================
// 5. GET HEADLINE FOR DEBRIEF
// ============================================================================
export interface FlightHeadlineContext {
  batteryHitZero?: boolean;
  deltaVDeficit?: boolean;
  missionName?: string;
}

export function getMissionDebriefHeadline(
  missionId: string,
  score: number,
  completed: boolean,
  context?: FlightHeadlineContext
): MissionHeadline {
  const set = MISSION_NEWS_HEADLINES[missionId] || MISSION_NEWS_HEADLINES['mission-earth-obs'];
  const name = context?.missionName || (missionId === 'mission-lunar-echo' ? 'Artemis Surveyor' : missionId === 'mission-mars-frontier' ? 'Red Frontier' : missionId === 'mission-asteroid-scout' ? 'Deep Primitive' : 'Orbital Sentinel');

  // Success (75+)
  if (completed && score >= 75) {
    return set.stellar;
  }

  const batteryHitZero = !!context?.batteryHitZero;
  const deltaVDeficit = !!context?.deltaVDeficit;

  // Failure (< 40)
  if (!completed || score < 40) {
    // Battery headline ONLY if battery hit 0
    if (batteryHitZero) {
      return {
        publication: 'SPACEFLIGHT INVESTIGATION WIRE',
        date: 'POST-FLIGHT ANOMALY REVIEW',
        headline: `${name.toUpperCase()} SILENCED BY COMPLETE BATTERY DEPLETION`,
        subhead: 'Spacecraft enters permanent safe mode following battery exhaustion in eclipse shadow.',
        lede: 'Telemetry confirmed the spacecraft suffered terminal electrical depletion during shadow transit. Battery reserves hit zero, triggering irreversible safe mode shutdown before solar re-emergence.',
        tag: 'BATTERY COLLAPSE',
      };
    }
    // Δv headline ONLY if Δv < required
    if (deltaVDeficit) {
      return {
        publication: 'ORBITAL DYNAMICS JOURNAL',
        date: 'TRAJECTORY INQUEST',
        headline: `${name.toUpperCase()} TRAJECTORY FAILS: INSUFFICIENT DELTA-V SHORTFALL`,
        subhead: 'Propulsion stage depleted before achieving target orbital insertion velocity.',
        lede: 'Trajectory analysis confirmed the spacecraft fell short of the required velocity budget. The engine lacked sufficient delta-v to execute insertion, stranding the probe off-target.',
        tag: 'DELTA-V SHORTFALL',
      };
    }
    // General failure without battery or Δv
    return {
      publication: 'AEROSPACE REVIEW BOARD',
      date: 'POST-FLIGHT TELEMETRY BRIEFING',
      headline: `${name.toUpperCase()} LOST TO CRITICAL SUBSYSTEM DEGRADATION`,
      subhead: 'Severe hardware wear and anomalies terminate operations ahead of science targets.',
      lede: 'A formal inquiry confirmed telemetry loss due to structural and avionics damage sustained during flight operations, preventing the vehicle from fulfilling its mission.',
      tag: 'MISSION TERMINATED',
    };
  }

  // Partial Success (40 - 74)
  if (batteryHitZero) {
    return {
      publication: 'AEROSPACE DAILY REPORT',
      date: 'MISSION TELEMETRY DESK',
      headline: `${name.toUpperCase()} SECURES CORE SCIENCE DESPITE BATTERY BROWNOUTS`,
      subhead: 'Electrical storage hit zero during shadow, but subsequent solar recharge salvaged primary records.',
      lede: 'Operating through severe power brownouts in orbital shadow, mission controllers successfully rebooted the spacecraft and downlinked vital scientific observations.',
      tag: 'PARTIAL RECOVERY',
    };
  }
  if (deltaVDeficit) {
    return {
      publication: 'INTERPLANETARY OBSERVER',
      date: 'MISSION DAY UPDATE',
      headline: `${name.toUpperCase()} ACHIEVES RESTRICTED ORBIT UNDER DELTA-V CONSTRAINTS`,
      subhead: 'Propulsion shortfall restricted final survey orbit, limiting total science coverage.',
      lede: 'The spacecraft completed orbital insertion but exhausted its velocity reserves early. While essential measurements were returned, trajectory limitations restricted observation sweeps.',
      tag: 'RESTRICTED ORBIT',
    };
  }

  return set.partial;
}
