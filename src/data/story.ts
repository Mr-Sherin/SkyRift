// ============================================================================
// SKY RIFT: OFFICIAL NARRATIVE STORYBOOK
// ============================================================================

export type StorySpeaker =
  | 'Sofia Reyes'
  | 'Kai Mercer'
  | 'Dr. Lena Okafor'
  | 'Ravi Anand'
  | 'Chair Voss';

export type DialogueMood =
  | 'calm'
  | 'dry'
  | 'nervous'
  | 'perfectionist'
  | 'excited'
  | 'curious'
  | 'humorous'
  | 'relaxed'
  | 'stern'
  | 'supportive'
  | 'relieved'
  | 'proud';

export interface DialogueLine {
  speaker: StorySpeaker;
  line: string; // Strictly under 25 words
  mood: DialogueMood;
}

export interface OutcomeScene {
  headline: string;
  subhead: string;
  dialogue: DialogueLine[];
  summary: string;
}

export interface MissionStory {
  missionId: string;
  missionName: string;
  chapterTitle: string;
  openingBriefing: DialogueLine[];
  midMissionCrisis: {
    title: string;
    description: string;
    dialogue: DialogueLine[];
  };
  outcomes: {
    success: OutcomeScene;
    partial: OutcomeScene;
    failure: OutcomeScene;
  };
  closingLine: DialogueLine;
}

export interface CampaignEnding {
  tier: 'Gold' | 'Silver' | 'Bronze';
  title: string;
  headline: string;
  scoreRange: string;
  dialogue: DialogueLine[];
  epilogue: string;
}

// ============================================================================
// CHARACTER ROSTER DEFINITIONS
// ============================================================================
export const CHARACTERS: Record<
  StorySpeaker,
  {
    name: StorySpeaker;
    role: string;
    personality: string;
    callsign: string;
  }
> = {
  'Sofia Reyes': {
    name: 'Sofia Reyes',
    role: 'Flight Director',
    personality: 'Calm, dry humor, unflappable in high-stress orbital countdowns.',
    callsign: 'FLIGHT',
  },
  'Kai Mercer': {
    name: 'Kai Mercer',
    role: 'Lead Spacecraft Engineer',
    personality: 'Nervous perfectionist who recalculates structural margins in his sleep.',
    callsign: 'SYSTEMS',
  },
  'Dr. Lena Okafor': {
    name: 'Dr. Lena Okafor',
    role: 'Science Lead',
    personality: 'Excitable planetary scientist who sees poetry in every spectral spike.',
    callsign: 'SCIENCE',
  },
  'Ravi Anand': {
    name: 'Ravi Anand',
    role: 'Communications & Operations',
    personality: 'Quick-witted, tells deadpan jokes through deep-space radio blackouts.',
    callsign: 'COMMS',
  },
  'Chair Voss': {
    name: 'Chair Voss',
    role: 'Funding Board Chair',
    personality: 'Cold, budget-conscious bureaucrat with a well-hidden heart of gold.',
    callsign: 'BOARD',
  },
};

// ============================================================================
// MISSION CHAPTERS (4 MISSION SCENARIOS)
// ============================================================================
export const MISSION_STORIES: Record<string, MissionStory> = {
  'mission-earth-obs': {
    missionId: 'mission-earth-obs',
    missionName: 'Orbital Sentinel',
    chapterTitle: 'Chapter 1: The First Window',
    openingBriefing: [
      {
        speaker: 'Chair Voss',
        line: 'The oversight committee expects clean telemetry and balanced accounting. Do not waste taxpayers’ launch grant on fireworks.',
        mood: 'stern',
      },
      {
        speaker: 'Sofia Reyes',
        line: 'Understood, Chair. Sentinel is parked in a 600-kilometer sun-synchronous orbit. We’re watching Earth wake up.',
        mood: 'calm',
      },
      {
        speaker: 'Dr. Lena Okafor',
        line: 'Just wait until you see the multispectral imagery! We can track polar ice calving before morning coffee.',
        mood: 'excited',
      },
      {
        speaker: 'Kai Mercer',
        line: 'Assuming the reaction wheels don’t vibrate our optical sensors loose. I checked the torque margins twice.',
        mood: 'nervous',
      },
      {
        speaker: 'Ravi Anand',
        line: 'Relax, Kai. Madrid ground station is locked on. Earth looks stunning from up here.',
        mood: 'relaxed',
      },
    ],
    midMissionCrisis: {
      title: 'Orbital Eclipse Thermal Drift',
      description: 'Sentinel slips into Earth’s shadow while secondary battery relays report thermal flux.',
      dialogue: [
        {
          speaker: 'Kai Mercer',
          line: 'Bus voltage dropped four volts during orbital night! Heaters are drawing more current than predicted.',
          mood: 'nervous',
        },
        {
          speaker: 'Dr. Lena Okafor',
          line: 'Keep the imagers warm! If the infrared sensor chills out of calibration, we lose the forest fire passes.',
          mood: 'excited',
        },
        {
          speaker: 'Ravi Anand',
          line: 'Good news: battery depth is holding. Bad news: we have twenty-eight minutes until sunrise.',
          mood: 'humorous',
        },
        {
          speaker: 'Sofia Reyes',
          line: 'Hold attitude steady. Safe power load shedding engaged. Nobody panic—we have five minutes of margin.',
          mood: 'calm',
        },
      ],
    },
    outcomes: {
      success: {
        headline: 'SENTINEL PROVIDES FLAWLESS CLIMATE DATA',
        subhead: 'Continuous multispectral coverage detects equatorial wildfire before ground sensors.',
        dialogue: [
          {
            speaker: 'Dr. Lena Okafor',
            line: 'Look at those absorption bands! We just delivered the sharpest vegetation index in agency history.',
            mood: 'excited',
          },
          {
            speaker: 'Kai Mercer',
            line: 'Thermal loops stayed within half a degree of nominal. I might actually sleep tonight.',
            mood: 'relieved',
          },
          {
            speaker: 'Chair Voss',
            line: 'Satisfactory work. You proved that frugality and precision can share the same payload bay.',
            mood: 'supportive',
          },
        ],
        summary: 'Orbital Sentinel completed all planned passes without battery brownouts, establishing a gold-standard baseline.',
      },
      partial: {
        headline: 'SENTINEL WEATHER OVERFLOW DISCARDS SECONDARY SCANS',
        subhead: 'Data recorder limits force selective telemetry downlinks during storm tracking.',
        dialogue: [
          {
            speaker: 'Ravi Anand',
            line: 'We dumped the primary storm tracks, but secondary ocean scans got overwritten when buffer topped out.',
            mood: 'humorous',
          },
          {
            speaker: 'Dr. Lena Okafor',
            line: 'We still caught the main storm front. It’s science, just slightly compressed.',
            mood: 'curious',
          },
          {
            speaker: 'Chair Voss',
            line: 'A pass is a pass. Next time, buy memory cards that don’t fill up by lunch.',
            mood: 'dry',
          },
        ],
        summary: 'Essential climate data returned safely, although storage bottlenecks trimmed secondary scientific returns.',
      },
      failure: {
        headline: 'SENTINEL SILENCED BY ECLIPSE POWER DRAIN',
        subhead: 'Spacecraft enters permanent safe mode following battery exhaustion in low Earth orbit.',
        dialogue: [
          {
            speaker: 'Kai Mercer',
            line: 'Batteries died twelve minutes before solar re-emergence. Bus tripped and never recovered.',
            mood: 'nervous',
          },
          {
            speaker: 'Sofia Reyes',
            line: 'Log the telemetry anomaly. We lost the bird, but the failure data will protect the lunar mission.',
            mood: 'calm',
          },
          {
            speaker: 'Chair Voss',
            line: 'Failure is an expensive teacher, Flight Director. Make sure you took thorough notes.',
            mood: 'stern',
          },
        ],
        summary: 'Under-capacity energy storage led to blackout in orbital shadow; telemetry salvaged for redesign.',
      },
    },
    closingLine: {
      speaker: 'Sofia Reyes',
      line: 'Earth was our test flight. Pack your bags for the Moon.',
      mood: 'proud',
    },
  },

  'mission-lunar-echo': {
    missionId: 'mission-lunar-echo',
    missionName: 'Artemis Surveyor',
    chapterTitle: 'Chapter 2: Cold Shadows',
    openingBriefing: [
      {
        speaker: 'Dr. Lena Okafor',
        line: 'Shackleton Crater! Two billion years of untouched water-ice tucked inside permanent midnight.',
        mood: 'excited',
      },
      {
        speaker: 'Kai Mercer',
        line: 'Four thousand meters per second of delta-V required. If the braking burn is short, we become a lunar impact crater.',
        mood: 'nervous',
      },
      {
        speaker: 'Ravi Anand',
        line: 'Every time we swing behind the Moon, ground control drops to static for forty-eight minutes. Pure radio peace.',
        mood: 'humorous',
      },
      {
        speaker: 'Sofia Reyes',
        line: 'Autonomy scripts are verified. Trust your numbers and trust the spacecraft.',
        mood: 'calm',
      },
      {
        speaker: 'Chair Voss',
        line: 'The future of human lunar outposts rides on finding accessible hydrogen. Do not return empty-handed.',
        mood: 'stern',
      },
    ],
    midMissionCrisis: {
      title: 'Farside Comms Silence & Cold Trap Sag',
      description: 'Telemetry drops out behind the lunar limb while neutron spectrometer heaters strain battery banks.',
      dialogue: [
        {
          speaker: 'Ravi Anand',
          line: 'Carrier signal lost behind the lunar limb. Mission Control is officially alone with our thoughts.',
          mood: 'calm',
        },
        {
          speaker: 'Kai Mercer',
          line: 'Temperature on the spectrometer housing is minus one-eighty. Thermal blankets are straining against the chill.',
          mood: 'nervous',
        },
        {
          speaker: 'Dr. Lena Okafor',
          line: 'She’s flying right over the crater rim now. Wake up, little neutron detector, find us water.',
          mood: 'curious',
        },
        {
          speaker: 'Sofia Reyes',
          line: 'Clock is ticking. Stand by for AOS at Goldstone station in three, two, one...',
          mood: 'calm',
        },
      ],
    },
    outcomes: {
      success: {
        headline: 'WATER ICE CONFIRMED IN PERMANENT LUNAR SHADOW',
        subhead: 'Artemis Surveyor identifies billions of tons of accessible hydrogen at the lunar south pole.',
        dialogue: [
          {
            speaker: 'Dr. Lena Okafor',
            line: 'Hydrogen signatures lit up like a Christmas tree! Shackleton is practically an oasis!',
            mood: 'excited',
          },
          {
            speaker: 'Ravi Anand',
            line: 'Signal acquired right on the second. She even waved as she came around the limb.',
            mood: 'humorous',
          },
          {
            speaker: 'Chair Voss',
            line: 'Reyes, Okafor, Mercer... the Artemis crews will drink water you mapped today. Outstanding work.',
            mood: 'proud',
          },
        ],
        summary: 'Surveyor successfully mapped polar volatile deposits, unlocking fuel resources for humanity’s next steps.',
      },
      partial: {
        headline: 'SURVEYOR TRACES COARSE HYDROGEN BEFORE SENSOR BROWNOUT',
        subhead: 'Battery depletion trims polar mapping passes, but baseline ice reserves are verified.',
        dialogue: [
          {
            speaker: 'Kai Mercer',
            line: 'We brownout-shed the radar on orbit seven, but the neutron data survived in non-volatile memory.',
            mood: 'relieved',
          },
          {
            speaker: 'Dr. Lena Okafor',
            line: 'It’s enough to prove the ice is there. Not a complete map, but the treasure exists.',
            mood: 'curious',
          },
          {
            speaker: 'Chair Voss',
            line: 'You gave us a sketch instead of an oil painting. Still, it justifies the next expedition.',
            mood: 'supportive',
          },
        ],
        summary: 'Core water-ice readings were secured, though thermal constraints abbreviated radar mapping.',
      },
      failure: {
        headline: 'LUNAR BRAKING BURN UNDERPERFORMS: SURVEYOR DRIFTS',
        subhead: 'Propulsion deficit prevents lunar polar orbit capture; craft enters heliocentric graveyard orbit.',
        dialogue: [
          {
            speaker: 'Kai Mercer',
            line: 'Chamber pressure died fifty seconds early. We didn’t have the delta-V to brake into capture.',
            mood: 'nervous',
          },
          {
            speaker: 'Dr. Lena Okafor',
            line: 'She flew right over Shackleton and kept going. So close to those ice crystals...',
            mood: 'nervous',
          },
          {
            speaker: 'Sofia Reyes',
            line: 'Reorient antennas. She’s in solar orbit now. We learn, we refuel, and we try again.',
            mood: 'calm',
          },
        ],
        summary: 'Insufficient propulsion margin caused lunar orbit capture failure; telemetry archived.',
      },
    },
    closingLine: {
      speaker: 'Kai Mercer',
      line: 'The Moon was tough, but Mars is two hundred times farther away.',
      mood: 'nervous',
    },
  },

  'mission-mars-frontier': {
    missionId: 'mission-mars-frontier',
    missionName: 'Red Frontier',
    chapterTitle: 'Chapter 3: Across the Great Silence',
    openingBriefing: [
      {
        speaker: 'Sofia Reyes',
        line: 'Two hundred and forty days across deep space. Sunlight drops by more than half. Signals lag twenty minutes.',
        mood: 'calm',
      },
      {
        speaker: 'Dr. Lena Okafor',
        line: 'Jezero crater delta! Ancient clay minerals holding the story of whether life ever started twice!',
        mood: 'excited',
      },
      {
        speaker: 'Kai Mercer',
        line: 'Inverse-square law is merciless out here. If solar arrays don’t track accurately, the craft freezes solid.',
        mood: 'nervous',
      },
      {
        speaker: 'Ravi Anand',
        line: 'Twenty-minute delay means if I tell a joke now, Mars laughs after lunch.',
        mood: 'humorous',
      },
      {
        speaker: 'Chair Voss',
        line: 'Mars has broken dozens of spacecraft. Prove this agency belongs in interplanetary space.',
        mood: 'stern',
      },
    ],
    midMissionCrisis: {
      title: 'Solar Constant Decay & Deep Dust Storm',
      description: 'Sunlight intensity falls to 43% as a global dust storm blankets the areocentric orbital path.',
      dialogue: [
        {
          speaker: 'Kai Mercer',
          line: 'Solar panels generating forty-four percent of Earth baseline. We are two degrees above battery freezing limits!',
          mood: 'nervous',
        },
        {
          speaker: 'Ravi Anand',
          line: 'Dust storm is scattering the imaging wavelengths. It’s like squinting through tomato soup down there.',
          mood: 'humorous',
        },
        {
          speaker: 'Dr. Lena Okafor',
          line: 'Switch to infrared spectroscopy! The heat signatures will cut right through the atmospheric dust!',
          mood: 'excited',
        },
        {
          speaker: 'Sofia Reyes',
          line: 'Command queued. Now we wait twenty minutes for Mars to answer our handshake.',
          mood: 'calm',
        },
      ],
    },
    outcomes: {
      success: {
        headline: 'RED FRONTIER UNLOCKS MARTIAN LAKEBED BIOSIGNATURES',
        subhead: 'Spectrometry of Jezero Crater reveals clay carbonates formed in habitable ancient water.',
        dialogue: [
          {
            speaker: 'Dr. Lena Okafor',
            line: 'Clay carbonates and organic signatures in the delta sediments! Mars was alive with water!',
            mood: 'excited',
          },
          {
            speaker: 'Kai Mercer',
            line: 'Engine fired for exactly four hundred and twelve seconds. Trajectory error: zero point zero percent.',
            mood: 'proud',
          },
          {
            speaker: 'Chair Voss',
            line: 'Incredible. The global science community is stunned. Your budget renewal is guaranteed.',
            mood: 'supportive',
          },
        ],
        summary: 'Flawless interplanetary cruise and orbital insertion delivered breakthrough planetary biosignatures.',
      },
      partial: {
        headline: 'RED FRONTIER ORBITS MARS WITH DIMINISHED POWER RESERVE',
        subhead: 'Solar array dust accumulation forces instrument duty-cycling, preserving essential spectra.',
        dialogue: [
          {
            speaker: 'Ravi Anand',
            line: 'We had to take turns running instruments, but the core mineral maps made it to Earth.',
            mood: 'relaxed',
          },
          {
            speaker: 'Kai Mercer',
            line: 'She’s running cold, but attitude control is stable. She’ll survey for another year.',
            mood: 'relieved',
          },
          {
            speaker: 'Chair Voss',
            line: 'Not every Martian voyage is effortless. You brought back real science under hostile conditions.',
            mood: 'calm',
          },
        ],
        summary: 'Severe solar attenuation constrained instrument uptime, but major mineral targets were captured.',
      },
      failure: {
        headline: 'SOLAR POWER COLLAPSE STRANDS RED FRONTIER',
        subhead: 'Spacecraft succumbs to deep-space cold prior to Mars Orbit Insertion burn.',
        dialogue: [
          {
            speaker: 'Kai Mercer',
            line: 'Main bus went silent two weeks out from Mars. Cold broke the hydrazine tank valves.',
            mood: 'nervous',
          },
          {
            speaker: 'Dr. Lena Okafor',
            line: 'She sailed right past Mars in the dark. So many unanswered questions down in that lakebed.',
            mood: 'dry',
          },
          {
            speaker: 'Sofia Reyes',
            line: 'Mars tests every weld. We honor our craft by diagnosing why she went cold.',
            mood: 'calm',
          },
        ],
        summary: 'Thermal and solar energy deficit caused terminal bus shutdown prior to orbital capture.',
      },
    },
    closingLine: {
      speaker: 'Dr. Lena Okafor',
      line: 'One more frontier remains: a five-hundred-meter asteroid dating back to creation itself.',
      mood: 'excited',
    },
  },

  'mission-asteroid-scout': {
    missionId: 'mission-asteroid-scout',
    missionName: 'Deep Primitive',
    chapterTitle: 'Chapter 4: The Time Capsule',
    openingBriefing: [
      {
        speaker: 'Dr. Lena Okafor',
        line: 'Asteroid Bennu! A carbonaceous rubble-pile older than Earth, holding the organic sparks of life!',
        mood: 'excited',
      },
      {
        speaker: 'Kai Mercer',
        line: 'Five thousand two hundred meters per second delta-V. An ion drive is our only prayer of carrying this mass.',
        mood: 'nervous',
      },
      {
        speaker: 'Ravi Anand',
        line: 'Microgravity so weak that the spacecraft’s own gravity might pull pebbles off the asteroid surface.',
        mood: 'humorous',
      },
      {
        speaker: 'Sofia Reyes',
        line: 'This is the edge of our capabilities. Precision navigation, electric propulsion, and complete autonomy.',
        mood: 'calm',
      },
      {
        speaker: 'Chair Voss',
        line: 'Return primordial organic data, and history will remember this program forever.',
        mood: 'supportive',
      },
    ],
    midMissionCrisis: {
      title: 'Microgravity Proximity Drift',
      description: 'Weak gravitational gradient causes unpredictable attitude drift as solar wind buffets extended arrays.',
      dialogue: [
        {
          speaker: 'Kai Mercer',
          line: 'Thruster back-pressure is causing reaction wheel saturation! We are drifting toward a boulder cluster!',
          mood: 'nervous',
        },
        {
          speaker: 'Dr. Lena Okafor',
          line: 'Watch the lidar altimeter! Bennu’s surface isn’t smooth sand—it’s jagged boulders everywhere!',
          mood: 'excited',
        },
        {
          speaker: 'Ravi Anand',
          line: 'Autonomous obstacle avoidance is kicking in. Don’t sneeze, everyone.',
          mood: 'humorous',
        },
        {
          speaker: 'Sofia Reyes',
          line: 'Xenon pulse confirmed. Guidance has arrested lateral drift. We are hovering ten meters above Bennu.',
          mood: 'calm',
        },
      ],
    },
    outcomes: {
      success: {
        headline: 'DEEP PRIMITIVE MAPS PRIMORDIAL AMINO ACIDS ON BENNU',
        subhead: 'Autonomous ion-drive probe confirms organic molecules dating back 4.5 billion years.',
        dialogue: [
          {
            speaker: 'Dr. Lena Okafor',
            line: 'Amino acids and hydrated clay minerals! The building blocks of life were flying across space!',
            mood: 'excited',
          },
          {
            speaker: 'Kai Mercer',
            line: 'Ion engine fired for three hundred continuous days with zero grid erosion. Sheer perfection.',
            mood: 'proud',
          },
          {
            speaker: 'Chair Voss',
            line: 'You have done what no agency has done before. Deep Primitive has unlocked the Solar System’s birth.',
            mood: 'proud',
          },
        ],
        summary: 'Pristine proximity navigation and spectroscopy revealed primordial organic chemistry on asteroid Bennu.',
      },
      partial: {
        headline: 'DEEP PRIMITIVE RETURNS COARSE ASTEROID RADAR BEFORE DRIFT',
        subhead: 'Propellant margin forces early standoff retreat, returning vital density and shape models.',
        dialogue: [
          {
            speaker: 'Ravi Anand',
            line: 'We didn’t touch down, but we built a millimeter-accurate three-dimensional shape model of the whole rock.',
            mood: 'relaxed',
          },
          {
            speaker: 'Dr. Lena Okafor',
            line: 'It proves Bennu is fifty percent empty space. A true rubble-pile time capsule.',
            mood: 'curious',
          },
          {
            speaker: 'Chair Voss',
            line: 'Cautious piloting brought the data home without losing the craft. Commendable judgment.',
            mood: 'supportive',
          },
        ],
        summary: 'Safe standoff operations returned structural and radar maps despite proximity fuel restrictions.',
      },
      failure: {
        headline: 'MICROGRAVITY TUMBLE DISRUPTS BENNU RENDEZVOUS',
        subhead: 'Guidance glitch during close-proximity scan sends probe into uncontrolled drift.',
        dialogue: [
          {
            speaker: 'Kai Mercer',
            line: 'Reaction wheels saturated during the descent corridor. Thrusters couldn’t arrest the tumble in time.',
            mood: 'nervous',
          },
          {
            speaker: 'Ravi Anand',
            line: 'Carrier beacon is still beeping from deep space, but she’s drifting outward into the asteroid belt.',
            mood: 'calm',
          },
          {
            speaker: 'Sofia Reyes',
            line: 'We dared the hardest trajectory in the Solar System. Log the anomaly and prepare for next window.',
            mood: 'calm',
          },
        ],
        summary: 'Attitude control saturation caused proximity scan abort; vehicle lost into heliocentric orbit.',
      },
    },
    closingLine: {
      speaker: 'Chair Voss',
      line: 'You started in Low Earth Orbit. You ended among primordial stars. What an extraordinary journey.',
      mood: 'proud',
    },
  },
};

// ============================================================================
// CAMPAIGN ENDINGS (GOLD, SILVER, BRONZE)
// ============================================================================
export const CAMPAIGN_ENDINGS: CampaignEnding[] = [
  {
    tier: 'Gold',
    title: 'The Golden Age of Exploration',
    headline: 'SKY RIFT MISSION CAMPAIGN CELEBRATED AS A HISTORIC AEROSPACE TRIUMPH',
    scoreRange: 'Average Score 80–100',
    dialogue: [
      {
        speaker: 'Chair Voss',
        line: 'In thirty years of government oversight, I have never seen four consecutive missions executed with such mastery.',
        mood: 'proud',
      },
      {
        speaker: 'Sofia Reyes',
        line: 'Credit belongs to the console team, Chair. They balanced mass, fuel, and physics against the void.',
        mood: 'calm',
      },
      {
        speaker: 'Kai Mercer',
        line: 'Every bolt, every watt, every kilogram accounted for. I... I think my spreadsheets can rest now.',
        mood: 'relieved',
      },
      {
        speaker: 'Dr. Lena Okafor',
        line: 'Climate baselines on Earth, water ice on the Moon, ancient riverbeds on Mars, primordial amino acids at Bennu!',
        mood: 'excited',
      },
      {
        speaker: 'Ravi Anand',
        line: 'And best of all, the Deep Space Network never hung up on us once.',
        mood: 'humorous',
      },
      {
        speaker: 'Chair Voss',
        line: 'The board has unanimously approved indefinite funding. We are building your next fleet for the Outer Planets.',
        mood: 'supportive',
      },
    ],
    epilogue:
      'Through disciplined engineering and bold scientific curiosity, SkyRift’s exploratory campaign redefined human understanding of the inner Solar System. Your flight designs are preserved in the permanent aerospace archives as the benchmark for a new generation of deep-space pioneers.',
  },
  {
    tier: 'Silver',
    title: 'The Resilient Frontier',
    headline: 'SKY RIFT PROGRAM DEMONSTRATES EXCEPTIONAL GRIT ACROSS DEEP SPACE TRIALS',
    scoreRange: 'Average Score 55–79',
    dialogue: [
      {
        speaker: 'Chair Voss',
        line: 'You took hits. You fought power sags, telemetry dropouts, and propellant squeezes. But you brought the science home.',
        mood: 'supportive',
      },
      {
        speaker: 'Sofia Reyes',
        line: 'Spaceflight is rarely tidy, Chair. Spacecraft fly on real margins, not idealistic dreams.',
        mood: 'calm',
      },
      {
        speaker: 'Kai Mercer',
        line: 'The safety factors held. When systems faltered, our redundant subsystems saved the mission every single time.',
        mood: 'proud',
      },
      {
        speaker: 'Dr. Lena Okafor',
        line: 'The scientific discoveries we returned are real, tangible, and will keep research institutions busy for decades.',
        mood: 'curious',
      },
      {
        speaker: 'Ravi Anand',
        line: 'A little cosmic radiation builds character, right? Our birds are scarred, but they flew proud.',
        mood: 'humorous',
      },
      {
        speaker: 'Chair Voss',
        line: 'Your program grant is renewed. The Solar System hasn’t seen the last of this flight control room.',
        mood: 'supportive',
      },
    ],
    epilogue:
      'With tenacity, ingenuity, and unyielding teamwork, the SkyRift team navigated real orbital anomalies to deliver transformative discoveries across all four destinations. Your agency has earned a permanent place among the stars.',
  },
  {
    tier: 'Bronze',
    title: 'Lessons in the Void',
    headline: 'SKY RIFT FLIGHT TELEMETRY SHAPES NEXT-GENERATION SPACECRAFT REDESIGNS',
    scoreRange: 'Average Score Under 55',
    dialogue: [
      {
        speaker: 'Kai Mercer',
        line: 'The mass margins were too tight. The orbital mechanics were unforgiving. I should have added more battery capacity.',
        mood: 'nervous',
      },
      {
        speaker: 'Sofia Reyes',
        line: 'Chin up, Kai. Every pioneer who ever touched a rocket nozzle failed before they succeeded.',
        mood: 'calm',
      },
      {
        speaker: 'Dr. Lena Okafor',
        line: 'Even our aborted scans gave us atmospheric density models and radar profiles we never had before.',
        mood: 'curious',
      },
      {
        speaker: 'Ravi Anand',
        line: 'At least the ground station equipment is intact. And the coffee machine still works.',
        mood: 'humorous',
      },
      {
        speaker: 'Chair Voss',
        line: 'The board sees your telemetry logs. You didn’t conquer the void today, but you mapped the pitfalls for tomorrow.',
        mood: 'supportive',
      },
      {
        speaker: 'Sofia Reyes',
        line: 'Return to the Hangar. We redesign. We re-test. We fly again.',
        mood: 'proud',
      },
    ],
    epilogue:
      'Spaceflight is the sternest teacher in human history. Though your initial campaign encountered difficult operational constraints, the hard-won flight data has already reshaped aerospace engineering protocols, laying the groundwork for a triumphant return.',
  },
];

// ============================================================================
// HELPER FUNCTIONS & SETTINGS
// ============================================================================
export const STORY_STORAGE_KEY = 'skyrift_story_enabled';

export function isStoryEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORY_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setStoryEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORY_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('skyrift_story_toggled', { detail: enabled }));
  } catch {
    // ignore
  }
}

export function getMissionStory(missionId: string): MissionStory {
  return MISSION_STORIES[missionId] || MISSION_STORIES['mission-earth-obs'];
}

export function getCampaignEnding(averageScore: number): CampaignEnding {
  if (averageScore >= 80) return CAMPAIGN_ENDINGS[0];
  if (averageScore >= 55) return CAMPAIGN_ENDINGS[1];
  return CAMPAIGN_ENDINGS[2];
}

// ============================================================================
// CREW TRUST SYSTEM & EVENT CHARACTER REACTIONS
// ============================================================================

export type CrewTrust = Record<StorySpeaker, number>;

export const INITIAL_CREW_TRUST: CrewTrust = {
  'Sofia Reyes': 50,
  'Kai Mercer': 50,
  'Dr. Lena Okafor': 50,
  'Ravi Anand': 50,
  'Chair Voss': 50,
};

export const CREW_TRUST_STORAGE_KEY = 'skyrift_crew_trust_v1';

export function getCrewTrust(): CrewTrust {
  if (typeof window === 'undefined') return { ...INITIAL_CREW_TRUST };
  try {
    const raw = localStorage.getItem(CREW_TRUST_STORAGE_KEY);
    if (!raw) return { ...INITIAL_CREW_TRUST };
    const parsed = JSON.parse(raw);
    return {
      'Sofia Reyes': typeof parsed['Sofia Reyes'] === 'number'
        ? parsed['Sofia Reyes']
        : typeof parsed['Sofia Reyes'] === 'number'
        ? parsed['Sofia Reyes']
        : 50,
      'Kai Mercer': typeof parsed['Kai Mercer'] === 'number' ? parsed['Kai Mercer'] : 50,
      'Dr. Lena Okafor': typeof parsed['Dr. Lena Okafor'] === 'number' ? parsed['Dr. Lena Okafor'] : 50,
      'Ravi Anand': typeof parsed['Ravi Anand'] === 'number' ? parsed['Ravi Anand'] : 50,
      'Chair Voss': typeof parsed['Chair Voss'] === 'number' ? parsed['Chair Voss'] : 50,
    };
  } catch {
    return { ...INITIAL_CREW_TRUST };
  }
}

export function updateCrewTrust(impacts: Partial<Record<StorySpeaker, number>>): CrewTrust {
  if (typeof window === 'undefined') return { ...INITIAL_CREW_TRUST };
  const current = getCrewTrust();
  const next: CrewTrust = { ...current };

  for (const [speaker, delta] of Object.entries(impacts)) {
    if (delta !== undefined && speaker in next) {
      const spk = speaker as StorySpeaker;
      next[spk] = Math.max(0, Math.min(100, Math.round(next[spk] + delta)));
    }
  }

  try {
    localStorage.setItem(CREW_TRUST_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('skyrift_crew_trust_updated', { detail: next }));
  } catch {
    // ignore
  }

  return next;
}

export function resetCrewTrust(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CREW_TRUST_STORAGE_KEY, JSON.stringify(INITIAL_CREW_TRUST));
    window.dispatchEvent(new CustomEvent('skyrift_crew_trust_updated', { detail: INITIAL_CREW_TRUST }));
  } catch {
    // ignore
  }
}

export const HIGHEST_TRUST_BONUS_LINES: Record<
  StorySpeaker,
  {
    line: string;
    mood: DialogueMood;
    relationshipTitle: string;
    description: string;
  }
> = {
  'Sofia Reyes': {
    line: 'You never lost your nerve when the alarms screamed. That is what true command looks like. Honored to fly with you.',
    mood: 'proud',
    relationshipTitle: 'Trusted Flight Commander',
    description: 'Sofia respects your steady hand at the helm and your calm judgment under extreme telemetry alarms.',
  },
  'Kai Mercer': {
    line: 'You protected the ship, Commander. Because you gave her real margins, she brought us all back safely.',
    mood: 'relieved',
    relationshipTitle: 'Master Systems Engineer',
    description: 'Kai deeply appreciates that you prioritized spacecraft health and never sacrificed engineering margins for reckless gambles.',
  },
  'Dr. Lena Okafor': {
    line: 'We dared to look into the unknown! Every single risky observation we took rewrote planetary science textbooks!',
    mood: 'excited',
    relationshipTitle: 'Scientific Visionary',
    description: 'Dr. Okafor is thrilled by your boldness in capturing transient phenomena and returning breakthrough planetary discoveries.',
  },
  'Ravi Anand': {
    line: 'Through solar flares, rain fades, and signal blackouts, you kept the carrier locked. Best flight partner in space.',
    mood: 'humorous',
    relationshipTitle: 'Orbital Comms Partner',
    description: 'Ravi honors your steadfast focus on keeping the telemetry stream unbroken across deep space ground stations.',
  },
  'Chair Voss': {
    line: 'I scrutinize every dollar, Commander. But you proved that disciplined vision can reach the edge of the solar system.',
    mood: 'supportive',
    relationshipTitle: 'Prudent Mission Steward',
    description: 'Chair Voss is impressed by your fiscal discipline, operational restraint, and conservation of critical public resources.',
  },
};

export const CREW_CAMPAIGN_CLOSING_LINES: Record<
  StorySpeaker,
  Record<'Gold' | 'Silver' | 'Bronze', { line: string; mood: DialogueMood }>
> = {
  'Sofia Reyes': {
    Gold: {
      line: 'The console belongs to pioneers who respect the laws of physics. It has been an honor commanding this flight room with you.',
      mood: 'proud',
    },
    Silver: {
      line: 'Spacecraft fly on true margins, not wishes. You brought the bird home. Flight out.',
      mood: 'calm',
    },
    Bronze: {
      line: 'Every crater is a lesson in orbital physics. Chin up. We re-tool and fly again.',
      mood: 'proud',
    },
  },
  'Kai Mercer': {
    Gold: {
      line: 'Thermal loops stable, structural factor 1.4 maintained. I... I can finally close my telemetry spreadsheets.',
      mood: 'relieved',
    },
    Silver: {
      line: 'The redundancies took a beating, but our safety margins never breached. Good design saves lives.',
      mood: 'proud',
    },
    Bronze: {
      line: 'Next time, I am doubling the auxiliary battery bus. Margin is freedom, Commander.',
      mood: 'nervous',
    },
  },
  'Dr. Lena Okafor': {
    Gold: {
      line: 'Every spectral line we downlinked is a new chapter in planetary geology. Pure, unfiltered discovery!',
      mood: 'excited',
    },
    Silver: {
      line: 'The anomalies were stressful, but the sensor returns will feed planetary research institutes for decades.',
      mood: 'curious',
    },
    Bronze: {
      line: 'Even our partial scans rewrote the magnetic models. There is always science in the rubble.',
      mood: 'curious',
    },
  },
  'Ravi Anand': {
    Gold: {
      line: 'Deep Space Network locked from Low Earth Orbit to Asteroid Bennu. Zero lost packets. Cleanest run in agency history!',
      mood: 'humorous',
    },
    Silver: {
      line: 'Signal was scratchy at two astronomical units, but we never let the carrier drop completely.',
      mood: 'humorous',
    },
    Bronze: {
      line: 'At least ground antennas didn’t melt. Reset carrier frequency and prep the next tracking schedule.',
      mood: 'humorous',
    },
  },
  'Chair Voss': {
    Gold: {
      line: 'You proved that fiscal discipline and bold exploration are not enemies. Your next planetary fleet is approved.',
      mood: 'supportive',
    },
    Silver: {
      line: 'You stretched public funds through solar flares and hardware wear. That is real stewardship. Grant renewed.',
      mood: 'supportive',
    },
    Bronze: {
      line: 'Failure is an authorized line item if it yields actionable data. The board awaits your redesign proposal.',
      mood: 'supportive',
    },
  },
};

export function getHighestTrustCharacter(trustState?: CrewTrust): {
  speaker: StorySpeaker;
  trust: number;
  bonusLine: DialogueLine;
  relationshipTitle: string;
  description: string;
} {
  const trust = trustState || getCrewTrust();
  let maxSpeaker: StorySpeaker = 'Sofia Reyes';
  let maxScore = -1;

  for (const [speaker, score] of Object.entries(trust)) {
    if (score > maxScore) {
      maxScore = score;
      maxSpeaker = speaker as StorySpeaker;
    }
  }

  const bonus = HIGHEST_TRUST_BONUS_LINES[maxSpeaker];

  return {
    speaker: maxSpeaker,
    trust: maxScore,
    bonusLine: {
      speaker: maxSpeaker,
      line: bonus.line,
      mood: bonus.mood,
    },
    relationshipTitle: bonus.relationshipTitle,
    description: bonus.description,
  };
}

export interface EventReaction {
  eventId: string;
  speaker: StorySpeaker;
  line: string; // Under 25 words
  mood: DialogueMood;
  optionImpacts: Array<{
    trustDeltas: Partial<Record<StorySpeaker, number>>;
    summaryBadge: string;
  }>;
}

export const EVENT_CHARACTER_REACTIONS: Record<string, EventReaction> = {
  'event-solar-flare': {
    eventId: 'event-solar-flare',
    speaker: 'Kai Mercer',
    line: 'Solar storm warning! High-energy protons incoming! If we don’t shield the avionics bus right now, our microchips will bake!',
    mood: 'nervous',
    optionImpacts: [
      {
        trustDeltas: { 'Kai Mercer': 15, 'Sofia Reyes': 5, 'Dr. Lena Okafor': -5 },
        summaryBadge: '+15 Kai (Engineering Safety)',
      },
      {
        trustDeltas: { 'Dr. Lena Okafor': 18, 'Kai Mercer': -12, 'Chair Voss': 5 },
        summaryBadge: '+18 Lena (Science Boldness)',
      },
    ],
  },
  'event-comms-dropout': {
    eventId: 'event-comms-dropout',
    speaker: 'Ravi Anand',
    line: 'Madrid lost carrier lock! Heavy rain fade down in Spain. Shall I switch to the omni horn or buffer the telemetry packets?',
    mood: 'humorous',
    optionImpacts: [
      {
        trustDeltas: { 'Ravi Anand': 15, 'Sofia Reyes': 5 },
        summaryBadge: '+15 Ravi (Active Downlink)',
      },
      {
        trustDeltas: { 'Kai Mercer': 10, 'Chair Voss': 10, 'Ravi Anand': 5 },
        summaryBadge: '+10 Voss & Kai (Conservation)',
      },
    ],
  },
  'event-micrometeoroid-hit': {
    eventId: 'event-micrometeoroid-hit',
    speaker: 'Kai Mercer',
    line: 'Acoustic sensors picked up a sharp kinetic ping! A micrometeoroid tore our MLI blanket. We need thermal heaters on that seam.',
    mood: 'perfectionist',
    optionImpacts: [
      {
        trustDeltas: { 'Kai Mercer': 16, 'Sofia Reyes': 6 },
        summaryBadge: '+16 Kai (Thermal Patch)',
      },
      {
        trustDeltas: { 'Chair Voss': 8, 'Kai Mercer': -10 },
        summaryBadge: '+8 Voss (Conserved Power)',
      },
    ],
  },
  'event-sensor-drift': {
    eventId: 'event-sensor-drift',
    speaker: 'Dr. Lena Okafor',
    line: 'My optical focal plane drifted zero-point-two degrees! Star guide locks are slipping. Commander, please let me run a calibration sweep!',
    mood: 'excited',
    optionImpacts: [
      {
        trustDeltas: { 'Dr. Lena Okafor': 16, 'Sofia Reyes': 6, 'Kai Mercer': -4 },
        summaryBadge: '+16 Lena (Optical Precision)',
      },
      {
        trustDeltas: { 'Kai Mercer': 10, 'Chair Voss': 10, 'Dr. Lena Okafor': -14 },
        summaryBadge: '+10 Kai & Voss (Power Conserved)',
      },
    ],
  },
  'event-battery-degradation': {
    eventId: 'event-battery-degradation',
    speaker: 'Kai Mercer',
    line: 'Accumulator cell thermals hit fifty-five degrees! Lithium dendrites will form if we don’t open the radiator louvers immediately!',
    mood: 'nervous',
    optionImpacts: [
      {
        trustDeltas: { 'Kai Mercer': 16, 'Chair Voss': 8, 'Dr. Lena Okafor': -4 },
        summaryBadge: '+16 Kai (Thermal Protection)',
      },
      {
        trustDeltas: { 'Dr. Lena Okafor': 14, 'Kai Mercer': -14 },
        summaryBadge: '+14 Lena (Continuous Science)',
      },
    ],
  },
  'event-data-corruption': {
    eventId: 'event-data-corruption',
    speaker: 'Ravi Anand',
    line: 'Cosmic ray nailed our flash drive! Bit-flips across three memory banks. I can scrub ECC parity or wipe the bad sectors clean.',
    mood: 'relaxed',
    optionImpacts: [
      {
        trustDeltas: { 'Ravi Anand': 15, 'Dr. Lena Okafor': 12, 'Kai Mercer': -4 },
        summaryBadge: '+15 Ravi & +12 Lena (Data Restored)',
      },
      {
        trustDeltas: { 'Chair Voss': 10, 'Kai Mercer': 6, 'Dr. Lena Okafor': -12 },
        summaryBadge: '+10 Voss (Low Overhead)',
      },
    ],
  },
  'event-thruster-anomaly': {
    eventId: 'event-thruster-anomaly',
    speaker: 'Sofia Reyes',
    line: 'Manifold valve three is chilling below freezing. If that seal freezes open, our delta-v margin vents into deep space. Your call, Commander.',
    mood: 'calm',
    optionImpacts: [
      {
        trustDeltas: { 'Sofia Reyes': 15, 'Kai Mercer': 10, 'Chair Voss': -4 },
        summaryBadge: '+15 Sofia (Trajectory Security)',
      },
      {
        trustDeltas: { 'Chair Voss': 8, 'Sofia Reyes': -8, 'Kai Mercer': -6 },
        summaryBadge: '+8 Voss (Conserved Battery)',
      },
    ],
  },
  'event-science-opportunity': {
    eventId: 'event-science-opportunity',
    speaker: 'Dr. Lena Okafor',
    line: 'Look at that spectrometer spike! An active outgassing plume is drifting right past our sensor aperture! We have to photograph this!',
    mood: 'curious',
    optionImpacts: [
      {
        trustDeltas: { 'Dr. Lena Okafor': 20, 'Sofia Reyes': 5, 'Kai Mercer': -10 },
        summaryBadge: '+20 Lena (Historic Discovery)',
      },
      {
        trustDeltas: { 'Dr. Lena Okafor': 10, 'Kai Mercer': 6, 'Chair Voss': 8 },
        summaryBadge: '+10 Lena & +8 Voss (Measured Risk)',
      },
      {
        trustDeltas: { 'Kai Mercer': 12, 'Chair Voss': 15, 'Dr. Lena Okafor': -15 },
        summaryBadge: '+15 Voss & +12 Kai (Resource Preservation)',
      },
    ],
  },
};

export function getEventReaction(eventId: string): EventReaction | undefined {
  return EVENT_CHARACTER_REACTIONS[eventId];
}


