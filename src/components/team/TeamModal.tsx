'use client';

import React, { useState } from 'react';
import { useTeam } from '@/game/team/TeamContext';
import { TEAM_ROLES, TeamRole } from '@/game/team/teamTypes';
import {
  Users,
  Compass,
  Wrench,
  FlaskConical,
  Radio,
  Copy,
  Check,
  X,
  ArrowRight,
  LogOut,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { sfx } from '@/lib/audio';

const roleIcons: Record<TeamRole, React.ComponentType<{ className?: string }>> = {
  director: Compass,
  engineer: Wrench,
  science: FlaskConical,
  comms: Radio,
};

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'create' | 'join';
}

export function TeamModal({ isOpen, onClose, initialTab = 'create' }: TeamModalProps) {
  const {
    gameMode,
    roomCode,
    myPlayerId,
    myRole,
    myName,
    isConnected,
    roomState,
    isHost,
    fillEmptyRoles,
    toggleFillEmptyRoles,
    createRoom,
    joinRoom,
    selectRole,
    leaveRoom,
  } = useTeam();

  const [tab, setTab] = useState<'create' | 'join'>(initialTab);
  const [nameInput, setNameInput] = useState(myName || '');
  const [codeInput, setCodeInput] = useState('');
  const [selectedRoleInput, setSelectedRoleInput] = useState<TeamRole>('engineer');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      sfx.playClick();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCreate = async () => {
    if (!nameInput.trim()) {
      setErrorMsg('Please enter a Commander Call-sign / Player Name.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await createRoom(nameInput.trim(), selectedRoleInput);
      sfx.playComponentAttach();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!nameInput.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!codeInput.trim()) {
      setErrorMsg('Please enter a 6-character room code.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await joinRoom(codeInput.trim().toUpperCase(), nameInput.trim());
      sfx.playComponentAttach();
    } catch (err: any) {
      setErrorMsg(err.message || 'Room not found or full.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.22)] shadow-[0_24px_70px_rgba(0,0,0,0.9)] flex flex-col justify-between"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(148,163,184,0.16)] bg-[#0D1733] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 text-[#FF5A1F] flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-[#FF5A1F] uppercase tracking-[0.2em]">
                MULTIPLAYER MISSION CONTROL // 4 PLAYERS
              </div>
              <h2 className="text-lg font-black text-[#F1F5F9] font-mono tracking-wide uppercase">
                {gameMode === 'team' ? `CREW ROOM: ${roomCode}` : 'TEAM MULTIPLAYER MODE'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0E1836] border border-[rgba(148,163,184,0.18)] text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-amber-400'
                }`}
              />
              <span className="font-bold text-[#F1F5F9]">
                {isConnected ? 'SERVER ONLINE' : 'CROSS-TAB SYNC'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#0E1836] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ACTIVE ROOM VIEW */}
          {gameMode === 'team' && roomCode ? (
            <div className="space-y-5">
              {/* Room Code Card with Copy */}
              <div className="p-4 rounded-xl bg-[#070E24] border border-[#FF5A1F]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_18px_rgba(255,90,31,0.12)]">
                <div>
                  <div className="text-[10px] font-mono text-[#FF5A1F] font-bold uppercase tracking-wider">
                    SHARE ROOM CODE WITH YOUR CREW
                  </div>
                  <div className="text-2xl font-black font-mono tracking-widest text-[#F1F5F9] mt-0.5">
                    {roomCode}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Up to 4 crew members can join from other tabs or devices.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2 rounded-xl bg-[#0E1836] hover:bg-[#15234A] border border-[#FF5A1F]/40 hover:border-[#FF5A1F] text-xs font-mono font-bold text-[#F1F5F9] flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#FF5A1F]" />
                        <span>COPY CODE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Fill Empty Roles Toggle */}
              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.18)] flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      fillEmptyRoles
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border border-slate-700 text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-white flex items-center space-x-2">
                      <span>FILL EMPTY ROLES</span>
                      {fillEmptyRoles && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-normal">
                          DEFAULT ON
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate sm:text-clip">
                      Empty roles are controlled by the room host, who can edit those categories and sign off on launch.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isHost}
                  onClick={() => toggleFillEmptyRoles(!fillEmptyRoles)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                    !isHost
                      ? 'opacity-60 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700'
                      : fillEmptyRoles
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-[#0E1836] text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500'
                  }`}
                  title={!isHost ? 'Only the room host can toggle Fill Empty Roles' : undefined}
                >
                  {fillEmptyRoles ? 'ENABLED (HOST)' : 'DISABLED'}
                </button>
              </div>

              {/* 4 Roles Claiming Grid */}
              <div>
                <div className="text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-2.5">
                  CREW ROLES &amp; ASSIGNMENTS (CHOOSE YOUR ROLE)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(TEAM_ROLES) as TeamRole[]).map((roleKey) => {
                    const role = TEAM_ROLES[roleKey];
                    const Icon = roleIcons[roleKey];
                    const isMyRole = myRole === roleKey;

                    // Find who holds this role in room
                    const holder = roomState
                      ? Object.values(roomState.players).find((p) => p.role === roleKey)
                      : null;

                    return (
                      <div
                        key={roleKey}
                        onClick={() => {
                          if (!holder || holder.id === myPlayerId) {
                            selectRole(roleKey);
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isMyRole
                            ? 'bg-[#15234A] border-2 border-[#FF5A1F] shadow-[0_0_20px_rgba(255,90,31,0.35)]'
                            : holder
                            ? 'bg-[#070E24] border-[rgba(148,163,184,0.1)] opacity-70 cursor-not-allowed'
                            : 'bg-[#0E1836] border-[rgba(148,163,184,0.18)] hover:border-[rgba(56,189,248,0.4)] shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${role.colorHex}25`, color: role.colorHex }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-mono font-bold tracking-wider text-[#F1F5F9]">
                              {role.name}
                            </span>
                          </div>

                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                              isMyRole
                                ? 'bg-[#FF5A1F]/20 border-[#FF5A1F]/40 text-[#FF5A1F]'
                                : holder
                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            {isMyRole ? 'YOU' : holder ? holder.name : 'AVAILABLE'}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#CBD5E1] mt-2 leading-relaxed">
                          {role.description}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-[rgba(148,163,184,0.12)] text-[10px] font-mono text-[#94A3B8] flex items-center justify-between">
                          <span className="font-semibold text-[#94A3B8]">SECRET GOAL:</span>
                          <span className="text-[#F1F5F9] truncate max-w-[190px]">{role.privateGoal.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Connected Crew List */}
              <div className="p-3.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.14)]">
                <div className="text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                  CONNECTED CREW MEMBERS ({roomState ? Object.keys(roomState.players).length : 1} / 4)
                </div>
                <div className="flex flex-wrap gap-2">
                  {roomState &&
                    Object.values(roomState.players).map((p) => {
                      const rInfo = p.role ? TEAM_ROLES[p.role] : null;
                      return (
                        <div
                          key={p.id}
                          className="px-3 py-1.5 rounded-lg bg-[#0A1228] border border-[rgba(148,163,184,0.18)] text-xs font-mono flex items-center space-x-2"
                        >
                          <span className="font-bold text-[#F1F5F9]">{p.name}</span>
                          {rInfo ? (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                              style={{
                                backgroundColor: `${rInfo.colorHex}20`,
                                borderColor: `${rInfo.colorHex}50`,
                                color: rInfo.colorHex,
                              }}
                            >
                              {rInfo.shortTitle}
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#94A3B8]">NO ROLE</span>
                          )}
                          {p.id === myPlayerId && (
                            <span className="text-[9px] text-[#FF5A1F] font-bold">(YOU)</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            /* CREATE / JOIN FORMS */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  YOUR CALL-SIGN / DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Commander Alex"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.2)] focus:outline-none focus:border-[#FF5A1F] font-mono text-sm text-[#F1F5F9]"
                />
              </div>

              {/* Sub-tabs: Create vs Join */}
              <div className="flex items-center space-x-2 p-1 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.16)]">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setTab('create');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    tab === 'create'
                      ? 'bg-[#FF5A1F] text-white shadow-[0_0_12px_rgba(255,90,31,0.4)]'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  CREATE TEAM ROOM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setTab('join');
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    tab === 'join'
                      ? 'bg-[#FF5A1F] text-white shadow-[0_0_12px_rgba(255,90,31,0.4)]'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  JOIN WITH CODE
                </button>
              </div>

              {tab === 'create' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      INITIAL ROLE ASSIGNMENT
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(TEAM_ROLES) as TeamRole[]).map((rKey) => {
                        const r = TEAM_ROLES[rKey];
                        const Icon = roleIcons[rKey];
                        return (
                          <button
                            key={rKey}
                            type="button"
                            onClick={() => setSelectedRoleInput(rKey)}
                            className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                              selectedRoleInput === rKey
                                ? 'bg-[#15234A] border-2 border-[#FF5A1F] shadow-[0_0_14px_rgba(255,90,31,0.3)]'
                                : 'bg-[#0E1836] border-[rgba(148,163,184,0.18)] hover:border-[rgba(56,189,248,0.4)]'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-[#FF5A1F]" />
                            <div>
                              <div className="text-xs font-mono font-bold text-[#F1F5F9]">{r.name}</div>
                              <div className="text-[10px] text-[#94A3B8]">{r.shortTitle}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] font-mono text-emerald-300/90 flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><b>Fill empty roles</b> is active by default so a lone player or partial crew can control all subsystems and sign off on launch without blocking.</span>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCreate}
                    className="w-full py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E64C0E] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,90,31,0.4)] flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <span>INITIALIZE TEAM ROOM</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      ENTER 6-CHARACTER ROOM CODE
                    </label>
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. SKY-42"
                      className="w-full px-4 py-3 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.2)] focus:outline-none focus:border-[#FF5A1F] font-mono text-base tracking-widest uppercase text-[#F1F5F9]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !codeInput.trim()}
                    onClick={handleJoin}
                    className="w-full py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E64C0E] text-white text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,90,31,0.4)] flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95"
                  >
                    <span>CONNECT TO CREW ROOM</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(148,163,184,0.16)] bg-[#070E24] flex items-center justify-between">
          {gameMode === 'team' ? (
            <button
              type="button"
              onClick={leaveRoom}
              className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>LEAVE ROOM &bull; SOLO MODE</span>
            </button>
          ) : (
            <div className="text-[11px] font-mono text-[#94A3B8] flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>Solo Mode allows 1 player to control all spacecraft categories.</span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0E1836] hover:bg-[#15234A] border border-[rgba(148,163,184,0.2)] text-white text-xs font-mono font-bold uppercase transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
