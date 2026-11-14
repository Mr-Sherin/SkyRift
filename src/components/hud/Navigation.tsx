'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Settings, LifeBuoy, HelpCircle, User, Users, BookOpen, Award, Radio, Trophy } from 'lucide-react';
import { sfx } from '@/lib/audio';
import { music } from '@/lib/music';
import { useGame } from '@/game/engine/GameContext';
import { useTeam } from '@/game/team/TeamContext';
import { TeamModal } from '@/components/team/TeamModal';
import { TeamErrorBoundary } from '@/components/team/TeamErrorBoundary';
import { DetailLevelToggle } from '@/lib/useDetailLevel';

const NAV_ITEMS = [
  { href: '/', label: 'OVERVIEW' },
  { href: '/missions', label: 'MISSIONS' },
  { href: '/hangar', label: 'HANGAR' },
  { href: '/flight-plan', label: 'FLIGHT PLAN' },
  { href: '/learn', label: 'LEARN' },
];

const EXTRA_ITEMS = [
  { href: '/learn', label: 'FIELD GUIDE & MANUAL', icon: BookOpen },
  { href: '/extra?tab=honors', label: 'HONORS & ACHIEVEMENTS', icon: Award },
  { href: '/?replayIntro=true', label: 'PROLOGUE / STORY', icon: Radio },
  { href: '/extra?tab=settings', label: 'GAME SETTINGS', icon: Settings },
  { href: '/sources', label: 'NASA SOURCES & CREDITS', icon: BookOpen },
  { href: '/debrief', label: 'MISSION REPORTS', icon: Trophy },
  { href: '/extra?tab=help', label: 'SUPPORT & HELP', icon: HelpCircle },
];

export function Navigation() {
  const pathname = usePathname();
  const { activeScenario } = useGame();
  const { gameMode, roomCode, myRoleInfo } = useTeam();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const extraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    music.initGestureUnlock();
  }, []);

  useEffect(() => {
    if (!extraOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (extraRef.current && !extraRef.current.contains(e.target as Node)) {
        setExtraOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExtraOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [extraOpen]);

  const isExtraActive = pathname === '/extra';

  return (
    <header className="sticky top-0 w-full bg-[#0A1228]/90 backdrop-blur-md border-b border-[rgba(148,163,184,0.16)] z-50 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: SkyRift Logo + Subtle Guideline */}
        <div className="flex items-center space-x-3.5 sm:space-x-4 shrink-0">
          <Link
            href="/"
            onClick={() => {
              sfx.playClick();
              setMobileMenuOpen(false);
              setExtraOpen(false);
            }}
            className="flex items-center space-x-2.5 sm:space-x-3 group"
          >
            <img
              src="/images/skyrift_logo.png"
              alt="SkyRift Logo"
              className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,90,31,0.4)] group-hover:scale-105 transition-transform"
            />
            <span className="font-mono text-base sm:text-lg font-black tracking-[0.25em] text-[#F1F5F9] whitespace-nowrap hidden md:inline-block">
              SKY RIFT
            </span>
          </Link>

          <div className="hidden 2xl:block w-16 h-[1px] bg-slate-700/60" />

          {pathname !== '/' && (
            <Link
              href="/missions"
              onClick={() => sfx.playClick()}
              className="hidden xl:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0E1836] border border-[rgba(148,163,184,0.18)] hover:border-[#FF5A1F] text-xs font-mono font-bold text-[#94A3B8] hover:text-[#F1F5F9] transition-colors whitespace-nowrap shrink-0"
              title="Active Mission Target"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] shadow-[0_0_8px_#FF5A1F]" />
              <span className="uppercase">{activeScenario.name}</span>
            </Link>
          )}
        </div>

        {/* Right: Nav Links + Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <nav className="hidden lg:flex items-center space-x-2.5 xl:space-x-3.5 text-xs font-mono font-bold tracking-[0.1em] text-[#94A3B8]">
            {NAV_ITEMS.map((item, idx) => {
              const isActive = pathname === item.href;
              const isDisabled = item.href === '/flight-plan' && !activeScenario?.id;
              return (
                <React.Fragment key={item.href}>
                  {idx > 0 && <span className="text-slate-700 select-none">|</span>}
                  <Link
                    href={item.href}
                    onClick={() => {
                      sfx.playClick();
                      setExtraOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    aria-disabled={isDisabled ? 'true' : undefined}
                    className={`py-1 border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-[#FF5A1F] border-[#FF5A1F] shadow-[0_2px_12px_rgba(255,90,31,0.5)]'
                        : isDisabled
                        ? 'text-slate-600 border-transparent cursor-not-allowed opacity-50'
                        : 'border-transparent hover:text-[#FF5A1F]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </React.Fragment>
              );
            })}

            <span className="text-slate-700 select-none">|</span>

            {/* EXTRA Dropdown */}
            <div ref={extraRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setExtraOpen((prev) => !prev);
                }}
                aria-expanded={extraOpen}
                aria-haspopup="menu"
                className={`inline-flex items-center space-x-1 py-1 border-b-2 transition-all whitespace-nowrap ${
                  isExtraActive || extraOpen
                    ? 'text-[#FF5A1F] border-[#FF5A1F]'
                    : 'border-transparent hover:text-[#FF5A1F]'
                }`}
              >
                <span>EXTRA</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-150 ${extraOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {extraOpen && (
                <div
                  role="menu"
                  aria-label="Extra options"
                  className="absolute right-0 top-full mt-3 w-56 rounded-xl bg-[#0A1228] border border-[rgba(148,163,184,0.2)] shadow-[0_12px_36px_rgba(0,0,0,0.7)] py-2 z-50 backdrop-blur-md"
                >
                  {EXTRA_ITEMS.map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        role="menuitem"
                        onClick={() => {
                          sfx.playClick();
                          setExtraOpen(false);
                        }}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-mono font-bold tracking-[0.12em] text-[#CBD5E1] hover:bg-[#0E1836] hover:text-[#FF5A1F] transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail Level Toggle */}
            <span className="text-slate-700 select-none">|</span>
            <DetailLevelToggle />

            {/* TEAM MULTIPLAYER PILL - Shown ONLY in team mode, small and unobtrusive */}
            {gameMode === 'team' && (
              <>
                <span className="text-slate-700 select-none">|</span>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setTeamModalOpen(true);
                  }}
                  title="Team Multiplayer Room"
                  className="flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[11px] font-mono font-bold tracking-wider uppercase whitespace-nowrap shrink-0 transition-all bg-[#FF5A1F]/15 border border-[#FF5A1F] text-[#FF5A1F] shadow-[0_0_10px_rgba(255,90,31,0.25)] hover:bg-[#FF5A1F]/25"
                >
                  <Users className="w-3 h-3 text-[#FF5A1F] shrink-0" />
                  <span className="whitespace-nowrap">
                    {roomCode || 'TEAM'} {myRoleInfo ? `[${myRoleInfo.badge}]` : ''}
                  </span>
                </button>
              </>
            )}
          </nav>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setMobileMenuOpen((prev) => !prev);
            }}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 rounded-lg border border-[rgba(148,163,184,0.18)] bg-[#0A1228] text-[#F1F5F9] hover:border-[#FF5A1F] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[rgba(148,163,184,0.16)] bg-[#0A1228]/95 backdrop-blur-md px-4 py-3 space-y-1">
          <div className="px-3 py-1.5 mb-2 rounded bg-[#0E1836] border border-[rgba(148,163,184,0.18)] flex items-center justify-between text-xs font-mono">
            <span className="text-[#94A3B8] uppercase">ACTIVE TARGET</span>
            <span className="font-bold text-[#FF5A1F] uppercase">{activeScenario?.name || 'ORBITAL SENTINEL'}</span>
          </div>
          <div className="px-3 py-1 mb-2 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">DETAIL LEVEL:</span>
            <DetailLevelToggle />
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  sfx.playClick();
                  setMobileMenuOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`block px-3 py-2.5 rounded text-xs font-mono font-bold tracking-[0.16em] transition-colors ${
                  isActive
                    ? 'bg-[#FF5A1F]/15 text-[#FF5A1F] border border-[#FF5A1F]/40'
                    : 'text-[#CBD5E1] hover:bg-[#0E1836] hover:text-[#FF5A1F]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-[rgba(148,163,184,0.16)]">
            <div className="px-3 py-1 text-xs font-mono font-bold tracking-[0.16em] text-[#94A3B8] uppercase">
              EXTRA
            </div>
            {EXTRA_ITEMS.map((sub) => {
              const Icon = sub.icon;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={() => {
                    sfx.playClick();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-mono font-bold tracking-[0.14em] text-[#CBD5E1] hover:bg-[#0E1836] hover:text-[#FF5A1F] transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-[#FF5A1F] shrink-0" />
                  <span>{sub.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Multiplayer Modal */}
      <TeamErrorBoundary>
        <TeamModal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} />
      </TeamErrorBoundary>
    </header>
  );
}
