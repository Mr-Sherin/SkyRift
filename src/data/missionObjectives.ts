import { SpacecraftComponent } from '@/game/types';

export type MissionObjectiveType =
  | 'earth-observation'
  | 'lunar-water-ice'
  | 'mars-surface-atmosphere'
  | 'asteroid-sample-composition';

export interface MissionObjectiveInfo {
  type: MissionObjectiveType;
  label: string;
  shortLabel: string;
  description: string;
  primaryScienceGoal: string;
}

export const MISSION_OBJECTIVES: Record<string, MissionObjectiveInfo> = {
  'mission-earth-obs': {
    type: 'earth-observation',
    label: 'Earth Observation',
    shortLabel: 'Earth Obs',
    description: 'High-cadence multispectral remote sensing of wildfire outbreaks, crop hydration, and polar ice caps.',
    primaryScienceGoal: 'Deliver at least 250 GB of calibrated multispectral Earth observations.',
  },
  'mission-lunar-echo': {
    type: 'lunar-water-ice',
    label: 'Lunar Water Ice',
    shortLabel: 'Lunar Ice',
    description: 'Direct subsurface volatile prospecting inside permanently shadowed polar craters (e.g. Shackleton).',
    primaryScienceGoal: 'Detect buried hydrogen and water-ice deposits using subsurface radar or neutron suppression.',
  },
  'mission-mars-frontier': {
    type: 'mars-surface-atmosphere',
    label: 'Mars Surface/Atmosphere',
    shortLabel: 'Mars Atmos',
    description: 'Characterize Martian organic mineralogy, rock matrices, and atmospheric solar wind magnetic interaction.',
    primaryScienceGoal: 'Capture mineral Raman biosignatures and trace atmospheric escape vectors.',
  },
  'mission-asteroid-scout': {
    type: 'asteroid-sample-composition',
    label: 'Asteroid Sample/Composition',
    shortLabel: 'Asteroid Sample',
    description: 'Autonomous proximity reconnaissance, regolith elemental mapping, and pristine carbonaceous matrix characterization.',
    primaryScienceGoal: 'Map surface regolith chemistry, spin dynamics, and mineral composition.',
  },
};

export interface InstrumentCompatibility {
  partId: string;
  partName: string;
  compatibleObjectives: MissionObjectiveType[];
  incompatibleReasons: Record<MissionObjectiveType, string>;
}

export const SCIENCE_COMPATIBILITY: Record<string, InstrumentCompatibility> = {
  'inst-multispectral': {
    partId: 'inst-multispectral',
    partName: 'Multi-Spectral Imaging Telescope',
    compatibleObjectives: ['earth-observation', 'asteroid-sample-composition'],
    incompatibleReasons: {
      'earth-observation': '',
      'lunar-water-ice':
        'Visible and near-IR cameras cannot peer into permanently shadowed polar craters where sunlight never reaches; detecting lunar water ice requires radar sounders or neutron spectrometers.',
      'mars-surface-atmosphere':
        'Standard optical telescopes cannot isolate Martian trace atmospheric gases or crystalline rock biosignatures without laser spectroscopy.',
      'asteroid-sample-composition': '',
    },
  },
  'inst-sar-radar': {
    partId: 'inst-sar-radar',
    partName: 'Synthetic Aperture Radar (SAR)',
    compatibleObjectives: ['lunar-water-ice'],
    incompatibleReasons: {
      'earth-observation':
        'A radar sounder is useful for finding ice under the surface, not for imaging crops.',
      'lunar-water-ice': '',
      'mars-surface-atmosphere':
        'A heavy 380W SAR radar exceeds areocentric cruise power budgets; atmosphere and surface mineralogy require Raman spectrometers and magnetometers.',
      'asteroid-sample-composition':
        'Massive radar antennas exceed microgravity asteroid scout mass limits; optical cameras and spectrometers are required for regolith mapping.',
    },
  },
  'inst-gamma-neutron': {
    partId: 'inst-gamma-neutron',
    partName: 'Gamma-Ray & Neutron Spectrometer',
    compatibleObjectives: ['lunar-water-ice', 'asteroid-sample-composition'],
    incompatibleReasons: {
      'earth-observation':
        'Neutron spectrometers measure cosmic ray secondary hydrogen on airless bodies; Earth’s thick atmosphere scatters the neutron signal before reaching orbit.',
      'lunar-water-ice': '',
      'mars-surface-atmosphere':
        'Bulk neutron counts cannot identify complex surface organic compounds or atmospheric loss on Mars; Raman laser spectroscopy is required.',
      'asteroid-sample-composition': '',
    },
  },
  'inst-magnetometer': {
    partId: 'inst-magnetometer',
    partName: 'Dual-Fluxgate Magnetometer Boom',
    compatibleObjectives: ['mars-surface-atmosphere', 'asteroid-sample-composition'],
    incompatibleReasons: {
      'earth-observation':
        'A magnetometer measures core dynamos and solar wind fields, not multispectral agriculture, forest cover, or weather patterns.',
      'lunar-water-ice':
        'The Moon lacks an active core dynamo; detecting shadowed crater water ice requires radar sounding or neutron spectroscopy.',
      'mars-surface-atmosphere': '',
      'asteroid-sample-composition': '',
    },
  },
  'inst-raman-spectro': {
    partId: 'inst-raman-spectro',
    partName: 'Mars Mineral Raman Spectrometer',
    compatibleObjectives: ['mars-surface-atmosphere', 'asteroid-sample-composition'],
    incompatibleReasons: {
      'earth-observation':
        'A contact laser Raman spectrometer is engineered for planetary rock surfaces, not wide-area Earth environmental remote sensing.',
      'lunar-water-ice':
        'Laser Raman spectrometers examine surface crystal lattices and cannot penetrate meters below polar regolith to quantify bulk volatile ice deposits in shadowed craters.',
      'mars-surface-atmosphere': '',
      'asteroid-sample-composition': '',
    },
  },
};

export function isInstrumentCompatible(
  partId: string,
  objectiveType?: MissionObjectiveType
): boolean {
  if (!objectiveType) return true;
  const entry = SCIENCE_COMPATIBILITY[partId];
  if (!entry) return true; // Non-payload or unknown parts are not locked by science objectives
  return entry.compatibleObjectives.includes(objectiveType);
}

export function getInstrumentIncompatibilityReason(
  partId: string,
  objectiveType?: MissionObjectiveType
): string {
  if (!objectiveType) return '';
  const entry = SCIENCE_COMPATIBILITY[partId];
  if (!entry) return '';
  return entry.incompatibleReasons[objectiveType] || 'This instrument is not optimized for this mission objective.';
}

export interface RealMissionVerifiableSpecs {
  launchMassKg: number;
  launchMassFormatted: string;
  targetOrbit: string;
  instrumentCount: number;
  primaryInstruments: string;
  powerSystem?: string;
}

export interface RealMissionAnalog {
  name: string;
  agencyYear: string;
  targetDestination: string;
  scientificGoal: string;
  matchedInstruments: string[];
  keyDifference: string;
  sourceStatus: 'verify before submission' | 'nasa';
  url: string;
  verifiableSpecs: RealMissionVerifiableSpecs;
}

export const SIMILAR_REAL_MISSIONS: Record<string, RealMissionAnalog[]> = {
  'mission-earth-obs': [
    {
      name: 'Landsat 9',
      agencyYear: 'NASA / USGS • 2021',
      targetDestination: 'Low Earth Orbit (705 km SSO)',
      scientificGoal:
        'Continuous multispectral environmental imaging of Earth land surfaces, forest cover, agriculture, and coastal zones.',
      matchedInstruments: ['Multi-Spectral Imaging Telescope'],
      keyDifference:
        'Landsat 9 is a massive 2,711 kg observatory equipped with OLI-2 (9 spectral bands) and TIRS-2 (2 thermal infrared bands), whereas your craft is an agile SmallSat design focused on targeted tactical observation passes.',
      sourceStatus: 'nasa',
      url: 'https://landsat.gsfc.nasa.gov/satellites/landsat-9/',
      verifiableSpecs: {
        launchMassKg: 2711,
        launchMassFormatted: '2,711 kg (5,977 lb)',
        targetOrbit: '705 km Sun-Synchronous LEO (98.2° inclination, 99 min period)',
        instrumentCount: 2,
        primaryInstruments: 'OLI-2 (Operational Land Imager 2, 9 spectral bands) & TIRS-2 (Thermal Infrared Sensor 2, 2 bands)',
        powerSystem: 'Single-wing 5-panel deployable solar array (1,550 W at EOL)',
      },
    },
  ],
  'mission-lunar-echo': [
    {
      name: 'Lunar Reconnaissance Orbiter (LRO)',
      agencyYear: 'NASA / GSFC • 2009',
      targetDestination: 'Lunar Polar Orbit (50–100 km)',
      scientificGoal:
        'Global lunar topographic mapping, radiation characterization, and prospecting permanently shadowed polar regions for water-ice.',
      matchedInstruments: ['Synthetic Aperture Radar (SAR)', 'Gamma-Ray & Neutron Spectrometer'],
      keyDifference:
        'LRO carries seven heavy scientific suites (including LEND neutron detectors and Mini-RF radar) powered by large articulable solar panels, whereas your spacecraft uses a streamlined single-bus payload configuration.',
      sourceStatus: 'nasa',
      url: 'https://science.nasa.gov/mission/lro/',
      verifiableSpecs: {
        launchMassKg: 1916,
        launchMassFormatted: '1,916 kg (1,018 kg dry mass + 898 kg propellant)',
        targetOrbit: '50 km × 50 km Lunar Polar Orbit (90° inclination, 113 min period)',
        instrumentCount: 7,
        primaryInstruments: 'LEND (neutron detector), LOLA (laser altimeter), Mini-RF (SAR radar), Diviner radiometer, LAMP UV, CRaTER, LROC',
        powerSystem: 'Articulated solar array (1,850 W) + 80 Ah Li-ion battery',
      },
    },
    {
      name: 'LCROSS (Lunar Crater Observation and Sensing Satellite)',
      agencyYear: 'NASA / Ames • 2009',
      targetDestination: 'Lunar South Pole (Cabeus Crater)',
      scientificGoal:
        'Confirm water-ice presence in permanently shadowed craters by analyzing the debris plume created by an intentional Centaur upper-stage impact.',
      matchedInstruments: ['Gamma-Ray & Neutron Spectrometer'],
      keyDifference:
        'LCROSS achieved direct water-ice detection via a deliberate destructive kinetic impact plume, whereas your surveyor conducts prolonged, non-destructive orbital radar and neutron suppression sensing.',
      sourceStatus: 'nasa',
      url: 'https://www.nasa.gov/mission/lcross/',
      verifiableSpecs: {
        launchMassKg: 891,
        launchMassFormatted: '891 kg spacecraft (+ 2,305 kg Centaur kinetic impactor)',
        targetOrbit: 'Lunar Gravity Assist to Cabeus Crater impact trajectory (84.9° S)',
        instrumentCount: 9,
        primaryInstruments: '5 visible/NIR/MIR cameras, 3 spectrometers (2 near-IR, 1 UV/Vis), 1 total-power photometer',
        powerSystem: 'Body-mounted solar cells (600 W peak)',
      },
    },
  ],
  'mission-mars-frontier': [
    {
      name: 'MAVEN (Mars Atmosphere and Volatile EvolutioN)',
      agencyYear: 'NASA / GSFC • 2013',
      targetDestination: 'Mars Elliptical Orbit',
      scientificGoal:
        'Investigate the loss of Mars atmosphere and water to space over time driven by solar wind magnetic field interactions.',
      matchedInstruments: ['Dual-Fluxgate Magnetometer Boom'],
      keyDifference:
        'MAVEN specializes in upper atmospheric escape dynamics with deployable magnetic booms and neutral spectrometers, whereas your spacecraft pairs magnetic sensing with active surface Raman mineralogy.',
      sourceStatus: 'nasa',
      url: 'https://science.nasa.gov/mission/maven/',
      verifiableSpecs: {
        launchMassKg: 2454,
        launchMassFormatted: '2,454 kg at launch (809 kg dry mass + 1,645 kg propellant)',
        targetOrbit: '150 km × 6,200 km elliptical orbit (75° inclination, 4.5 hr period)',
        instrumentCount: 8,
        primaryInstruments: 'SWEA, SWIA, STATIC, SEP, Dual Fluxgate Magnetometers, LPW, IUVS UV spectrograph, NGIMS mass spec',
        powerSystem: '2 gull-wing solar panels (1,135 W at 1.5 AU)',
      },
    },
    {
      name: 'Mars Reconnaissance Orbiter (MRO)',
      agencyYear: 'NASA / JPL • 2005',
      targetDestination: 'Low Mars Orbit (250–320 km)',
      scientificGoal:
        'High-resolution surface mineralogy, sub-surface radar sounding (SHARAD), and real-time atmospheric tracking.',
      matchedInstruments: ['Mars Mineral Raman Spectrometer'],
      keyDifference:
        'MRO is a flagship 2,180 kg orbiter with a massive 3-meter high-gain antenna dish and the 0.5-meter HiRISE optical telescope, requiring a vastly larger launch vehicle than your lean exploration probe.',
      sourceStatus: 'nasa',
      url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/',
      verifiableSpecs: {
        launchMassKg: 2180,
        launchMassFormatted: '2,180 kg at launch (1,031 kg dry mass + 1,149 kg propellant)',
        targetOrbit: '255 km × 320 km near-circular polar orbit (92.8° inclination, 112 min period)',
        instrumentCount: 6,
        primaryInstruments: 'HiRISE (0.5m telescope), CRISM spectrometer, SHARAD shallow radar, CTX camera, MARCI, MCS',
        powerSystem: '2 solar arrays 19 m² (2,000 W at Mars) + two 50 Ah NiH2 batteries',
      },
    },
  ],
  'mission-asteroid-scout': [
    {
      name: 'OSIRIS-REx',
      agencyYear: 'NASA / Lockheed Martin • 2016',
      targetDestination: 'Near-Earth Asteroid (101955 Bennu)',
      scientificGoal:
        'Rendezvous with pristine carbonaceous asteroid Bennu, map surface mineralogy, and return a physical regolith sample to Earth.',
      matchedInstruments: ['Multi-Spectral Imaging Telescope', 'Mars Mineral Raman Spectrometer'],
      keyDifference:
        'OSIRIS-REx performed physical Touch-And-Go (TAG) sample collection and returned a sample capsule to Earth, whereas your craft serves as an autonomous in-situ orbital science and spectroscopic characterization scout.',
      sourceStatus: 'nasa',
      url: 'https://science.nasa.gov/mission/osiris-rex/',
      verifiableSpecs: {
        launchMassKg: 2110,
        launchMassFormatted: '2,110 kg at launch (880 kg dry mass + 1,230 kg hydrazine propellant)',
        targetOrbit: 'Close proximity orbit (0.68 km – 1.75 km from center of 101955 Bennu)',
        instrumentCount: 5,
        primaryInstruments: 'OCAMS camera suite (PolyCam, MapCam, SamCam), OLA lidar, OVIRS spectrometer, OTES spectrometer, REXIS X-ray',
        powerSystem: 'Two low-mass solar panels (1,226 W at aphelion 1.36 AU)',
      },
    },
  ],
};

export function getSimilarRealMissions(missionId: string): RealMissionAnalog[] {
  return SIMILAR_REAL_MISSIONS[missionId] || SIMILAR_REAL_MISSIONS['mission-earth-obs'];
}

