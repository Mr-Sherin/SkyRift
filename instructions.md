SKYRIFT — Complete Antigravity Implementation Blueprint
1. Project Overview
Build SkyRift, a polished, browser-based space mission design and simulation game inspired by NASA mission planning and the NASA Space Apps Challenge.

Players design a spacecraft, select a mission, balance engineering budgets, launch, operate the spacecraft, respond to mission events, and evaluate whether their mission achieved its scientific objectives.

The game should feel like a combination of:
- A spacecraft engineering simulator
- A mission-control experience
- A science exploration game
- An interactive educational tool
- A replayable strategy game
Product tagline
Design the spacecraft. Master the mission. Explore the unknown.

Core promise
Players should learn that spacecraft design is a system of interconnected trade-offs. A powerful instrument may generate valuable science but consume more power, produce more data, increase mass, require better communications, and raise mission cost.

The experience must make these relationships visible and understandable.

2. Primary Goal
Create a complete, functional website and game—not merely a landing page or static mockup.

The user must be able to:
1. Enter the website.
2. Start a mission.
3. Select a destination and mission type.
4. Build a spacecraft using components.
5. Inspect mass, power, cost, propulsion, data, and other budgets.
6. See how component choices affect the spacecraft.
7. Validate the spacecraft before launch.
8. Launch and operate the mission.
9. Observe simulation progress and telemetry.
10. Respond to mission events.
11. Receive a final mission report.
12. Understand why the mission succeeded or failed.
13. Replay the mission with a different design.
Do not create controls that look functional but do nothing. Every primary button, selection, tab, slider, and component interaction must have a real outcome.

3. Product Experience
3.1 Main navigation
Create a consistent navigation system:
- Home
- Mission Control
- Mission Builder
- Simulation
- Mission Reports
- Learn
- About
The active page should be clearly highlighted.

On mobile, use a compact navigation drawer or bottom navigation where appropriate.
3.2 Required pages
A. Landing page
The landing page should introduce SkyRift with a strong visual identity.

Include:
- Hero section with an animated spacecraft or orbital scene
- Main title: SKYRIFT
- Tagline
- Short explanation of the game
- Primary CTA: Start Mission
- Secondary CTA: Explore the Simulator
- Mission preview cards
- Explanation of the budget systems
- A small preview of the mission-control interface
- Educational disclaimer describing the simulation as simplified
The hero should be visually impressive without becoming cluttered.
B. Mission selection
Allow players to choose a mission template.

Each card should include:
- Mission name
- Destination
- Mission type
- Difficulty
- Primary science objective
- Mission duration
- Suggested spacecraft class
- Main challenge
- Estimated complexity
Provide a clear distinction between:
- Beginner
- Intermediate
- Advanced
Mission difficulty should be based on the actual constraints and not just decorative labels.
C. Mission Builder
This is the central gameplay screen.

The player should be able to:
- Add spacecraft components
- Remove components
- Replace components
- Change component configurations
- Inspect technical specifications
- View budget changes immediately
- See warnings and recommendations
- Validate the design
- Save the design
- Launch when the design is valid
The interface should include a spacecraft preview and a component configuration panel.
D. Mission Simulation
Show a mission-control environment containing:
- Spacecraft status
- Current mission phase
- Elapsed mission time
- Distance to destination
- Current power
- Propellant remaining
- Data stored
- Communications status
- Science progress
- Mission event log
- Telemetry charts
- Simulation controls
Simulation controls:
- Pause
- Resume
- 1× speed
- 5× speed
- 10× speed
- 50× speed
- Advance to next event
Simulation speed should change the actual simulation progression, not just the animation.
E. Mission Report
After a mission ends, display:
- Overall score
- Mission outcome
- Science objectives achieved
- Science data returned
- Spacecraft survival status
- Budget performance
- Major mission events
- Key design decisions
- Reasons for success or failure
- Improvement recommendations
Provide:
- Replay Mission
- Redesign Spacecraft
- Return to Mission Control
F. Learn page
Explain the science and engineering behind the game.

Topics:
- Spacecraft mass
- Power systems
- Propulsion
- Communications
- Guidance, Navigation and Control
- Thermal control
- Data handling
- Scientific payloads
- Orbital mechanics
- Mission design trade-offs
Use concise explanations, diagrams, examples, and interactive calculations where appropriate.
G. About page
Explain:
- What SkyRift is
- The educational purpose
- The simplified nature of the simulation
- Which values are illustrative
- How the project relates to space exploration
Do not imply that SkyRift is an official NASA product.

4. Recommended Technical Architecture
Use a modern, maintainable web architecture.
Recommended stack
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion for interface animation
- Recharts or a similar charting library
- Lucide icons
- Local storage or IndexedDB for saved missions
If the existing repository uses a different working stack, inspect it first and preserve the existing architecture unless there is a clear reason to change it.
Core architectural principle
Keep the simulation engine separate from the interface.

The UI should display simulation state and send player actions to the simulation engine. Do not bury the mission physics inside individual React components.

Suggested structure:
src/
  app/
    page.tsx
    missions/
    builder/
    simulation/
    reports/
    learn/
    about/

  components/
    layout/
    navigation/
    mission/
    builder/
    budgets/
    simulation/
    telemetry/
    reports/
    learn/
    ui/

  data/
    missions/
    components/
    events/
    scienceObjectives/

  engine/
    budgets/
    orbit/
    propulsion/
    communications/
    simulation/
    scoring/
    validation/

  hooks/
  lib/
  types/


Suggested engine modules
- budgetEngine
- spacecraftValidator
- propulsionEngine
- orbitEngine
- communicationsEngine
- scienceEngine
- eventEngine
- simulationEngine
- missionScoringEngine
Use typed data structures and unit tests for calculations.

5. Visual Design Direction
5.1 Design style
Use a sophisticated space-technology aesthetic.

The website should feel like a modern mission-control interface, not a generic gaming dashboard.
Suggested palette
- Deep space background: #070B14
- Secondary background: #0D1424
- Panel background: #111C2E
- Border: #26364E
- Primary accent: #58C7FF
- Secondary accent: #8B7CFF
- Success: #48D597
- Warning: #FFBD59
- Critical: #FF647C
- Main text: #F4F7FC
- Muted text: #9BAAC0
Use these as starting values. Maintain sufficient contrast and avoid excessive glow.
5.2 Visual elements
Include:
- Starfield backgrounds
- Subtle orbital paths
- Spacecraft silhouettes
- Planetary imagery
- Mission telemetry charts
- Budget meters
- Technical labels
- Status indicators
- Mission event timeline
- Animated loading and transition states
Use animation purposefully.

Do not animate every element. Important motion should communicate:
- Mission progression
- Orbital movement
- System status
- Launch
- Event changes
- Data transmission
5.3 Interface quality
Prioritize:
- Clear hierarchy
- Consistent spacing
- Strong typography
- Readable technical information
- Useful tooltips
- Responsive layouts
- Accessible keyboard navigation
- Reduced-motion support
The mission builder and simulation must remain usable on smaller screens.

6. Mission Types
Implement four core missions first.

Additional mission types can be added after the core gameplay is stable.
Mission 1 — Earth Observation
Destination: Earth orbit
Difficulty: Beginner
Primary objective: Collect useful observations of Earth.

Mission challenges:
- Orbit selection
- Power availability
- Instrument selection
- Data storage
- Downlink scheduling
- Communication availability
Example science objectives:
- Observe a selected region
- Capture a minimum number of images
- Return a required quantity of usable data
Mission 2 — Lunar Explorer
Destination: Moon
Difficulty: Intermediate
Primary objective: Study the lunar surface or environment.

Mission challenges:
- Transfer propulsion
- Power availability
- Communication delay
- Thermal environment
- Navigation accuracy
- Mission duration
Example objectives:
- Map a lunar region
- Collect surface or orbital measurements
- Return a minimum science score
Mission 3 — Mars Pathfinder
Destination: Mars
Difficulty: Advanced
Primary objective: Collect scientific data from Mars.

Mission challenges:
- Large transfer requirements
- Long mission duration
- Solar power reduction
- Communication delay
- Data storage
- Propellant planning
- Mission-event risk
Example objectives:
- Reach Mars
- Collect observations
- Return useful science data
- Preserve spacecraft health
Mission 4 — Asteroid Scout
Destination: Near-Earth asteroid
Difficulty: Advanced
Primary objective: Characterize an asteroid.

Mission challenges:
- Target selection
- Navigation accuracy
- Propulsion budget
- Communication scheduling
- Science payload selection
- Limited mission time
Example objectives:
- Reach the target
- Collect composition or imaging data
- Return data
- Complete the mission without exhausting critical resources

7. Spacecraft Subsystems
Every spacecraft should have eight core subsystems.
7.1 Structure
Responsible for:
- Supporting spacecraft components
- Protecting equipment
- Defining structural mass
- Providing mounting capacity
Game variables:
- Structural mass
- Component capacity
- Structural reliability
- Protection rating
7.2 Electrical Power
Responsible for:
- Generating power
- Storing energy
- Supplying spacecraft systems
Possible components:
- Solar panels
- Batteries
- Power management units
- Radioisotope power systems
Variables:
- Power generation in watts
- Battery capacity in watt-hours
- Power degradation
- Available energy
- Power margin
7.3 Propulsion
Responsible for:
- Maneuvers
- Orbit changes
- Transfer burns
- Station keeping
Possible systems:
- Chemical propulsion
- Electric propulsion
- Cold gas
- Monopropellant
Variables:
- Specific impulse
- Propellant mass
- Dry mass
- Thrust
- Required Δv
- Remaining propellant
7.4 Communications
Responsible for:
- Receiving commands
- Sending telemetry
- Returning science data
Possible components:
- Low-gain antenna
- High-gain antenna
- Transmitter
- Receiver
- Communication processor
Variables:
- Data rate
- Antenna gain
- Power consumption
- Communication availability
- Downlink capacity
- Light-time delay
7.5 Guidance, Navigation and Control
Responsible for:
- Determining spacecraft orientation
- Maintaining pointing
- Navigating the mission
- Controlling spacecraft motion
Possible components:
- Star tracker
- Reaction wheels
- Gyroscope
- Sun sensor
- Navigation computer
Variables:
- Pointing accuracy
- Attitude stability
- Navigation accuracy
- Maneuver reliability
7.6 Thermal Control
Responsible for maintaining spacecraft temperatures.

Possible components:
- Radiators
- Insulation
- Heaters
- Thermal control units
Variables:
- Temperature range
- Thermal stability
- Heat rejection
- Heater power consumption
7.7 Command and Data Handling
Responsible for:
- Processing commands
- Storing data
- Managing onboard software
- Recording telemetry
Possible components:
- Flight computer
- Data recorder
- Memory module
- Data processing unit
Variables:
- Storage capacity
- Processing capacity
- Data handling reliability
- Data generation rate
7.8 Scientific Payload
Responsible for completing mission objectives.

Possible instruments:
- Camera
- Spectrometer
- Magnetometer
- Radar
- Radiation detector
- Particle analyzer
Variables:
- Scientific value
- Mass
- Power consumption
- Data generation rate
- Pointing requirements
- Operational duration

8. Component Data Model
Each component should have a consistent data structure.

Example:
type SpacecraftComponent = {
  id: string;
  name: string;
  subsystem:
    | "structure"
    | "power"
    | "propulsion"
    | "communications"
    | "gnc"
    | "thermal"
    | "cdh"
    | "payload";

  massKg: number;
  costCredits: number;
  powerDrawW: number;
  reliability: number;

  specifications: Record<string, number | string>;
  description: string;
  compatibleMissionTypes: string[];
};


Add optional properties where required:
- Power generation
- Battery capacity
- Propellant capacity
- Specific impulse
- Data rate
- Storage capacity
- Instrument science value
- Pointing accuracy
- Thermal operating range
Do not use one generic component type to represent every possible physical behavior. The simulation engine should interpret the properties relevant to each subsystem.

9. Budget Systems
The game must have interconnected budgets.

Do not treat each budget as an independent score bar.
9.1 Mass Budget
Total launch mass:
\[
m_{\text{total}} =
m_{\text{structure}} +
m_{\text{power}} +
m_{\text{propulsion}} +
m_{\text{communications}} +
m_{\text{GNC}} +
m_{\text{thermal}} +
m_{\text{C\&DH}} +
m_{\text{payload}} +
m_{\text{propellant}}
\]

Display:
- Dry mass
- Propellant mass
- Total mass
- Launch vehicle capacity
- Remaining mass margin
If the spacecraft exceeds launch capacity, prevent launch or require the player to select a different launch vehicle.
9.2 Power Budget
Calculate:
- Power generation
- Average operating load
- Peak operating load
- Battery capacity
- Energy consumed during eclipse
- Power margin
For solar panels:
\[
P(r) = P_{1AU}\frac{1}{r^2}(1-d)
\]

Where:
- \(P_{1AU}\) is panel output at 1 AU
- \(r\) is solar distance in AU
- \(d\) is the degradation fraction
At Mars’ approximate solar distance of 1.52 AU, sunlight intensity is about 43% of Earth’s distance from the Sun.

Battery capacity is energy, measured in Wh or kWh. It must not be confused with power in watts.
9.3 Financial Budget
Each component has a cost.

Display:
- Initial mission budget
- Current spacecraft cost
- Launch cost
- Operations cost
- Remaining funds
- Over-budget warning
All fictional game prices must be clearly labeled as illustrative game values.
9.4 Propellant and Δv Budget
Use the ideal rocket equation:
\[
\Delta v = I_{sp}g_0\ln\left(\frac{m_0}{m_f}\right)
\]

Where:
- \(I_{sp}\) is specific impulse in seconds
- \(g_0 = 9.80665\,m/s^2\)
- \(m_0\) is initial mass
- \(m_f\) is final mass
Required propellant:
\[
m_p = m_{\text{dry}}\left(e^{\frac{\Delta v}{I_{sp}g_0}}-1\right)
\]

Use this as an idealized educational model. Do not imply that it includes every real mission loss.

Display:
- Required Δv
- Available Δv
- Propellant loaded
- Propellant remaining
- Maneuver margin
9.5 Data Budget
Display:
- Storage capacity
- Data generated
- Data stored
- Data transmitted
- Data lost or discarded
- Remaining storage
A simplified data generation calculation:
\[
D_{\text{generated}} =
R_{\text{instrument}}\times t
\]

Make the units explicit.
9.6 Mission Duration Budget
Track:
- Planned mission duration
- Elapsed time
- Remaining operational time
- Instrument operation time
- Communications windows
- Critical event deadlines
Mission duration should influence power, data, reliability, and operational cost.

10. Budget Interdependence
This is one of the most important parts of the game.

When a player changes a component, recalculate all relevant budgets immediately.

Example:

Adding a high-resolution camera:
- Increases mass
- Increases cost
- Increases power demand
- Increases science value
- Increases data generation
- May require more storage
- May require more downlink capacity
- May require more precise pointing
Adding a high-gain antenna:
- Increases mass
- Increases cost
- Increases power consumption
- Improves downlink capability
- May require better pointing accuracy
- May reduce communication time needed to return data
Adding more solar panels:
- Increases mass
- Increases cost
- Increases generated power
- May improve mission duration
- May require additional structural capacity
The interface should show these consequences in a clear and understandable way.

11. Launch Vehicles and Mission Constraints
Each launch vehicle should define:
- Maximum payload mass
- Launch cost
- Supported destination classes
- Mission restrictions
- Optional fairing or spacecraft volume limit
Use real launch vehicle values only when the source and assumptions are verified.

If exact values are not verified, label them as illustrative game values.

Do not imply that a launch vehicle’s low-Earth-orbit payload capacity is automatically its payload capacity for a lunar or Mars mission.

12. Orbital Mechanics
Implement a simplified orbital model with clearly documented assumptions.
12.1 Orbit Period
\[
T = 2\pi\sqrt{\frac{r^3}{\mu}}
\]

Where:
- \(r\) is the orbital radius from the center of the central body
- \(\mu\) is the gravitational parameter
The orbital radius is not the same as altitude.

For an orbit around Earth:
\[
r = R_{\text{Earth}} + h
\]

12.2 Orbit Types
Support:
- Low Earth Orbit
- Medium Earth Orbit
- Geostationary Orbit
- Lunar orbit
- Mars orbit
- Heliocentric transfer orbit
For early implementation, use predefined mission transfer options rather than claiming to calculate a complete high-fidelity trajectory.
12.3 Advanced Transfer Mechanics
Add as advanced features:
- Hohmann transfer
- Plane changes
- Gravity assists
- Aerobraking
- Electric propulsion
- Launch windows
- Oberth effect
- Bi-elliptic transfers
These should be introduced progressively.

Do not present gravity assists or aerobraking as free or riskless. They have constraints and risks.

Do not claim that a simplified Hohmann transfer value represents the entire mission’s launch-to-destination Δv.

13. Communications System
Communications should affect gameplay.

Track:
- Distance to Earth
- Light-time delay
- Communication windows
- Available data rate
- Data stored onboard
- Data transmitted
- Antenna pointing
- Ground-station availability
One-way light-time:
\[
t_{\text{light}} = \frac{d}{c}
\]

Where:
- \(d\) is distance
- \(c\) is the speed of light
Approximate educational examples:
- Earth–Moon: about 1.3 seconds one way
- Earth–Mars: several minutes to more than twenty minutes one way, depending on geometry
Use the actual simulated distance when calculating delay.
13.1 Downlink Capacity
A simplified calculation:
\[
D_{\text{downlink}} =
R_{\text{data}}\times t_{\text{window}}
\]

For Mbps and seconds:
\[
D_{\text{downlink, GB}} =
\frac{R_{\text{Mbps}}\times t_{\text{seconds}}}{1000}
\]

Use decimal GB in this simplified equation and label the unit clearly.

The mission should not automatically return all science data if there is insufficient communication time or capacity.

14. Mission Simulation
Create a deterministic simulation engine where practical.

The simulation should use a defined state machine.

Example:
PREPARATION
    ↓
LAUNCH
    ↓
CRUISE
    ↓
ARRIVAL
    ↓
SCIENCE OPERATIONS
    ↓
DATA RETURN
    ↓
MISSION COMPLETE


Some missions may use different phases.

The simulation should track:
- Mission elapsed time
- Spacecraft health
- Power
- Propellant
- Data
- Temperature
- Communications
- Science progress
- Event state
Use a fixed simulation time step or another consistent approach. Avoid making the simulation’s result depend unpredictably on browser frame rate.
14.1 Mission Events
Create event types such as:
- Solar panel degradation
- Unexpected instrument power demand
- Communication outage
- Navigation error
- Thermal anomaly
- Instrument malfunction
- Unexpected scientific discovery
- Propellant leak
- Radiation event
Events must be understandable and actionable.

Each event should explain:
- What happened
- Which systems are affected
- The likely consequence
- Available player actions
- The cost or risk of each action
Avoid purely random events that make a well-designed mission fail without meaningful player control.

15. Mission Science
Each mission must have science objectives.

An objective should include:
- Objective name
- Description
- Required instrument
- Target conditions
- Data requirement
- Required observation duration
- Science value
- Completion condition
Example:
type ScienceObjective = {
  id: string;
  name: string;
  description: string;
  requiredInstrumentIds: string[];
  requiredDataGb: number;
  requiredObservationHours: number;
  scienceValue: number;
  completed: boolean;
};


The player should understand what their payload is designed to achieve.

A mission should not receive a high science score simply because it carries many instruments. The instruments must be used successfully and the data must be returned when required.

16. Mission Scoring
Use a transparent 100-point scoring system.

Suggested categories:
Category	Maximum
Science objectives	35
Mission completion	20
Data successfully returned	15
Spacecraft health	10
Budget efficiency	10
Operational decisions	10
Total	100

The score should explain where points were gained or lost.

Do not use hidden score penalties that the player cannot understand.

Allow partial success:
- Mission failed
- Mission partially successful
- Mission successful
- Mission exceptional
A mission that fails to reach its destination may still receive partial science or engineering points if the player completed meaningful tasks.

17. Mission Builder UX
The builder should make complex engineering decisions approachable.
Main layout
Use three primary regions:
1. Left panel: subsystem categories and component library
2. Center panel: spacecraft preview and configuration
3. Right panel: budgets, warnings, and mission validation
On small screens, convert these panels into tabs or stacked sections.
Component interactions
When the player selects a component:
- Show its description
- Show its mass
- Show its cost
- Show its power draw or generation
- Show relevant technical specifications
- Show compatibility
- Show its impact on budgets
When the player adds or removes a component:
- Recalculate the budgets
- Update warnings
- Update spacecraft preview
- Update validation status
Mission validation
Before launch, check:
- Required subsystems present
- Launch mass within capacity
- Power balance acceptable
- Propellant sufficient
- Storage sufficient
- Required payload present
- Required communication capability present
- Mission budget not exceeded
- Mission-specific constraints satisfied
Validation should distinguish:
- Blocking errors
- Warnings
- Recommendations

18. Learning Features
Add contextual learning instead of forcing players to leave the game.

Examples:
- Hover or click a technical term to see a definition.
- Show a short explanation beside a budget.
- Explain why a design fails validation.
- Explain how a design change affects the mission.
- Allow players to compare two spacecraft designs.
- Show a short post-mission explanation of the major engineering trade-offs.
Add an optional Learning Mode.

Learning Mode should:
- Explain technical terms
- Show equations
- Display unit labels
- Offer design recommendations
- Avoid hiding important simulation behavior
An optional Challenge Mode can reduce hints and recommendations.

19. New Features to Make SkyRift Stand Out
Implement the core game first. These features can be developed after the essential gameplay works.
19.1 Mission Design Assistant
Create an in-game assistant that explains design trade-offs using the game’s actual data.

Example:
Your spacecraft has insufficient power during eclipse. Increasing battery capacity may solve the issue, but it will increase spacecraft mass and cost.

The assistant must not invent current spacecraft values. It should read from the actual design state.
19.2 Design Comparison
Allow players to save two designs and compare:
- Mass
- Cost
- Power margin
- Δv
- Science potential
- Data capacity
- Risk
- Estimated mission outcome
19.3 Mission Replay
Allow players to replay a completed mission with:
- The same design
- A modified design
- A different mission strategy
19.4 Engineering Trade-Off Challenges
Provide short challenges such as:
- Build a spacecraft under a strict mass limit.
- Return a specified quantity of science data.
- Complete a lunar mission under a limited budget.
- Design a Mars spacecraft with adequate power.
- Complete a mission with limited propellant.
19.5 Mission Timeline
Show a timeline containing:
- Launch
- Major maneuvers
- Arrival
- Science operations
- Communications windows
- Events
- Mission completion
19.6 Mission Debrief Assistant
After the mission, explain:
- What went well
- What failed
- Which design decisions caused the result
- What the player should change next time
19.7 Shareable Mission Report
Create a clean report view that can be shared or exported.

Include:
- Mission name
- Spacecraft configuration
- Mission score
- Objectives achieved
- Major events
- Final result
Do not prioritize export functionality over the playable core.

20. Data Persistence
Save the player’s progress locally.

Persist:
- Selected mission
- Current spacecraft design
- Component configuration
- Simulation state
- Mission report
- Best score
- Completed challenges
- Learning preferences
Use local storage for small, simple state or IndexedDB for larger structured records.

The game should recover from a page refresh without losing an active mission when practical.

Include a reset option with confirmation.

21. Accessibility and Usability
Ensure:
- Keyboard navigation
- Visible focus states
- Sufficient contrast
- Readable font sizes
- Clear button labels
- Accessible form controls
- Reduced-motion support
- Useful empty states
- Helpful error messages
- Consistent units
- No color-only status indicators
Use icons with text labels where technical meaning may not be obvious.

22. Scientific Accuracy and Honest Simplification
SkyRift is an educational game, not a high-fidelity flight dynamics simulator.

Clearly distinguish:
1. Real-world physics: equations and relationships based on established principles.
2. Simplified simulation: models used to make gameplay understandable.
3. Illustrative game values: fictional values for cost, reliability, component performance, or mission scoring.
Never imply that fictional values are official NASA specifications.

Avoid misleading scientific claims.
Important modeling notes
- Solar power follows an inverse-square relationship with solar distance, before accounting for other factors.
- Battery capacity is energy, usually Wh or kWh; power is W.
- Rocket equation calculations are idealized and do not include every real mission loss.
- Orbit radius is measured from the center of the central body.
- Hohmann transfer values refer to a particular transfer leg and should not be presented as total mission Δv.
- Gravity assists are not free or riskless.
- Aerobraking involves atmospheric and thermal constraints.
- Launch vehicle payload capacity depends on destination and mission conditions.
- A 20% power margin is a gameplay guideline, not a universal NASA requirement.
- Mars communication delay varies with distance and geometry.
- Do not claim a fixed Mars communications blackout duration as universal.
- Avoid universal claims that one propulsion technology always requires a fixed percentage more Δv than another.

23. Engineering Quality
Use:
- TypeScript types
- Reusable components
- Consistent naming
- Separate simulation logic
- Unit tests for important equations
- Clear error handling
- Sensible loading states
- Responsive design
- Clean code organization
Do not:
- Put all game logic in one component.
- Use hardcoded UI-only budget values.
- Make calculations depend on display text.
- Allow the UI to silently disagree with the simulation engine.
- Create fake buttons.
- Hide errors from the player.
- Use unverified real-world performance claims.

24. Testing and Acceptance Criteria
The project is not complete until the following flows work.
Core gameplay
- [ ] Player can start a new mission.
- [ ] Player can select a mission template.
- [ ] Player can add spacecraft components.
- [ ] Player can remove spacecraft components.
- [ ] Budget values update immediately.
- [ ] Invalid designs display clear reasons.
- [ ] Valid designs can launch.
- [ ] Simulation progresses.
- [ ] Pause and speed controls work.
- [ ] Mission events can occur.
- [ ] Player actions affect simulation outcomes.
- [ ] Science objectives can be completed.
- [ ] Data can be returned.
- [ ] Mission report is generated.
- [ ] Player can replay the mission.
- [ ] Progress persists after refresh.
Technical validation
- [ ] Rocket equation tests pass.
- [ ] Orbit period tests pass.
- [ ] Solar power tests pass.
- [ ] Data capacity tests pass.
- [ ] Budget totals match component configuration.
- [ ] Mission scoring totals 100.
- [ ] Simulation uses consistent time progression.
- [ ] UI values match engine values.
Interface quality
- [ ] Desktop layout works.
- [ ] Mobile layout works.
- [ ] Main controls are accessible.
- [ ] Empty states are useful.
- [ ] Loading states are handled.
- [ ] Error states are understandable.
- [ ] No major console errors remain.

25. Recommended Implementation Order
Build the game in phases.
Phase 1 — Foundation
- Inspect the existing repository.
- Preserve existing working code.
- Establish the visual system.
- Create navigation and page structure.
- Define typed mission and component data.
- Implement responsive layouts.
Phase 2 — Mission Builder
- Create component library.
- Create spacecraft configuration.
- Implement all budget calculations.
- Implement validation.
- Create spacecraft preview.
- Add save and load.
Phase 3 — Simulation Engine
- Implement simulation state.
- Implement mission phases.
- Implement propulsion and power updates.
- Implement data generation and storage.
- Implement communication windows.
- Implement event handling.
- Implement simulation controls.
Phase 4 — Mission Objectives
- Add science objectives.
- Add instrument operations.
- Add data return requirements.
- Add mission completion logic.
- Add scoring and debrief.
Phase 5 — Learning and Polish
- Add contextual learning.
- Add design comparison.
- Add mission replay.
- Add animations and transitions.
- Improve accessibility.
- Add final visual polish.
Phase 6 — Testing
- Test every mission.
- Test every primary interaction.
- Test the budget equations.
- Test failure and partial-success states.
- Test refresh recovery.
- Fix errors before considering the project complete.

26. Suggested Demo Sequence
For a strong project demonstration:
1. Open SkyRift’s landing page.
2. Start the Lunar Explorer mission.
3. Show the mission objectives.
4. Open the spacecraft builder.
5. Add a science instrument.
6. Show the mass, power, cost, and data changes.
7. Demonstrate a design warning.
8. Fix the warning.
9. Launch the mission.
10. Show mission telemetry and elapsed time.
11. Trigger or respond to a mission event.
12. Complete science operations.
13. Return data.
14. Show the mission report.
15. Replay with a modified spacecraft design.
The demo should clearly communicate that the game is interactive, educational, and driven by actual calculations.

27. Final Instruction to Google Antigravity
Build SkyRift as a complete, polished, playable website.

Before making changes:
1. Inspect the current repository.
2. Identify the existing framework and architecture.
3. Preserve any working code and assets.
4. Identify incomplete features.
5. Create an implementation plan.
Then implement the project in a way that prioritizes a complete playable core over disconnected visual features.

The result must include:
- A polished landing page
- Mission selection
- A working spacecraft builder
- Eight spacecraft subsystems
- Interconnected budgets
- Mission validation
- A functional simulation engine
- Mission events
- Science objectives
- Data return
- Mission scoring
- Mission reports
- Replay functionality
- Contextual learning
- Responsive design
- Persistence
- Testing
Use realistic relationships where possible, clearly label simplified physics, and label fictional game values honestly.

Do not stop after generating the interface. Finish the interactions, calculations, mission progression, and reporting.

The final result should be a complete SkyRift game that a user can open, play, learn from, and demonstrate. 