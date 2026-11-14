-- =============================================================================
-- SKYRIFT MISSION CONTROL // SUPABASE DATABASE SCHEMA
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PILOT PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  callsign TEXT NOT NULL UNIQUE,
  agency_name TEXT DEFAULT 'SkyRift Aerospace Agency',
  difficulty_preference TEXT DEFAULT 'standard',
  missions_completed INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  unlocked_achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRAFT DESIGNS (HANGAR SHIPYARD ARCHIVE)
CREATE TABLE IF NOT EXISTS public.craft_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  callsign TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  design_name TEXT NOT NULL,
  launcher_id TEXT,
  parts TEXT[] NOT NULL DEFAULT '{}',
  total_mass_kg NUMERIC(10, 2) NOT NULL,
  available_delta_v_ms NUMERIC(10, 2) NOT NULL,
  total_cost_credits NUMERIC(12, 2) NOT NULL,
  power_margin_w NUMERIC(10, 2) NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MISSION DEBRIEFS (FLIGHT RECORDS & TELEMETRY LOGS)
CREATE TABLE IF NOT EXISTS public.mission_debriefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  callsign TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('nominal_success', 'partial_success', 'critical_failure')),
  turns_completed INTEGER NOT NULL,
  science_collected NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_propellant NUMERIC(10, 2) NOT NULL DEFAULT 0,
  remaining_battery NUMERIC(10, 2) NOT NULL DEFAULT 0,
  anomalies_resolved INTEGER NOT NULL DEFAULT 0,
  telemetry_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REAL-TIME TEAM MULTIPLAYER ROOMS (CLOUD PERSISTENCE & HISTORY)
CREATE TABLE IF NOT EXISTS public.team_rooms (
  code TEXT PRIMARY KEY,
  host_callsign TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  mission_id TEXT,
  launcher_id TEXT,
  installed_parts TEXT[] DEFAULT '{}',
  chat_log JSONB DEFAULT '[]'::jsonb,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR FAST LEADERBOARD & QUERY PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_debriefs_mission_score ON public.mission_debriefs (mission_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_debriefs_created ON public.mission_debriefs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_craft_mission ON public.craft_designs (mission_id, created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craft_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated reads for leaderboards and public designs
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can create a profile" 
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Public craft designs are viewable by everyone" 
  ON public.craft_designs FOR SELECT USING (is_public = true);

CREATE POLICY "Anyone can save a craft design" 
  ON public.craft_designs FOR INSERT WITH CHECK (true);

CREATE POLICY "Mission debriefs are viewable by everyone" 
  ON public.mission_debriefs FOR SELECT USING (true);

CREATE POLICY "Anyone can record a mission debrief" 
  ON public.mission_debriefs FOR INSERT WITH CHECK (true);

CREATE POLICY "Team rooms are accessible by code" 
  ON public.team_rooms FOR ALL USING (true) WITH CHECK (true);
