'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTeam } from '@/game/team/TeamContext';
import { useGame } from '@/game/engine/GameContext';
import { TEAM_ROLES, QUICK_TACTICAL_MESSAGES } from '@/game/team/teamTypes';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Target,
} from 'lucide-react';
import { sfx } from '@/lib/audio';

export function TeamCommsDock() {
  const {
    gameMode,
    roomCode,
    myName,
    myRoleInfo,
    chatMessages,
    unreadChatCount,
    sendChatMessage,
    markChatRead,
  } = useTeam();

  const { budgets, selectedLauncher, selectedComponents } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom on new message - hook runs unconditionally on every render
  useEffect(() => {
    if (gameMode === 'team' && roomCode && isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen, gameMode, roomCode]);

  // If not in team mode, do not show dock
  if (gameMode !== 'team' || !roomCode) {
    return null;
  }

  const handleToggle = () => {
    sfx.playClick();
    if (!isOpen) {
      markChatRead();
    }
    setIsOpen(!isOpen);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const handleQuickSend = (msg: string) => {
    sfx.playClick();
    sendChatMessage(msg, true);
  };

  // Evaluate live status of player's private goal
  const goalCheck = myRoleInfo?.privateGoal.checkMet({
    budgets,
    selectedRocket: selectedLauncher,
    selectedComponents,
  });

  return (
    <aside aria-label="Team Communications Dock" className="fixed bottom-4 right-4 z-40 max-w-sm w-full select-none print:hidden">
      {/* =========================================================================
          COLLAPSED FLOATING HUD PILL
         ========================================================================= */}
      {!isOpen ? (
        <button
          type="button"
          onClick={handleToggle}
          className="w-full px-4 py-2.5 rounded-xl bg-[#0A1228]/95 backdrop-blur-md border border-[rgba(148,163,184,0.22)] shadow-[0_8px_30px_rgba(0,0,0,0.7)] hover:border-[#FF5A1F] flex items-center justify-between text-xs font-mono transition-all group"
        >
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span className="font-black text-[#F1F5F9]">ROOM: {roomCode}</span>
            {myRoleInfo && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase"
                style={{
                  backgroundColor: `${myRoleInfo.colorHex}25`,
                  borderColor: `${myRoleInfo.colorHex}50`,
                  color: myRoleInfo.colorHex,
                }}
              >
                {myRoleInfo.shortTitle}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {goalCheck && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  goalCheck.met ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-[#0E1836] text-[#94A3B8] border border-[rgba(148,163,184,0.2)]'
                }`}
              >
                GOAL: {goalCheck.met ? 'MET' : 'PENDING'}
              </span>
            )}

            <div className="relative">
              <MessageSquare className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5A1F] transition-colors" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-[#FF5A1F] text-white text-[9px] font-bold shadow-[0_0_6px_#FF5A1F]">
                  {unreadChatCount}
                </span>
              )}
            </div>
            <ChevronUp className="w-4 h-4 text-[#94A3B8] group-hover:text-[#FF5A1F] transition-transform" />
          </div>
        </button>
      ) : (
        /* =========================================================================
            EXPANDED SLIDE-UP COMMS & SECRET GOAL PANEL
           ========================================================================= */
        <div className="rounded-2xl bg-[#0A1228]/98 backdrop-blur-md border border-[rgba(148,163,184,0.24)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col max-h-[540px] overflow-hidden">
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-[rgba(148,163,184,0.16)] bg-[#0D1733] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
              <div>
                <div className="text-[9px] font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
                  TACTICAL UPLINK // ROOM {roomCode}
                </div>
                <div className="text-xs font-mono font-black text-[#F1F5F9]">
                  {myName} &bull; {myRoleInfo ? myRoleInfo.name : 'CREW MEMBER'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              className="p-1 rounded-lg hover:bg-[#0E1836] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Secret Private Goal Banner */}
          {myRoleInfo && goalCheck && (
            <div className="p-3 bg-amber-950/40 border-b border-amber-500/30">
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="font-bold text-amber-300 flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-[#FF5A1F]" />
                  <span>YOUR SECRET ROLE OBJECTIVE</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] border ${
                    goalCheck.met ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {goalCheck.met ? 'MET (+POINTS)' : 'IN PROGRESS'}
                </span>
              </div>
              <p className="text-xs text-[#CBD5E1] font-medium leading-tight">
                {myRoleInfo.privateGoal.description}
              </p>
              <div className="mt-1 text-[10px] font-mono text-amber-300">
                Current: <b className="text-[#F1F5F9]">{goalCheck.currentText}</b> &bull; Target: {goalCheck.targetText}
              </div>
            </div>
          )}

          {/* Quick-Action Tactical Message Buttons */}
          <div className="p-2.5 bg-[#070E24] border-b border-[rgba(148,163,184,0.14)]">
            <div className="text-[9px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              QUICK TACTICAL TRANSMISSIONS
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_TACTICAL_MESSAGES.slice(0, 5).map((quickMsg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickSend(quickMsg)}
                  className="px-2.5 py-1 rounded-lg bg-[#0E1836] border border-[rgba(148,163,184,0.18)] hover:border-[#FF5A1F] text-[10px] font-mono text-[#CBD5E1] hover:text-[#FF5A1F] whitespace-nowrap transition-colors shadow-xs"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Chat Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[160px] max-h-[220px] bg-[#070E24]/60">
            {chatMessages.length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-[#94A3B8]">
                No communications yet. Use tactical buttons or type below.
              </div>
            ) : (
              chatMessages.map((msg) => {
                const rInfo = msg.role ? TEAM_ROLES[msg.role] : null;
                const isMe = msg.senderName === myName;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col text-xs font-mono ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 text-[9px] text-[#94A3B8] mb-0.5">
                      <span className="font-bold text-[#F1F5F9]">{msg.senderName}</span>
                      {rInfo && (
                        <span
                          className="px-1 rounded text-[8px] font-bold uppercase"
                          style={{ backgroundColor: `${rInfo.colorHex}25`, color: rInfo.colorHex }}
                        >
                          {rInfo.badge}
                        </span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#FF5A1F] text-white rounded-tr-xs shadow-[0_0_10px_rgba(255,90,31,0.3)]'
                          : msg.isQuickMsg
                          ? 'bg-amber-950/70 border border-amber-500/40 text-amber-200 font-medium'
                          : 'bg-[#0E1836] border border-[rgba(148,163,184,0.2)] text-[#F1F5F9] rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Text Input Form */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-[rgba(148,163,184,0.16)] bg-[#0D1733] flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message to crew..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#070E24] border border-[rgba(148,163,184,0.2)] focus:outline-none focus:border-[#FF5A1F] font-mono text-xs text-[#F1F5F9] placeholder:text-[#64748B]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-lg bg-[#FF5A1F] hover:bg-[#E64C0E] text-white transition-colors disabled:opacity-40 shadow-[0_0_8px_rgba(255,90,31,0.3)]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
