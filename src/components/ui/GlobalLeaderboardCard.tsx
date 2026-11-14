'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, Award, CheckCircle2, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { LeaderboardEntry } from '@/services/supabaseService';

interface GlobalLeaderboardCardProps {
  missionId: string;
  missionName?: string;
  className?: string;
}

export function GlobalLeaderboardCard({
  missionId,
  missionName,
  className = '',
}: GlobalLeaderboardCardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?missionId=${encodeURIComponent(missionId)}&limit=8`);
      const json = await res.json();
      if (json.success && Array.isArray(json.leaderboard)) {
        setEntries(json.leaderboard);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [missionId]);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[#0A1228]/95 border border-[rgba(148,163,184,0.18)] shadow-xl ${className}`}>
      <div className="flex items-center justify-between border-b border-[rgba(148,163,184,0.15)] pb-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>GLOBAL HALL OF FAME</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {missionName ? `${missionName} Top Pilots` : 'Live Flight Leaderboard'}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchScores}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Supabase Leaderboard"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rift-orange' : ''}`} />
        </button>
      </div>

      {loading && entries.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-slate-400 animate-pulse">
          Connecting to Supabase Mission Records...
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-slate-400">
          No cloud flight records yet. Complete this flight to claim #1 on the leaderboard!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((item, idx) => {
            const isTop3 = idx < 3;
            const rankBadge =
              idx === 0
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                : idx === 1
                ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
                : idx === 2
                ? 'bg-amber-700/20 text-amber-400 border-amber-700/40'
                : 'bg-slate-800 text-slate-400 border-slate-700';

            const isNominal = item.outcome === 'nominal_success';

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1733]/80 border border-[rgba(148,163,184,0.12)] hover:border-[rgba(148,163,184,0.25)] transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className={`w-6 h-6 rounded-lg border font-mono text-xs font-black flex items-center justify-center shrink-0 ${rankBadge}`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-white truncate max-w-[120px] sm:max-w-[160px]">
                        {item.callsign || 'Pilot'}
                      </span>
                      {isNominal ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {item.turns_completed} turns &bull; +{item.science_collected} sci
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black font-mono text-rift-orange">
                    {item.score}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    POINTS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
