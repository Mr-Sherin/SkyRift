# SKYRIFT: MISSION CONTROL

## Deep Product, Game Design, Engineering, UX, and Implementation Blueprint

### NASA Space Apps Challenge 2026 \| Antigravity Build Specification

**Document purpose:** This is the primary specification for building the
complete SkyRift website and playable game. Give this entire file to
Antigravity and ask it to implement the product in the existing
repository.

**Important honesty note:** No prompt or project can guarantee a
hackathon win. This brief is designed to maximize the project's quality,
completeness, originality, educational value, technical credibility, and
demo strength. Judges' criteria and competing projects are outside our
control.

------------------------------------------------------------------------

# 0. ANTIGRAVITY MASTER INSTRUCTION

You are the lead product engineer, game designer, simulation engineer,
UX designer, accessibility reviewer, and QA engineer for **SkyRift:
Mission Control**.

Your job is to implement a complete, polished, playable, responsive
website---not just a landing page, dashboard mockup, or design
prototype.

## Non-negotiable rules

1.  Inspect the repository before making changes. Identify the
    framework, current files, existing functionality, package manager,
    and available scripts.
2.  Preserve working code. Do not wipe or replace a project simply
    because a new structure is easier.
3.  Build the real application, including working navigation, game
    state, mission logic, resource calculations, interaction controls,
    feedback, retry, and save behavior.
4.  Never leave visible controls as decorative buttons. Every control
    must work, or be clearly marked as a future feature and omitted from
    the main playable path.
5.  Do not fake live NASA data, multiplayer, telemetry, physics
    accuracy, or API integration. Clearly distinguish simulated values
    from real sourced information.
6.  Prefer robust, testable, understandable code over an oversized
    implementation that does not run.
7.  Work in milestones, but keep the app runnable at the end of each
    milestone.
8.  Run available build, lint, and tests frequently. Fix errors before
    proceeding.
9.  Do not stop after producing a plan or mockup. Implement the
    application.
10. If context or time is limited, finish the required MVP and its
    quality before adding optional features.
11. Use sensible defaults when details are unspecified. Do not
    repeatedly ask the user questions that can be resolved through
    engineering judgment.
12. At the end, provide a concise summary of what is implemented, how to
    run it, what was tested, and what remains incomplete.

## Execution protocol

-   First inspect the project.
-   Briefly report the detected stack and implementation plan.
-   Implement the application in the repository.
-   Validate the result.
-   Continue improving until the acceptance criteria in this file are
    met.
-   Do not claim completion unless the application builds and the main
    game loop can actually be played.

------------------------------------------------------------------------

# 1. PROJECT VISION

## 1.1 Product name

**SkyRift: Mission Control**

## 1.2 Tagline

**Design the mission. Own the decisions. Reach beyond.**

Alternative short tagline for the hero: **Every decision changes the
mission.**

## 1.3 Product summary

SkyRift is a browser-based, interactive space mission design and
operations game. Players take the role of a mission team: they define a
scientific objective, assemble a spacecraft, select instruments and
launch systems, manage mass, power, fuel, budget, data, communication,
and mission time, then launch and operate the mission. They encounter
decisions and system events, complete science activities, and receive a
transparent debrief explaining how their engineering choices affected
the outcome.

The experience should combine: - The clarity of an educational
interactive. - The depth of a strategy / resource-management game. - The
visual appeal of a space simulation. - The decision-making of a
mission-control experience. - The credibility of documented, simplified
engineering models.

## 1.4 Core promise

A player should be able to understand this principle through play:

> A spacecraft is a system of connected trade-offs. Improving one
> capability can increase mass, cost, power demand, data volume, risk,
> or mission complexity. There is no universally perfect design---there
> are designs that best satisfy a mission's goals and constraints.

## 1.5 NASA challenge alignment

The challenge brief describes a game where players can: - Define a
mission objective. - Design a spacecraft. - Select scientific
instruments. - Choose launch vehicles and orbits. - Manage budget, mass,
power, communications, data, and mission lifetime. - Understand the
effects of decisions across the whole mission. - Simulate and evaluate
mission performance. - Learn from outcomes. - Optionally collaborate in
groups of up to four.

SkyRift must make those requirements visible in both the gameplay and
the demo. The application should be educational and honest about its
simplified model.

## 1.6 Target audience

-   Beginners and youth curious about space.
-   Engineering and computer science students.
-   Players interested in strategy, building, and simulation.
-   Hackathon judges evaluating originality, relevance, usability,
    technical implementation, educational impact, and demo clarity.

## 1.7 Product values

-   **Interactive:** the user does things, not merely reads.
-   **Legible:** the user understands system state and consequences.
-   **Educational:** the game explains the "why."
-   **Replayable:** different decisions can produce different results.
-   **Accessible:** beginner-friendly without being shallow.
-   **Credible:** calculations are consistent and assumptions are
    visible.
-   **Reliable:** a complete playable path works without account setup
    or external API keys.

------------------------------------------------------------------------

# 2. PRODUCT SCOPE AND PRIORITIES

Use three levels of scope.

## P0 --- Required for a complete playable hackathon product

-   High-quality landing page and navigation.
-   Mission selection and briefing.
-   At least one deeply playable mission; preferably three scenarios
    using the same engine.
-   Spacecraft builder with functional components.
-   Live resource calculations and validation.
-   Launch vehicle and mission-plan selection.
-   Interactive launch.
-   Mission operations with timeline and telemetry.
-   At least one meaningful event / decision.
-   Mission outcome and detailed debrief.
-   Retry and revise design.
-   Responsive layout.
-   Demo mode without login.
-   Clear educational explanations.
-   Build/test validation.

## P1 --- Strongly recommended differentiators

-   Interactive 2D/3D solar-system visualization.
-   Mission route / orbit display.
-   Landing sequence and rover exploration.
-   More emergency events.
-   Guided tutorial and contextual help.
-   Saved missions and mission comparisons.
-   Beautiful cinematic transitions and restrained sound design.
-   Accessibility and keyboard controls.
-   Demo scenario that can be completed reliably in a few minutes.

## P2 --- Add only after P0/P1 work reliably

-   Real-time online multiplayer for four players.
-   Leaderboard.
-   Accounts and cloud save.
-   User-created mission sharing.
-   Advanced orbital mechanics.
-   Additional campaign chapters.
-   Complex 3D spacecraft assembly.
-   Detailed terrain and rover physics.

**Do not sacrifice a complete P0 loop to create a half-finished P2
feature.**

------------------------------------------------------------------------

# 3. USER JOURNEY AND GAME LOOP

## 3.1 First-time player journey

1.  Arrive at the SkyRift landing page.
2.  Understand the concept in under ten seconds.
3.  Click **Start Mission**.
4.  Choose a scenario and difficulty.
5.  Read a concise briefing and objective.
6.  Enter the hangar.
7.  Add components and see trade-offs update live.
8.  Resolve warnings and pass preflight checks.
9.  Select launch vehicle and orbit / route.
10. Launch the mission.
11. Monitor the spacecraft and respond to a decision event.
12. Complete a science objective or reach the mission destination.
13. View the mission debrief.
14. Retry with a different design or share / save the result.

The flow must not require account creation, external API credentials, or
a long tutorial.

## 3.2 Core loop

**Brief → Design → Validate → Plan → Launch → Operate → Decide → Achieve
→ Debrief → Improve**

## 3.3 Persistent game state

The current mission should maintain one canonical state containing: -
Scenario. - Difficulty. - Current phase. - Spacecraft configuration. -
Selected launch vehicle. - Orbit / trajectory choice. - Resource
totals. - Health / subsystem states. - Timeline. - Player actions. -
Event history. - Objective progress. - Score contributions. - Simulation
seed. - Result / debrief when complete.

Do not maintain separate conflicting resource totals in UI components.

------------------------------------------------------------------------

# 4. INFORMATION ARCHITECTURE AND WEBSITE PAGES

Create the following routes or equivalent views. Adapt routing to the
existing framework.

## 4.1 Home / landing

Purpose: explain the game and invite immediate play.

Required content: - SkyRift identity and tagline. - One clear CTA:
**Start a Mission**. - Secondary CTA: **How It Works** or **Explore the
Game**. - A strong space / spacecraft visual. - Three short value
statements: Design, Operate, Learn. - A concise "How to play" strip. -
Mission scenario previews. - Small project / educational disclaimer. -
Footer with navigation, credits, and source notes.

Avoid a generic template landing page. The game should be the focus.

## 4.2 Mission selection

Show scenario cards with: - Name. - Destination. - Mission type. -
Difficulty. - Main objective. - Approximate play time. - Key engineering
challenge. - Start button.

Scenarios: 1. Earth Observation. 2. Lunar Exploration. 3. Mars
Exploration.

Cards must be selectable and lead to the correct briefing.

## 4.3 Mission briefing

Show: - Mission narrative. - Primary objective. - Optional secondary
objectives. - Constraints and budget. - Required capabilities. - Mission
stages. - Success criteria. - Concepts the player will learn. - Start
Design button.

## 4.4 Hangar / spacecraft builder

Layout: - Left: component catalog grouped by system. - Center:
spacecraft assembly area / blueprint. - Right: selected component
details. - Persistent lower or side resource summary. - Preflight
warnings. - Undo / redo if feasible. - Reset, save draft, continue
buttons.

## 4.5 Mission planning

Show: - Launch vehicle options. - Orbit / trajectory options. - Mission
timeline estimate. - Compatibility checks. - Cost and risk
differences. - Mission summary. - Continue to preflight.

## 4.6 Preflight

Show a checklist with pass / warning / fail: - Mass / payload. -
Budget. - Power. - Propulsion / fuel. - Required instrument. -
Communications. - Scenario-specific conditions.

For every failed item, state the cause and a practical fix.

## 4.7 Launch simulation

Show: - Launch scene. - Countdown. - Controls. - Vehicle status. -
Altitude / velocity indicators (label as game simulation). - Fuel. -
Throttle. - Stage status. - Event log. - Pause, abort, retry, and
continue controls.

## 4.8 Mission control / operations

Show: - Space scene or mission route. - Current phase. - Telemetry. -
Resource levels. - Objective progress. - Timeline. - Alert panel. -
Event history. - Time controls. - Mission decision interface.

## 4.9 Landing / rover view

When scenario supports it: - Terrain / landing area visualization. -
Target marker. - Descent indicators. - Landing controls. - Rover
controls. - Science targets. - Battery / time. - Samples or data
collected.

## 4.10 Debrief

Show: - Outcome: success, partial success, or failure. - Overall
score. - Score breakdown. - Objective results. - Resource efficiency. -
Scientific return. - Timeline summary. - Key choices and their
effects. - Failure root cause if relevant. - Improvement suggestions. -
Retry, revise, compare, and home actions.

## 4.11 Optional pages

-   Saved missions.
-   Mission comparison.
-   Leaderboard.
-   Multiplayer room / team role selection.
-   Tutorial / help.

------------------------------------------------------------------------

# 5. VISUAL DESIGN SYSTEM

## 5.1 Visual direction

Create a premium, cinematic, modern space mission-control aesthetic. It
should feel purposeful and technical---not like a generic admin
dashboard.

Use: - Deep navy / near-black space background. - Subtle stars or nebula
texture, not noisy wallpaper. - Carefully restrained cyan, blue, amber,
and green status accents. - Clear typography hierarchy. - Crisp cards
and panels. - Fine borders and subtle glow only for important
elements. - High-quality spacecraft / planet imagery or procedural
visuals. - Meaningful motion and smooth transitions. - A strong visual
focal point in each screen.

Do not overuse glassmorphism, glow, gradients, or animation. Readability
is more important than decoration.

## 5.2 Typography

Use a modern, legible sans-serif. Consider a technical display style for
headings, but keep body text easy to read. Avoid tiny labels.

## 5.3 Layout

-   Desktop-first for the hackathon demo, but responsive on mobile.
-   Maintain a consistent top navigation / mission phase indicator.
-   Keep primary actions visible.
-   Avoid horizontal overflow.
-   Use sensible spacing and alignment.
-   Resource indicators should be readable and not require hovering to
    understand.

## 5.4 Motion

Use Framer Motion or CSS transitions for: - Page / phase transitions. -
Component placement. - Resource changes. - Countdown. - Alert arrival. -
Mission outcome reveal. - Score reveal.

Motion must be purposeful, respect reduced-motion settings, and never
block interaction.

## 5.5 Audio

Optional, user-controlled: - Muted by default or clearly opt-in. -
Launch ambience, alert sound, button feedback, mission completion. -
Volume and mute controls. - No critical information communicated only
through sound.

## 5.6 Responsive behavior

On smaller screens: - Convert component catalog / details into drawers
or stacked panels. - Keep key resource summaries visible. - Use large
touch targets. - Simplify or replace 3D interactions with a usable 2D
alternative. - Keep the game playable rather than merely shrinking the
desktop layout.

------------------------------------------------------------------------

# 6. SPACECRAFT BUILDER --- DETAILED REQUIREMENTS

## 6.1 Assembly model

Use a 2D grid / node / slot assembly model for the first release. A
freeform 3D assembly is optional and should not block functionality.

The assembly area should: - Show the spacecraft structure. - Allow
adding components. - Show attachment / placement state. - Highlight
selected component. - Display invalid placement or missing connection
states. - Support zoom / pan only if it can be implemented reliably. -
Provide an accessible list-based alternative to drag-and-drop.

## 6.2 Catalog categories

-   Structure / bus.
-   Propulsion.
-   Propellant storage.
-   Power generation.
-   Energy storage.
-   Communications.
-   Computer / control.
-   Scientific payload.
-   Attitude control.
-   Thermal / protection.
-   Landing system.
-   Rover / surface equipment.

## 6.3 Component data schema

Every component should be data-driven, for example:

``` ts
type SpacecraftComponent = {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  massKg: number;
  costCredits: number;
  powerDrawKw?: number;
  powerGenerationKw?: number;
  batteryCapacityKwh?: number;
  fuelCapacityKg?: number;
  fuelUseKgPerHour?: number;
  dataGenerationMbPerHour?: number;
  dataRateMbps?: number;
  scienceValue?: number;
  thrustRating?: number;
  missionTags: string[];
  compatibilityTags?: string[];
  iconKey: string;
};
```

Use real TypeScript types in the application; this sample is
illustrative.

## 6.4 Component behavior

Examples: - Instruments increase science value but require mass, cost,
power, and data capacity. - Solar panels generate power, but add mass
and cost. - Batteries provide stored energy but have finite capacity. -
Antennas increase downlink capacity, but add mass, cost, and power
demand. - Engines provide maneuver capability but consume propellant. -
Fuel tanks increase fuel capacity and mass. - A rover enables surface
science but requires power and adds mass. - A computer may be required
for advanced systems.

## 6.5 Builder feedback

Live feedback should include: - Total mass. - Payload capacity
remaining. - Total cost. - Power generation and demand. - Battery
reserve. - Propellant. - Data rate / data backlog expectation. - Science
value. - Warnings.

Show both values and visual bars. Use clear units.

## 6.6 Drag-and-drop quality

-   Provide visible drag affordance.
-   Provide a valid drop target.
-   Show hover / target feedback.
-   Prevent duplicate or incompatible placement where relevant.
-   Provide removal.
-   Avoid losing a component if dropped outside the target.
-   Add keyboard / button alternatives: select component → Add to
    spacecraft.

------------------------------------------------------------------------

# 7. SIMULATION MODEL AND ENGINEERING CREDIBILITY

## 7.1 Core principle

The game may simplify physics, but the rules must be consistent,
visible, and explainable. The simulation should be deterministic where
possible so a player can reproduce outcomes.

## 7.2 Central simulation module

Create pure functions where practical: -
`calculateSpacecraftTotals(configuration)` -
`validateMission(configuration, mission, launchVehicle)` -
`calculatePowerState(state, elapsedTime)` -
`calculateFuelState(state, action, elapsedTime)` -
`calculateDataState(state, elapsedTime)` -
`advanceMission(state, action, deltaTime)` -
`resolveEvent(state, event, selectedChoice)` -
`evaluateObjectives(state, mission)` -
`calculateMissionScore(state, mission)`

Names can differ, but responsibilities should remain separated and
testable.

## 7.3 Units and labels

Use explicit units: - Mass: kg. - Power: kW. - Energy: kWh. - Data: MB
or GB. - Data rate: Mbps. - Time: hours / days. - Budget: credits (game
currency). - Velocity: km/s only if the model supports the unit;
otherwise use a clearly labeled game index.

Do not mix real units with fictional points without a visible label.

## 7.4 Example formulas

These are starting points, not mandatory constants. Tune them for
gameplay and document them.

### Mass

`totalMassKg = structureMassKg + sum(componentMassKg) + propellantMassKg`

### Cost

`totalCostCredits = structureCost + componentCosts + launchCost + operationsCost`

### Power

`powerBalanceKw = generationKw - activeDemandKw`

If power balance is negative, use battery reserves according to the
simplified energy model. When the battery reaches zero, disable or
degrade systems according to priority.

### Battery

`batteryEnergyKwhNext = clamp(batteryEnergyKwh - netPowerKw * elapsedHours, 0, batteryCapacityKwh)`

Define the sign convention clearly. Do not let a battery charge and
discharge in contradictory ways in the same time step.

### Data

`dataBacklogNext = max(0, dataBacklog + dataGenerated - dataTransmitted)`

Limit transmitted data by antenna capacity, available communication
window, and power.

### Payload compatibility

`totalMassKg <= launchVehicle.payloadCapacityKgForSelectedOrbit`

If the game has a launch mass limit by orbit, store it per orbit
category instead of assuming a single universal capacity.

### Science

Science should be awarded for completing mission objectives and using
suitable instruments, not merely installing many instruments.

### Mission duration

Mission duration should be constrained by scenario rules and critical
resources. Explain why the mission ends early if a resource or subsystem
fails.

## 7.5 Preflight validation messages

Example: - **Payload capacity exceeded:** Your spacecraft is 420 kg over
the selected launch vehicle's limit. Remove mass or choose a
higher-capacity vehicle. - **Power shortfall:** Selected instruments
require 2.8 kW, but the spacecraft generates 2.1 kW. Add power
generation or reduce active payload. - **Data bottleneck:** Your
instrument generates data faster than the antenna can transmit it. Add
downlink capacity or reduce observation volume. - **Budget exceeded:**
Your design costs 14% above the mission budget. Replace a component or
select a less expensive launch option.

Messages must use actual calculated values, not fixed sample text.

## 7.6 Honest physics labeling

Add an "About the simulation" panel explaining: - Which parts use
simplified game rules. - Which quantities are illustrative. - Which
external facts are sourced. - That this is educational and not an
operational flight tool.

------------------------------------------------------------------------

# 8. MISSION SCENARIOS

Implement a data-driven scenario system so missions can share the same
engine.

## 8.1 Earth Observation --- "Eyes on Earth"

**Primary goal:** Deploy an observation spacecraft and collect a
required set of observation data.

Possible requirements: - Observation instrument. - Suitable orbit
choice. - Power balance. - Communications / downlink. - Data delivery
threshold.

Trade-offs: - Higher-resolution instrument produces more science and
more data. - More solar power adds mass. - More downlink capacity adds
cost and power draw. - Orbit choice changes coverage and mission
duration.

## 8.2 Lunar Exploration --- "Lunar Echo"

**Primary goal:** Reach lunar orbit or perform a simplified landing and
complete a science task.

Possible requirements: - Propulsion and propellant. - Communications. -
Science instrument. - Arrival / landing resource threshold.

Trade-offs: - Extra propellant improves maneuver margin but increases
launch mass. - Landing gear enables surface science but adds mass. - A
powerful instrument increases energy and data demands.

## 8.3 Mars Exploration --- "Red Frontier"

**Primary goal:** Deliver an orbiter, lander, or rover to Mars and
complete a scientific objective.

Possible requirements: - Mission architecture. - Propulsion / transfer
capability. - Communications. - Science objective. - Optional landing /
rover activity.

Trade-offs: - More payload increases science potential but strains
launch mass. - More power improves instrument operation but adds mass. -
Data collection must be balanced with downlink capacity. - Events may
require prioritizing mission survival over science.

## 8.4 Mission architecture options

For a manageable scope, offer: - Orbiter. - Lander. - Rover mission.

Do not require all architectures to have a fully accurate physics model.
Use distinct, documented game rules.

------------------------------------------------------------------------

# 9. LAUNCH EXPERIENCE

## 9.1 Sequence

1.  Launch readiness check.
2.  Countdown.
3.  Engine ignition.
4.  Liftoff.
5.  Controlled ascent.
6.  Stage separation if applicable.
7.  Fairing / payload release if represented.
8.  Orbit insertion or deployment.
9.  Launch outcome.

## 9.2 Controls

-   Start countdown.
-   Hold / abort.
-   Launch.
-   Throttle.
-   Stage separation.
-   Pause / resume.
-   Restart.
-   Camera change.

## 9.3 Launch simulation

Use a state machine, not unrelated booleans. Suggested phases:
`idle → checklist → countdown → ignition → ascent → staging → insertion → success/failure`

Player choices should affect the result. The model can be simplified but
must not be arbitrary.

## 9.4 Feedback

Show: - Mission phase. - Vehicle status. - Altitude / speed as simulated
telemetry. - Fuel remaining. - Throttle. - Stage. - Payload status. -
Alerts.

If altitude or velocity is illustrative, label it as such.

------------------------------------------------------------------------

# 10. FLIGHT SIMULATOR AND SPACE VISUALIZATION

## 10.1 Visual design

Use React Three Fiber / Three.js where it adds meaningful value: - A
starfield / space background. - Planet models or stylized spheres. -
Spacecraft model. - Mission route. - Target marker. - Camera controls. -
Selected-object labels.

Use procedural shapes or properly licensed assets. Avoid dependence on a
remote 3D asset that may fail during the demo.

## 10.2 Flight controls

-   Rotate spacecraft.
-   Adjust thrust / maneuver amount.
-   Select destination.
-   Execute maneuver.
-   Camera orbit / zoom.
-   Toggle map / spacecraft view.
-   Pause / resume.
-   Time acceleration.

## 10.3 Simplified navigation

Represent a mission route clearly. The player should understand: -
Current location / phase. - Target. - Route progress. - Fuel or maneuver
cost. - Result of a maneuver.

If using a 2D map instead of 3D, it is acceptable as long as it is
interactive and informative.

## 10.4 Performance

-   Lazy-load 3D scenes.
-   Avoid overly dense geometry.
-   Provide loading and fallback states.
-   Keep the main menu and core game usable if WebGL is unavailable.
-   Respect reduced motion.
-   Test on a typical student laptop.

------------------------------------------------------------------------

# 11. MISSION CONTROL AND TELEMETRY

## 11.1 Dashboard modules

-   Mission status.
-   Resource summary.
-   Power system.
-   Propulsion.
-   Communications.
-   Data management.
-   Science progress.
-   Event log.
-   Timeline.
-   Alerts.

## 11.2 Telemetry behavior

Every telemetry number must be linked to the simulation state. Do not
create decorative values that never change.

## 11.3 Alert levels

-   Informational.
-   Warning.
-   Critical.

Color is not the only signal; include icon / label / text.

## 11.4 Time control

-   Pause.
-   Resume.
-   1×.
-   2×.
-   5× or 10× if simulation can handle it.

Avoid time skipping past important interactive events. When an event
occurs, pause or slow down and request the player's decision.

------------------------------------------------------------------------

# 12. EMERGENCY EVENTS AND CHOICES

## 12.1 Event catalog

Create a data-driven event library: - Solar panel degradation. - Battery
anomaly. - Communications outage. - Fuel leak / increased consumption. -
Instrument fault. - Data storage nearing capacity. - Navigation
uncertainty. - Attitude-control fault. - Landing hazard. - Unexpected
science opportunity.

## 12.2 Event schema

Each event should include: - ID. - Title. - Narrative. - Trigger
condition. - Severity. - Systems affected. - Choice options. - Choice
consequences. - Recovery / duration. - Educational explanation. - Event
log text.

## 12.3 Meaningful choices

Each event should have at least two viable choices where possible. For
example, a power shortage may allow: - Turn off science instruments:
preserve power, lose science. - Use battery reserve: preserve science
now, increase later risk. - Reorient / reduce activity: lower power
demand, reduce observation or communication opportunity.

Consequences must be applied to the state and shown to the player. Avoid
"choice" buttons that all produce the same outcome.

## 12.4 Fairness

-   Avoid unavoidable instant failure without warning.
-   Use the player's current design and mission state to influence
    events.
-   Explain risks.
-   Keep the event catalog testable.
-   Provide a seeded event sequence for reliable demos.

------------------------------------------------------------------------

# 13. LANDING, ROVER, AND SCIENCE INTERACTION

## 13.1 Landing sequence

-   Choose a landing zone.
-   Show hazards.
-   Display descent speed and remaining fuel.
-   Allow throttle / braking / orientation choices.
-   Evaluate landing.
-   Show the reason for success or failure.

## 13.2 Rover controls

-   Move forward / backward / turn.
-   Select target.
-   Avoid obstacles.
-   Monitor battery.
-   Collect samples.
-   Transmit findings.

Use a small, clear playable area. Do not attempt a large open-world
terrain system for the hackathon MVP.

## 13.3 Science activity

-   Choose observation or sample target.
-   Confirm instrument suitability.
-   Consume time and power.
-   Generate data.
-   Increase science return.
-   Explain what the player learned.

------------------------------------------------------------------------

# 14. MISSION SCORE AND DEBRIEF

## 14.1 Outcome types

-   Success.
-   Partial success.
-   Failure.

Define thresholds per scenario and show them in the briefing or help.

## 14.2 Score categories

Use a transparent weighted score. Example categories: - Objective
completion. - Scientific return. - Resource efficiency. - Budget
efficiency. - Reliability / system health. - Data delivery. - Team
coordination, if applicable.

Weights should be stored in mission data and documented. Avoid a
black-box "AI score."

## 14.3 Debrief contents

-   Mission name and result.
-   Score and category breakdown.
-   Primary objective completion.
-   Secondary objectives.
-   Science return.
-   Resource consumption / remaining.
-   Budget used.
-   Data generated / transmitted.
-   Timeline.
-   Major events.
-   Player decisions and consequences.
-   Root cause for failure.
-   Specific next-run recommendations.

## 14.4 Replay and compare

-   Retry same mission.
-   Edit design.
-   Change launch vehicle / orbit.
-   Compare previous attempt.
-   Save mission configuration locally.
-   Export / share a text or JSON report if practical.

------------------------------------------------------------------------

# 15. MULTIPLAYER FOR UP TO FOUR PLAYERS

## 15.1 Roles

### Mission Commander

Owns mission objectives, coordinates choices, approves major decisions.

### Spacecraft Engineer

Owns component configuration, mass, power, propulsion, and
compatibility.

### Science Officer

Selects instruments, prioritizes science, manages observation strategy.

### Flight Operations

Owns launch, telemetry, communication, timeline, and event response.

## 15.2 Required collaboration behavior if implemented

-   Create or join room.
-   Room code.
-   Player display name.
-   Role assignment.
-   Shared mission state.
-   Shared decision / vote.
-   Show who made a decision.
-   Handle disconnected players.
-   Avoid state conflicts.

## 15.3 Implementation strategy

Use Supabase Realtime only if it is properly configured and tested.
Provide a local role-play mode without credentials. Do not claim online
multiplayer is active if only local state is used.

------------------------------------------------------------------------

# 16. LEARNING DESIGN

## 16.1 Teach through consequences

Do not rely on long text walls. Teach concepts when the player makes a
relevant choice.

Example: - When an instrument is selected, explain its mass, power
demand, data generation, and science value. - When the payload limit is
exceeded, explain why the launch vehicle cannot carry the spacecraft in
the selected scenario. - When data backlog grows, explain that the
spacecraft is generating information faster than it can transmit it. -
When power is short, explain generation, consumption, and battery
reserves.

## 16.2 Learning components

-   First-run tutorial.
-   Tooltips.
-   "Why does this matter?" popovers.
-   Optional hints.
-   Glossary.
-   Post-mission learning summary.
-   Failure explanation.

## 16.3 Beginner-friendly language

Define technical terms when first introduced. Keep explanations short,
precise, and connected to the player's current action.

------------------------------------------------------------------------

# 17. DATA SOURCES AND NASA CONTENT

## 17.1 Authenticity

Use verified NASA public material for optional reference imagery or
educational context where appropriate. NASA data should enhance the
game, not make the core loop fail if an API is unavailable.

## 17.2 Requirements

-   Cite or identify the source for factual content.
-   Respect API limits and attribution requirements.
-   Handle network failure.
-   Cache or bundle safe demo content when permitted.
-   Do not invent scientific facts.
-   Do not present game telemetry as live NASA data.
-   Do not imply NASA endorsement.
-   Use a clear educational simulation disclaimer.

## 17.3 Fallback

The game must work offline or with no external API credentials using
built-in scenario and component data.

------------------------------------------------------------------------

# 18. TECHNICAL ARCHITECTURE

## 18.1 Recommended stack

Use the repository's existing stack if viable. Otherwise: - Next.js App
Router. - TypeScript. - React. - Tailwind CSS. - Framer Motion. - React
Three Fiber / Three.js for 3D. - Supabase for optional persistence and
multiplayer.

Do not add unnecessary libraries or make external services mandatory for
the MVP.

## 18.2 Suggested directory organization

Adapt this to the actual repository:

``` text
src/
  app/
    page.tsx
    missions/
    briefing/
    hangar/
    planning/
    launch/
    operations/
    landing/
    debrief/
    multiplayer/
  components/
    shell/
    navigation/
    mission/
    spacecraft/
    builder/
    telemetry/
    simulation/
    events/
    debrief/
    learning/
    ui/
  game/
    types/
    data/
      missions/
      components/
      launch-vehicles/
      events/
    calculations/
    validation/
    engine/
    scoring/
    persistence/
  hooks/
  lib/
    storage/
    supabase/
    utils/
  styles/
  tests/
```

## 18.3 Architecture requirements

-   Keep mission data separate from UI.
-   Keep component data separate from UI.
-   Keep calculations pure where possible.
-   Keep simulation transitions centralized.
-   Keep scoring separate from simulation updates.
-   Keep persistence separate from core game state.
-   Use typed actions and state.
-   Avoid giant monolithic components.
-   Use shared UI primitives consistently.

## 18.4 State management

Use a predictable state model, such as a reducer or a well-structured
store. Actions might include: - `SELECT_MISSION` - `ADD_COMPONENT` -
`REMOVE_COMPONENT` - `MOVE_COMPONENT` - `SET_COMPONENT_CONFIGURATION` -
`SELECT_LAUNCH_VEHICLE` - `SELECT_ORBIT` - `START_COUNTDOWN` -
`SET_THROTTLE` - `SEPARATE_STAGE` - `ADVANCE_SIMULATION` -
`TRIGGER_EVENT` - `RESOLVE_EVENT` - `COMPLETE_OBJECTIVE` -
`END_MISSION` - `RETRY_MISSION`

Action names may differ. Keep transitions testable.

## 18.5 Persistence

-   Core game works without sign-in.
-   Save drafts and results locally.
-   Use versioned save data if practical.
-   Handle corrupted or outdated saves gracefully.
-   Supabase account / cloud save is optional.
-   Never expose service secrets in client bundles.
-   Include `.env.example` for any required configuration.

------------------------------------------------------------------------

# 19. QUALITY, TESTING, AND PERFORMANCE

## 19.1 Automated tests

Test: - Resource totals. - Component addition / removal. - Mass and
payload validation. - Budget validation. - Power balance and battery
behavior. - Data backlog. - Launch vehicle compatibility. - Mission
phase transitions. - Event choice effects. - Objective completion. -
Score calculation. - Retry/reset. - Save/load behavior.

## 19.2 Manual QA

-   Can a new user start a mission without login?
-   Does every primary button work?
-   Does the spacecraft builder accept and remove components?
-   Do totals update immediately?
-   Are invalid configurations explained?
-   Does launch use the selected configuration?
-   Do player choices affect the result?
-   Does an emergency choice change state?
-   Does the debrief reflect actual mission state?
-   Does retry reset correctly?
-   Does the website work on desktop and mobile?
-   Are loading and failure states handled?
-   Does the production build pass?
-   Is there any fake "live" data?
-   Are all external dependencies optional or safely handled?

## 19.3 Performance

-   Lazy-load 3D modules.
-   Avoid unnecessary rerenders.
-   Keep the simulation step manageable.
-   Use low-poly or procedural assets when practical.
-   Provide a 2D fallback.
-   Avoid blocking the UI during simulation.
-   Test on a typical student laptop and browser.

------------------------------------------------------------------------

# 20. HACKATHON PRESENTATION STRATEGY

## 20.1 What the judges should see

A short, memorable demonstration of the problem and the solution: 1.
Explain that real missions are constrained systems. 2. Select a mission.
3. Add a high-value instrument. 4. Show the mass, power, data, and
budget trade-offs. 5. Resolve a constraint. 6. Launch. 7. Respond to an
emergency. 8. Complete or partially complete the objective. 9. Show the
transparent debrief and learning feedback.

## 20.2 Demo-ready state

Prepare a repeatable demo scenario: - Preconfigured mission brief. -
Reliable starting design. - A meaningful choice event. - A clear success
or partial-success result. - A debrief with understandable score
categories.

Do not depend on unpredictable external APIs or networked multiplayer
during the main demo.

## 20.3 Differentiators

Aim to stand out through: - Real interactivity rather than a static
dashboard. - A connected system model: every component influences
multiple resources. - "Why this happened" explanations. - A visually
memorable mission-control experience. - A clear educational outcome. - A
reliable, polished end-to-end demo. - Honest scientific limitations.

------------------------------------------------------------------------

# 21. MILESTONE PLAN AND ACCEPTANCE CRITERIA

## Milestone 0 --- Repository and project setup

-   Inspect existing code.
-   Confirm framework and commands.
-   Establish reusable layout and design tokens.
-   Ensure app starts.

**Acceptance:** Application runs and routes/layout are established.

## Milestone 1 --- Complete playable MVP

Implement: - Home. - Mission selection. - One scenario. - Briefing. -
Builder. - Resource calculation. - Validation. - Launch. - Mission
outcome. - Debrief. - Retry.

**Acceptance:** A user can complete the full core loop with meaningful
choices and no dead-end controls.

## Milestone 2 --- Mission operations and events

Implement: - Mission control. - Telemetry. - Timeline. - Time
controls. - At least three event types. - Event decisions with
consequences.

**Acceptance:** Player operates a mission and handles a real
state-changing event.

## Milestone 3 --- More scenarios and learning

Implement: - Earth, Moon, Mars scenario data. - Difficulty levels. -
Tutorial and tooltips. - Scenario-specific objective and scoring.

**Acceptance:** Scenarios feel different while sharing the same engine.

## Milestone 4 --- Visual immersion and exploration

Implement: - 3D scene or high-quality 2D route map. - Flight controls. -
Mission route. - Landing / rover mini-game if feasible.

**Acceptance:** Visuals enhance gameplay and the game remains usable if
3D is unavailable.

## Milestone 5 --- Multiplayer and polish

Implement: - Four roles. - Local cooperative flow. - Online
synchronization only if tested. - Save / compare. - Accessibility and
responsive polish.

**Acceptance:** Collaboration works in the implemented mode and is
honestly labeled.

## Milestone 6 --- Final QA and presentation

-   Run build and lint.
-   Run tests.
-   Fix critical errors.
-   Test the demo flow.
-   Update README.
-   Document limitations and sources.

**Acceptance:** A judge can open the website and understand, play, and
finish the core experience.

------------------------------------------------------------------------

# 22. FINAL DEFINITION OF DONE

SkyRift is ready for the hackathon demo when: - The website is complete
enough to navigate naturally. - A player can start without signing in. -
The mission selection and briefing work. - The spacecraft builder is
interactive. - Engineering resource totals update correctly. - Invalid
designs show meaningful explanations. - The launch vehicle and mission
plan affect compatibility. - The launch and mission simulation are
playable. - At least one meaningful event decision changes the
mission. - Mission outcome depends on design and player actions. - The
debrief explains success, partial success, or failure. - Retry allows a
player to improve the design. - Visual design is polished and
responsive. - Core game logic is testable and documented. - The
application builds and runs reliably. - No fake feature or unsupported
scientific claim is presented as real.

------------------------------------------------------------------------

# 23. ANTIGRAVITY IMPLEMENTATION PROMPT

Use this final instruction after providing the document:

> Read this entire specification and treat it as the source of truth for
> SkyRift: Mission Control.
>
> First inspect the current repository, its framework, package manager,
> existing features, and scripts. Do not overwrite working code.
>
> Then implement the complete website and playable game. Do not stop at
> a plan, wireframe, landing page, or static dashboard. Build functional
> interactions and a coherent simulation state.
>
> Work in the milestone order in this document. Start with the complete
> playable MVP, keep the project runnable, and run build/lint/tests
> after each milestone. Fix errors before proceeding.
>
> Use your engineering judgment to make the project polished, engaging,
> accessible, responsive, and demo-ready. Add thoughtful enhancements
> that support the challenge objective, but do not add decorative
> complexity that compromises the core game.
>
> Use simplified, documented, internally consistent engineering rules.
> Make every major choice have a consequence and explain the outcome to
> the player. Clearly label illustrative simulation values and do not
> claim official NASA endorsement or exact flight physics.
>
> If a feature is too large to finish, implement a smaller working
> version and state the remaining limitation. Do not fake functionality.
>
> Continue implementing until the Definition of Done is satisfied. At
> the end, report the implemented features, commands to run the site,
> tests/build results, and any incomplete features.

**Primary success metric:** A first-time player can design a spacecraft,
understand the trade-offs, launch and operate a mission, make a
consequential decision, and learn from a clear debrief---all in one
polished website.
