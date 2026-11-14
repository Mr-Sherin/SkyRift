'use client';

import React, { useState } from 'react';
import { useTeam } from '@/game/team/TeamContext';
import { TEAM_ROLES, TeamRole } from '@/game/team/teamTypes';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { sfx } from '@/lib/audio';
import { Badge, CmlBadge } from '@/components/ui';

interface DesignReviewBoardProps {
  onAllApprovedChange?: (allApproved: boolean) => void;
}

export function DesignReviewBoard({}: DesignReviewBoardProps) {
  const {
    gameMode,
    roomCode,
    myRole,
    roomState,
    activeDesignReviews,
    submitDesignReview,
  } = useTeam();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (gameMode !== 'team' || !roomCode) {
    return null;
  }

  const ALL_ROLES: TeamRole[] = ['director', 'engineer', 'science', 'comms'];

  // Check roles present in room
  const claimedRoles: TeamRole[] = roomState
    ? (Object.values(roomState.players).map((p) => p.role).filter(Boolean) as TeamRole[])
    : [myRole || 'director'];

  const fillEmpty = roomState?.fillEmptyRoles ?? true;

  const anyRejected = ALL_ROLES.some((r) => activeDesignReviews[r]?.rejected);
  const allApproved = ALL_ROLES.every((r) => {
    if (claimedRoles.includes(r)) {
      return activeDesignReviews[r]?.approved;
    }
    // For empty roles, they must be approved (auto-approved by host) if fillEmpty is true
    return fillEmpty ? Boolean(activeDesignReviews[r]?.approved) : false;
  });

  const myReview = myRole ? activeDesignReviews[myRole] : null;

  const handleApprove = () => {
    sfx.playComponentAttach();
    submitDesignReview('approved');
  };

  const handleOpenReject = () => {
    sfx.playAlert();
    setRejectModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    submitDesignReview('rejected', rejectReason.trim());
    setRejectModalOpen(false);
    setRejectReason('');
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0A1228] border border-[rgba(148,163,184,0.16)] shadow-[0_4px_24px_rgba(0,0,0,0.4)] mb-6">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(148,163,184,0.14)] gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 text-[#FF5A1F] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#FF5A1F] uppercase tracking-wider">
                MULTI-CREW READINESS // CML GATE &amp; DESIGN REVIEW
              </span>
              <CmlBadge isGate />
            </div>
            <h2 className="text-base font-black text-[#F1F5F9] font-mono">
              ALL CREW MEMBERS MUST APPROVE BEFORE IGNITION
            </h2>
          </div>
        </div>

        <div>
          {allApproved ? (
            <Badge variant="good">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              REVIEW PASSED &bull; GO FOR LAUNCH
            </Badge>
          ) : anyRejected ? (
            <Badge variant="danger">
              <XCircle className="w-3.5 h-3.5 mr-1" />
              DESIGN REJECTED &bull; HOLD LAUNCH
            </Badge>
          ) : (
            <Badge variant="warn">
              <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />
              AWAITING CREW SIGN-OFF
            </Badge>
          )}
        </div>
      </div>

      {/* Rejection Notification Banner */}
      {anyRejected && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs font-mono text-rose-300">
          <div className="flex items-center space-x-2 font-bold mb-1 text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>DESIGN REJECTED BY CREW:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {ALL_ROLES.map((r) => {
              const rev = activeDesignReviews[r];
              if (rev?.rejected) {
                return (
                  <li key={r}>
                    <b className="uppercase text-rose-200">{TEAM_ROLES[r].name}:</b> &quot;{rev.reason || 'Requested redesign.'}&quot;
                  </li>
                );
              }
              return null;
            })}
          </ul>
          <p className="mt-2 text-[11px] text-rose-400">
            Address concerns in Hangar or Flight Plan, then re-submit for crew sign-off.
          </p>
        </div>
      )}

      {/* 4 Roles Sign-Off Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {ALL_ROLES.map((roleKey) => {
          const role = TEAM_ROLES[roleKey];
          const review = activeDesignReviews[roleKey];
          const isMe = myRole === roleKey;
          const isClaimed = claimedRoles.includes(roleKey);
          const holder = roomState
            ? Object.values(roomState.players).find((p) => p.role === roleKey)
            : null;

          const isApproved = Boolean(review?.approved);
          const isRejected = Boolean(review?.rejected);
          const isAutoApproved = !isClaimed && fillEmpty && isApproved;

          return (
            <div
              key={roleKey}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isAutoApproved
                  ? 'bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                  : isApproved
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : isRejected
                  ? 'bg-rose-950/40 border-rose-500/40'
                  : 'bg-[#0E1836] border-[rgba(148,163,184,0.14)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="font-bold text-[#F1F5F9] truncate">{role.name}</span>
                  {isMe ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FF5A1F]/20 text-[#FF5A1F] border border-[#FF5A1F]/30 shrink-0">
                      YOU
                    </span>
                  ) : holder ? (
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-[80px]">
                      {holder.name}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-purple-300 px-1 py-0.5 rounded bg-purple-950/50 border border-purple-500/30 shrink-0">
                      EMPTY
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-mono">
                  {isAutoApproved ? (
                    <div className="flex items-center space-x-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-[11px] leading-tight">Auto-approved (empty role)</span>
                    </div>
                  ) : isApproved ? (
                    <div className="flex items-center space-x-1 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Approved</span>
                    </div>
                  ) : isRejected ? (
                    <div className="flex items-center space-x-1 text-rose-300 font-bold">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Rejected</span>
                    </div>
                  ) : !isClaimed && fillEmpty ? (
                    <div className="flex items-center space-x-1 text-amber-300 font-medium">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px] leading-tight">Pending (host sign-off)</span>
                    </div>
                  ) : !isClaimed ? (
                    <div className="flex items-center space-x-1 text-slate-400 font-medium">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-[11px] leading-tight">Awaiting Crew</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-[#94A3B8] font-medium">
                      <Clock className="w-4 h-4 text-[#94A3B8] shrink-0" />
                      <span>Pending</span>
                    </div>
                  )}
                </div>
              </div>

              {isRejected && review.reason && (
                <p className="mt-2 text-[10px] text-rose-300 font-mono italic truncate">
                  &quot;{review.reason}&quot;
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons for Current Player */}
      {myRole && (
        <div className="mt-5 pt-4 border-t border-[rgba(148,163,184,0.14)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-[#94A3B8]">
            {myReview?.approved ? (
              <span className="text-emerald-300 font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>You approved this spacecraft design for launch.</span>
              </span>
            ) : myReview?.rejected ? (
              <span className="text-rose-300 font-bold flex items-center space-x-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>You rejected this design. Modify components to clear.</span>
              </span>
            ) : (
              <span>Your sign-off as <b className="text-[#F1F5F9]">{TEAM_ROLES[myRole].name}</b> is required to proceed.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!myReview?.approved && (
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-[0_0_14px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>APPROVE DESIGN</span>
              </button>
            )}

            {!myReview?.rejected && (
              <button
                type="button"
                onClick={handleOpenReject}
                className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>REJECT WITH REASON</span>
              </button>
            )}

            {(myReview?.approved || myReview?.rejected) && (
              <button
                type="button"
                onClick={() => submitDesignReview('rejected', 'Re-evaluating parameters')}
                className="px-3 py-1.5 rounded-xl border border-[rgba(148,163,184,0.2)] hover:border-[rgba(148,163,184,0.4)] text-[11px] font-mono text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              >
                Change Vote
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setRejectModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#0A1228] border border-rose-500/40 shadow-2xl p-6 space-y-4"
          >
            <div>
              <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                DESIGN REVIEW REJECTION
              </div>
              <h3 className="text-base font-bold text-[#F1F5F9] font-mono mt-0.5">
                Explain Why Launch Should Hold
              </h3>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Net power is negative during eclipse! Need another battery or solar wing."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-[#070E24] border border-[rgba(148,163,184,0.2)] focus:outline-none focus:border-rose-500 font-mono text-xs text-[#F1F5F9] placeholder:text-[#64748B]"
              />

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[rgba(148,163,184,0.2)] text-xs font-mono font-bold text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] disabled:opacity-50"
                >
                  SUBMIT REJECTION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
