'use client';

import React, { useEffect, useState } from 'react';
import {
  Rocket,
  X,
  Save,
  Download,
  FolderOpen,
  Sparkles,
  Check,
  Cpu,
  Zap,
  Weight,
  Flame,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useGame } from '@/game/engine/GameContext';
import { StoredCraftDesign } from '@/services/supabaseService';
import { sfx } from '@/lib/audio';

interface ShipyardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShipyardModal({ isOpen, onClose }: ShipyardModalProps) {
  const {
    activeScenario,
    selectedComponents,
    selectedLauncher,
    budgets,
    addComponent,
    resetSpacecraft,
    selectLauncher,
    selectRocket,
  } = useGame();

  const [tab, setTab] = useState<'save' | 'blueprints'>('blueprints');
  const [craftName, setCraftName] = useState(`${activeScenario.name} Probe Mk-1`);
  const [callsign, setCallsign] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('skyrift_player_name') || 'Flight Director';
    }
    return 'Flight Director';
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [blueprints, setBlueprints] = useState<StoredCraftDesign[]>([]);
  const [loadingBlueprints, setLoadingBlueprints] = useState(false);
  const [deployedId, setDeployedId] = useState<string | null>(null);

  const fetchBlueprints = async () => {
    setLoadingBlueprints(true);
    try {
      const res = await fetch(`/api/crafts?missionId=${encodeURIComponent(activeScenario.id)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.designs)) {
        setBlueprints(json.designs);
      }
    } catch {
      // ignore
    } finally {
      setLoadingBlueprints(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBlueprints();
      setSaveSuccess(false);
    }
  }, [isOpen, activeScenario.id]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!craftName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        callsign: callsign.trim() || 'Flight Director',
        missionId: activeScenario.id,
        designName: craftName.trim(),
        launcherId: selectedLauncher?.id || null,
        parts: selectedComponents.map((c) => c.id),
        totalMassKg: budgets.totalMassKg,
        availableDeltaVMs: budgets.availableDeltaVMs,
        totalCostCredits: budgets.totalCostCredits,
        powerMarginW: budgets.powerMarginW,
        isPublic: true,
      };

      const res = await fetch('/api/crafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSaveSuccess(true);
        sfx.playSuccessChime();
        fetchBlueprints();
        setTimeout(() => setTab('blueprints'), 1000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = (design: StoredCraftDesign) => {
    resetSpacecraft();
    if (design.launcher_id) {
      if (selectLauncher) selectLauncher(design.launcher_id);
      if (selectRocket) selectRocket(design.launcher_id);
    }
    if (Array.isArray(design.parts)) {
      design.parts.forEach((partId) => addComponent(partId));
    }
    setDeployedId(design.id);
    sfx.playComponentAttach();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.22)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0D1733] border-b border-[rgba(148,163,184,0.18)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rift-orange/20 border border-rift-orange/40 flex items-center justify-center text-rift-orange">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                CLOUD SHIPYARD // SUPABASE ARCHIVE
              </div>
              <h2 className="text-base font-black text-white">
                Spacecraft Blueprints & Hangar Vault
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 bg-[#080E21] border-b border-[rgba(148,163,184,0.15)] flex space-x-3">
          <button
            type="button"
            onClick={() => setTab('blueprints')}
            className={`pb-2.5 px-3 font-mono text-xs font-bold uppercase transition-all border-b-2 flex items-center space-x-1.5 ${
              tab === 'blueprints'
                ? 'border-rift-orange text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Community Blueprints ({blueprints.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('save')}
            className={`pb-2.5 px-3 font-mono text-xs font-bold uppercase transition-all border-b-2 flex items-center space-x-1.5 ${
              tab === 'save'
                ? 'border-rift-orange text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Design</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {tab === 'save' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#0D1733] border border-[rgba(148,163,184,0.15)] space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Active Build Specifications
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#070D1E] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">WEIGHT</span>
                    <span className="font-bold text-white">{budgets.totalMassKg} kg</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070D1E] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">SPEED (Δv)</span>
                    <span className="font-bold text-emerald-400">{budgets.availableDeltaVMs.toLocaleString()} m/s</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070D1E] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">POWER MARGIN</span>
                    <span className={`font-bold ${budgets.powerMarginW >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {budgets.powerMarginW > 0 ? `+${budgets.powerMarginW}` : budgets.powerMarginW} W
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070D1E] border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">PARTS</span>
                    <span className="font-bold text-rift-orange">{selectedComponents.length} modules</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  Design Name
                </label>
                <input
                  type="text"
                  value={craftName}
                  onChange={(e) => setCraftName(e.target.value)}
                  placeholder="e.g., Artemis Polar Prospector Mk-II"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rift-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  Pilot Callsign
                </label>
                <input
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="e.g., Flight Director"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070D1E] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rift-orange"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || selectedComponents.length === 0}
                  className={`w-full py-2.5 rounded-xl font-mono font-bold text-xs uppercase flex items-center justify-center space-x-2 transition-all ${
                    saveSuccess
                      ? 'bg-emerald-600 text-white'
                      : saving || selectedComponents.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-rift-orange hover:bg-rift-orangeHover text-white shadow-lg active:scale-98'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Blueprint Saved to Supabase!</span>
                    </>
                  ) : saving ? (
                    <span>Uploading Blueprint...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Upload Blueprint to Cloud Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {loadingBlueprints && blueprints.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-slate-400 animate-pulse">
                  Querying Supabase Shipyard Vault...
                </div>
              ) : blueprints.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-slate-400">
                  No community blueprints found for {activeScenario.name}. Switch to the "Save Current Design" tab to upload the first blueprint!
                </div>
              ) : (
                blueprints.map((b) => {
                  const isDeployed = deployedId === b.id;
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-[#0D1733]/90 border border-[rgba(148,163,184,0.15)] hover:border-[rgba(148,163,184,0.3)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-white truncate">
                            {b.design_name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {b.parts?.length || 0} parts
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                          <span className="text-slate-300">By {b.callsign || 'Anonymous'}</span>
                          <span>&bull;</span>
                          <span>{b.total_mass_kg} kg</span>
                          <span>&bull;</span>
                          <span className="text-emerald-400">{b.available_delta_v_ms} m/s Δv</span>
                          <span>&bull;</span>
                          <span>{(b.total_cost_credits / 1000).toFixed(0)}K CR</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeploy(b)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                          isDeployed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rift-orange hover:bg-rift-orangeHover text-white shadow-sm'
                        }`}
                      >
                        {isDeployed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Deployed!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Deploy to Hangar</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
