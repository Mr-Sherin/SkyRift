export interface ConOpsPhaseTask {
  phase: 'launch' | 'transit' | 'science' | 'downlink' | 'closeout';
  phaseTitle: string;
  tagline: string;
  iconName: 'Rocket' | 'Compass' | 'Sparkles' | 'Radio' | 'CheckCircle2';
  spacecraftTasks: string;
  keyChallenge: string;
}

export interface MissionConOps {
  missionId: string;
  missionName: string;
  destinationName: string;
  speaker: string;
  callsign: string;
  whatWeLearn: string;
  whereWeGo: string;
  orbitParameters: string;
  phases: ConOpsPhaseTask[];
}

export const MISSION_CONOPS: Record<string, MissionConOps> = {
  'mission-earth-obs': {
    missionId: 'mission-earth-obs',
    missionName: 'Orbital Sentinel',
    destinationName: 'Low Earth Orbit (LEO)',
    speaker: 'Sofia Reyes',
    callsign: 'OPS // Flight Director',
    whatWeLearn:
      'We are monitoring global climate change, tracking acute wildfire thermal hotzones, evaluating agricultural crop hydration, and measuring polar ice shelf calving rates.',
    whereWeGo:
      'A 600-km circular Sun-Synchronous Orbit (SSO) inclined at 98.2°. The spacecraft orbits Earth every 96 minutes, passing over both poles to deliver global optical coverage.',
    orbitParameters: 'Altitude: 600 km • Inclination: 98.2° SSO • Period: 96 min • Dark Eclipse: 35 min/orbit',
    phases: [
      {
        phase: 'launch',
        phaseTitle: 'Phase 1: Launch & Ascent',
        tagline: 'Clear aerodynamic max-q and achieve stable LEO parking orbit',
        iconName: 'Rocket',
        spacecraftTasks:
          'Ascend through dense troposphere on a cost-effective launcher (AeroDart), jettison fairings at 110 km altitude, and separate booster stages.',
        keyChallenge: 'Keep spacecraft total wet mass under 550 kg to match small launch vehicle lift limits.',
      },
      {
        phase: 'transit',
        phaseTitle: 'Phase 2: Orbit Insertion & Solar Deployment',
        tagline: 'Circularize into 600 km Sun-Synchronous frozen orbit',
        iconName: 'Compass',
        spacecraftTasks:
          'Fire 350 m/s delta-V circularization burn, deploy solar array wings toward the Sun, and initialize reaction wheels for 3-axis nadir pointing.',
        keyChallenge: 'Acquire Sun lock and verify power positive generation within 15 minutes of booster separation.',
      },
      {
        phase: 'science',
        phaseTitle: 'Phase 3: Science Operations',
        tagline: 'High-cadence multispectral surface observation passes',
        iconName: 'Sparkles',
        spacecraftTasks:
          'Slew multispectral optical telescope toward Earth targets; capture calibrated visible, near-IR, and thermal bands into solid-state memory buffer.',
        keyChallenge: 'Survive 35 minutes of total solar eclipse every orbit without draining onboard battery below 40% DoD.',
      },
      {
        phase: 'downlink',
        phaseTitle: 'Phase 4: Ground Data Downlink',
        tagline: 'Beam stored observations through ground station passes',
        iconName: 'Radio',
        spacecraftTasks:
          'Lock S-band or X-band antenna onto polar ground tracking stations (NEN) during 10-minute horizon passes, transferring buffered raw imaging data.',
        keyChallenge: 'Clear on-board solid-state memory buffer before storage hits 100% full to prevent observation drops.',
      },
      {
        phase: 'closeout',
        phaseTitle: 'Phase 5: End of Mission Disposal',
        tagline: 'Automated de-orbit burn to prevent orbital debris',
        iconName: 'CheckCircle2',
        spacecraftTasks:
          'Reserve final propellant reserve to fire retro-burn lowering perigee into upper atmosphere for a safe, destructive atmospheric entry within 25 years.',
        keyChallenge: 'Strict NASA LEO orbital debris mitigation compliance; zero fragmentation.',
      },
    ],
  },

  'mission-lunar-echo': {
    missionId: 'mission-lunar-echo',
    missionName: 'Artemis Surveyor',
    destinationName: 'Lunar Polar Orbit',
    speaker: 'Kai Mercer',
    callsign: 'ENG // Spacecraft Systems Lead',
    whatWeLearn:
      'We are prospecting permanently shadowed craters (e.g. Shackleton Crater) for subsurface water-ice deposits and volatile hydrogen reserves to sustain upcoming Artemis astronaut basecamps.',
    whereWeGo:
      'A 100-km circular polar orbit around the Moon. Because the Moon has no atmosphere, orbital flight is stable but faces 48-minute communications eclipses behind the lunar farside.',
    orbitParameters: 'Distance: 384,400 km (1.0 AU) • Orbit: 100 km Polar • Period: 118 min • Communications Shadow: 48 min',
    phases: [
      {
        phase: 'launch',
        phaseTitle: 'Phase 1: Launch & Earth Escape',
        tagline: 'High-energy injection into Trans-Lunar trajectory',
        iconName: 'Rocket',
        spacecraftTasks:
          'Launch on a reusable medium booster (Valkyrie-9) carrying sufficient upper-stage delta-V to escape Earth gravity well and enter cislunar transfer.',
        keyChallenge: 'Verify structure and antenna latch integrity under high vibrational launch acoustic loads.',
      },
      {
        phase: 'transit',
        phaseTitle: 'Phase 2: Cislunar Transit & Lunar Orbit Insertion (LOI)',
        tagline: '3-day cislunar cruise and 3,955 m/s orbital insertion burn',
        iconName: 'Compass',
        spacecraftTasks:
          'Execute Trans-Lunar Injection (3,155 m/s), conduct mid-course correction maneuvers, and fire a critical retro-burn (800 m/s LOI) to brake into lunar gravity capture.',
        keyChallenge: 'Precise trajectory timing; missing LOI burn results in an unrecoverable heliocentric drift.',
      },
      {
        phase: 'science',
        phaseTitle: 'Phase 3: Polar Science Operations',
        tagline: 'Radar sounding and neutron spectroscopy over polar cold traps',
        iconName: 'Sparkles',
        spacecraftTasks:
          'Direct Synthetic Aperture Radar (SAR) and Neutron Spectrometers down into permanently shadowed crater floors, measuring hydrogen suppression signatures.',
        keyChallenge: 'Survive extreme cryogenic thermal shadow swings (-230°C) using passive MLI blankets and thermal heaters.',
      },
      {
        phase: 'downlink',
        phaseTitle: 'Phase 4: Farside Buffer & DSN Downlink',
        tagline: 'Deep Space Network communication passes',
        iconName: 'Radio',
        spacecraftTasks:
          'Buffer observation data in radiation-hardened memory during 48-minute farside passes; dump high-speed telemetry as soon as Earth rises above the lunar limb.',
        keyChallenge: 'Manage ground antenna acquisition handoffs across Goldstone, Madrid, and Canberra DSN stations.',
      },
      {
        phase: 'closeout',
        phaseTitle: 'Phase 5: Targeted Surface Impact',
        tagline: 'Controlled kinetic impact for secondary science',
        iconName: 'CheckCircle2',
        spacecraftTasks:
          'Perform a targeted de-orbit burn onto an unmapped crater wall, producing a controlled plume observation for trailing orbital assets before decommissioning.',
        keyChallenge: 'Guarantee impact avoids historical Apollo landing preservation heritage zones.',
      },
    ],
  },

  'mission-mars-frontier': {
    missionId: 'mission-mars-frontier',
    missionName: 'Red Frontier',
    destinationName: 'Areocentric Orbit & Upper Atmosphere',
    speaker: 'Dr. Lena Okafor',
    callsign: 'SCI // Lead Astrobiologist',
    whatWeLearn:
      'We are searching for mineral biosignatures, organic carbon matrices, and investigating how the solar wind strips the Martian atmosphere into deep space.',
    whereWeGo:
      'A 7-month heliocentric transfer to Mars at 1.52 AU from the Sun. Sunlight intensity drops to 43% of Earth levels, and radio signals face up to 20 minutes of light-speed communications delay.',
    orbitParameters: 'Distance: 1.524 AU • Solar Irradiance: 43% of Earth • Round-trip Light Delay: ~24 min • Mission: 240 days',
    phases: [
      {
        phase: 'launch',
        phaseTitle: 'Phase 1: Launch & Trans-Mars Injection',
        tagline: 'Flagship booster launch into interplanetary escape',
        iconName: 'Rocket',
        spacecraftTasks:
          'Ignite triple-core heavy launcher (Titan-Heavy), sending a heavily shielded multi-ton platform into an interplanetary Hohmann transfer trajectory.',
        keyChallenge: 'Massive spacecraft wet mass demands maximum payload lift margin.',
      },
      {
        phase: 'transit',
        phaseTitle: 'Phase 2: 7-Month Interplanetary Cruise & Mars Capture',
        tagline: 'Deep-space navigation and 4,300 m/s capture burn',
        iconName: 'Compass',
        spacecraftTasks:
          'Survive interplanetary radiation cruise with autonomous star-tracker attitude control; ignite bipropellant engine for a 4,300 m/s capture burn at Mars closest approach.',
        keyChallenge: 'Autonomous execution required due to 20-minute communications latency with Earth control.',
      },
      {
        phase: 'science',
        phaseTitle: 'Phase 3: Science Survey & Raman Spectroscopy',
        tagline: 'Planetary mineralogy and magnetic field atmospheric surveys',
        iconName: 'Sparkles',
        spacecraftTasks:
          'Deploy dual-fluxgate magnetometer boom; activate laser Raman spectrometer during periapsis passes to detect organic carbonates and biosignatures.',
        keyChallenge: 'Dim sunlight (43%) requires RTG nuclear power or oversized solar wings to prevent brownouts.',
      },
      {
        phase: 'downlink',
        phaseTitle: 'Phase 4: High-Latency DSN Transmissions',
        tagline: 'High-gain parabolic dish links with Earth 70-meter dishes',
        iconName: 'Radio',
        spacecraftTasks:
          'Slew 1.5-meter Cassegrain dish precisely toward Earth; stream compressed scientific observations via X-band/Ka-band deep space frequencies.',
        keyChallenge: 'Extreme pointing accuracy (±0.1°) required to maintain link across hundreds of millions of kilometers.',
      },
      {
        phase: 'closeout',
        phaseTitle: 'Phase 5: Planetary Protection Quarantine',
        tagline: 'Quarantine orbit insertion preventing contamination',
        iconName: 'CheckCircle2',
        spacecraftTasks:
          'Maneuver into a stable, long-duration quarantine orbit with 100+ year orbital lifetime, complying with COSPAR and NASA planetary protection standards.',
        keyChallenge: 'Strict prohibition against accidental impact on Mars special astrobiology regions.',
      },
    ],
  },

  'mission-asteroid-scout': {
    missionId: 'mission-asteroid-scout',
    missionName: 'Deep Primitive',
    destinationName: 'Near-Earth Asteroid (101955 Bennu)',
    speaker: 'Ravi Anand',
    callsign: 'NAV // Flight Dynamics Officer',
    whatWeLearn:
      'We are characterizing the spin state, microgravity gravitational field, surface regolith elemental chemistry, and pristine carbonaceous matrix of a primitive asteroid.',
    whereWeGo:
      'Deep space rendezvous with asteroid Bennu (orbiting between 0.90 and 1.36 AU from the Sun). The target is a 500-meter rubble-pile asteroid with microgravity so weak that solar radiation pressure can perturb the orbit.',
    orbitParameters: 'Distance: 0.90–1.36 AU • Solar Irradiance: 54%–123% (aphelion/perihelion) • Target Diameter: ~500 m • Surface Gravity: ~0.00001 g',
    phases: [
      {
        phase: 'launch',
        phaseTitle: 'Phase 1: Launch & Heliocentric Departure',
        tagline: 'Escape Earth on high-cadence commercial booster',
        iconName: 'Rocket',
        spacecraftTasks:
          'Lift off aboard a dedicated launcher, deploying deployable arrays and initializing autonomous optical guidance systems immediately after stage separation.',
        keyChallenge: 'Verify xenon propellant tank pressurization and ion engine grid isolation.',
      },
      {
        phase: 'transit',
        phaseTitle: 'Phase 2: Low-Thrust Ion Cruise & Optical Navigation',
        tagline: '5,200 m/s continuous ion propulsion rendezvous cruise across Bennu orbit (0.90–1.36 AU)',
        iconName: 'Compass',
        spacecraftTasks:
          'Fire high-efficiency Xenon Ion propulsion (3,800s Isp) across months of continuous thrust, tracking asteroid star fields for terminal approach.',
        keyChallenge: 'Low thrust requires thousands of hours of flawless continuous thruster firing.',
      },
      {
        phase: 'science',
        phaseTitle: 'Phase 3: Proximity Operations & Regolith Characterization',
        tagline: 'Close-proximity stationkeeping and spectroscopy',
        iconName: 'Sparkles',
        spacecraftTasks:
          'Stationkeep within 1 km of the tumbling rubble-pile asteroid; conduct high-resolution optical shape modeling and laser Raman spectroscopy.',
        keyChallenge: 'Microgravity and outgassing particle plumes threaten spacecraft attitude stability.',
      },
      {
        phase: 'downlink',
        phaseTitle: 'Phase 4: Low-Bandwidth Interplanetary Relay',
        tagline: 'Deep Space Network tracking and shape model downlink',
        iconName: 'Radio',
        spacecraftTasks:
          'Compress 3D point cloud radar maps and multispectral images; downlink in queued bursts during DSN 70m antenna allocation windows.',
        keyChallenge: 'Extremely weak received signal power requires high error-correction coding.',
      },
      {
        phase: 'closeout',
        phaseTitle: 'Phase 5: Heliocentric Trailing Disposal',
        tagline: 'Clean departure burn into stable heliocentric orbit',
        iconName: 'CheckCircle2',
        spacecraftTasks:
          'Fire final ion burn to depart the asteroid proximity zone, entering a permanent interplanetary heliocentric orbit clear of Earth crossing paths.',
        keyChallenge: 'Ensure departure trajectory does not intersect future asteroid deflection test corridors.',
      },
    ],
  },
};

export function getMissionConOps(missionId: string): MissionConOps {
  return MISSION_CONOPS[missionId] || MISSION_CONOPS['mission-earth-obs'];
}

