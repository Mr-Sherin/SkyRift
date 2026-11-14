import { getSupabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface MissionDebriefPayload {
  callsign: string;
  missionId: string;
  score: number;
  outcome: 'nominal_success' | 'partial_success' | 'critical_failure';
  turnsCompleted: number;
  scienceCollected: number;
  remainingBudget: number;
  remainingPropellant: number;
  remainingBattery: number;
  anomaliesResolved: number;
  telemetrySummary?: Record<string, unknown>;
}

export interface CraftDesignPayload {
  callsign: string;
  missionId: string;
  designName: string;
  launcherId?: string | null;
  parts: string[];
  totalMassKg: number;
  availableDeltaVMs: number;
  totalCostCredits: number;
  powerMarginW: number;
  isPublic?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  callsign: string;
  mission_id: string;
  score: number;
  outcome: string;
  turns_completed: number;
  science_collected: number;
  created_at: string;
}

/**
 * Records a completed mission debrief in Supabase.
 * Falls back gracefully to localStorage when Supabase is in offline mode.
 */
export async function submitMissionDebrief(payload: MissionDebriefPayload) {
  const sb = getSupabase();
  if (!sb) {
    // Local fallback persistence
    if (typeof window !== 'undefined') {
      try {
        const key = `skyrift_local_debriefs_${payload.missionId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift({
          id: `local-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
      } catch {
        // ignore
      }
    }
    return { success: true, mode: 'local' as const };
  }

  try {
    const { data, error } = await sb.from('mission_debriefs').insert([
      {
        callsign: payload.callsign,
        mission_id: payload.missionId,
        score: payload.score,
        outcome: payload.outcome,
        turns_completed: payload.turnsCompleted,
        science_collected: payload.scienceCollected,
        remaining_budget: payload.remainingBudget,
        remaining_propellant: payload.remainingPropellant,
        remaining_battery: payload.remainingBattery,
        anomalies_resolved: payload.anomaliesResolved,
        telemetry_summary: payload.telemetrySummary || {},
      },
    ]).select();

    if (error) throw error;
    return { success: true, mode: 'supabase' as const, data };
  } catch (err) {
    console.warn('[Supabase] Failed to write debrief (falling back to local):', err);
    return { success: true, mode: 'local_fallback' as const, warning: 'Database temporarily unavailable; saved locally.' };
  }
}

/**
 * Fetches the global leaderboard for a specific mission.
 */
export async function getMissionLeaderboard(missionId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
  const sb = getSupabase();
  if (!sb) {
    // Return local high scores if offline
    if (typeof window !== 'undefined') {
      try {
        const key = `skyrift_local_debriefs_${missionId}`;
        const existing: LeaderboardEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
        return existing.sort((a, b) => b.score - a.score).slice(0, limit);
      } catch {
        return [];
      }
    }
    return [];
  }

  try {
    const { data, error } = await sb
      .from('mission_debriefs')
      .select('id, callsign, mission_id, score, outcome, turns_completed, science_collected, created_at')
      .eq('mission_id', missionId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as LeaderboardEntry[]) || [];
  } catch (err) {
    console.warn('[Supabase] Failed to load leaderboard:', err);
    return [];
  }
}

/**
 * Saves a custom spacecraft configuration to the cloud Shipyard.
 */
export async function saveCraftDesign(payload: CraftDesignPayload) {
  const sb = getSupabase();
  if (!sb) {
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('skyrift_local_crafts') || '[]');
        existing.unshift({ id: `craft-${Date.now()}`, ...payload, created_at: new Date().toISOString() });
        localStorage.setItem('skyrift_local_crafts', JSON.stringify(existing));
      } catch {}
    }
    return { success: true, mode: 'local' as const };
  }

  try {
    const { data, error } = await sb.from('craft_designs').insert([
      {
        callsign: payload.callsign,
        mission_id: payload.missionId,
        design_name: payload.designName,
        launcher_id: payload.launcherId || null,
        parts: payload.parts,
        total_mass_kg: payload.totalMassKg,
        available_delta_v_ms: payload.availableDeltaVMs,
        total_cost_credits: payload.totalCostCredits,
        power_margin_w: payload.powerMarginW,
        is_public: payload.isPublic ?? true,
      },
    ]).select();

    if (error) throw error;
    return { success: true, mode: 'supabase' as const, data };
  } catch (err) {
    console.warn('[Supabase] Failed to save craft:', err);
    return { success: false, error: err };
  }
}

export interface StoredCraftDesign {
  id: string;
  callsign: string;
  mission_id: string;
  design_name: string;
  launcher_id?: string | null;
  parts: string[];
  total_mass_kg: number;
  available_delta_v_ms: number;
  total_cost_credits: number;
  power_margin_w: number;
  is_public: boolean;
  created_at: string;
}

export interface PilotProfile {
  id?: string;
  callsign: string;
  agency_name: string;
  difficulty_preference: string;
  missions_completed: number;
  total_score: number;
  unlocked_achievements: string[];
  created_at?: string;
}

/**
 * Fetches public or player craft blueprints from the Shipyard.
 */
export async function getCraftDesigns(missionId?: string): Promise<StoredCraftDesign[]> {
  const sb = getSupabase();
  if (!sb) {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('skyrift_local_crafts');
        const list: StoredCraftDesign[] = raw ? JSON.parse(raw) : [];
        return missionId ? list.filter((c) => c.mission_id === missionId) : list;
      } catch {
        return [];
      }
    }
    return [];
  }

  try {
    let query = sb
      .from('craft_designs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (missionId) {
      query = query.eq('mission_id', missionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as StoredCraftDesign[]) || [];
  } catch (err) {
    console.warn('[Supabase] Failed to fetch crafts:', err);
    return [];
  }
}

/**
 * Loads a pilot profile by callsign.
 */
export async function getPilotProfile(callsign: string): Promise<PilotProfile | null> {
  const sb = getSupabase();
  if (!sb) {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`skyrift_pilot_profile_${callsign}`);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return null;
  }

  try {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('callsign', callsign)
      .maybeSingle();

    if (error) throw error;
    return (data as PilotProfile) || null;
  } catch (err) {
    console.warn('[Supabase] Failed to get profile:', err);
    return null;
  }
}

/**
 * Creates or updates a pilot career profile.
 */
export async function upsertPilotProfile(profile: PilotProfile) {
  const sb = getSupabase();
  if (!sb) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`skyrift_pilot_profile_${profile.callsign}`, JSON.stringify(profile));
        localStorage.setItem('skyrift_player_name', profile.callsign);
      } catch {}
    }
    return { success: true, mode: 'local' as const };
  }

  try {
    const { data, error } = await sb
      .from('profiles')
      .upsert(
        {
          callsign: profile.callsign,
          agency_name: profile.agency_name || 'SkyRift Aerospace Agency',
          difficulty_preference: profile.difficulty_preference || 'standard',
          missions_completed: profile.missions_completed || 0,
          total_score: profile.total_score || 0,
          unlocked_achievements: profile.unlocked_achievements || [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'callsign' }
      )
      .select();

    if (error) throw error;
    return { success: true, mode: 'supabase' as const, data };
  } catch (err) {
    console.warn('[Supabase] Failed to upsert profile:', err);
    return { success: false, error: err };
  }
}

