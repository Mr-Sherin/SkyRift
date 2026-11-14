'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, ExternalLink, X, ShieldCheck, Cpu, HelpCircle } from 'lucide-react';
import { SourceStatus } from '@/game/types';

export interface SourceInfoBadgeProps {
  status: SourceStatus;
  url?: string;
  citation?: string;
  label?: string;
  inline?: boolean;
  className?: string;
  align?: 'left' | 'right' | 'center' | 'auto';
}

const SOLID_BG: Record<SourceStatus, string> = {
  nasa: '#04221b',
  derived: '#071d36',
  placeholder: '#241404',
};

const STATUS_CONFIG: Record<
  SourceStatus,
  {
    title: string;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    icon: typeof ShieldCheck;
  }
> = {
  nasa: {
    title: 'NASA Archive Verified',
    bg: 'bg-emerald-950/95',
    border: 'border-emerald-500/40',
    text: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    badgeText: 'NASA',
    icon: ShieldCheck,
  },
  derived: {
    title: 'Physically Derived Formula',
    bg: 'bg-sky-950/95',
    border: 'border-sky-500/40',
    text: 'text-sky-300',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    badgeText: 'DERIVED',
    icon: Cpu,
  },
  placeholder: {
    title: 'Gameplay Balanced Parameter',
    bg: 'bg-amber-950/95',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    badgeText: 'PLACEHOLDER',
    icon: HelpCircle,
  },
};

export function SourceInfoBadge({
  status,
  url,
  citation,
  label,
  inline = true,
  className = '',
  align = 'auto',
}: SourceInfoBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.derived;
  const targetUrl =
    url ||
    (status === 'nasa'
      ? 'https://science.nasa.gov/'
      : 'https://science.nasa.gov/learn/design-and-develop-science-missions/');

  const updatePosition = useCallback(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenW = window.innerWidth;
    const popW = Math.min(290, screenW - 24);

    let left: number;
    if (align === 'right') {
      left = rect.right - popW;
    } else if (align === 'left') {
      left = rect.left;
    } else {
      // Center over the icon by default
      left = rect.left + rect.width / 2 - popW / 2;
    }

    // Viewport boundary clamp: keep 12px away from left and right screen edges
    if (left + popW > screenW - 12) {
      left = screenW - 12 - popW;
    }
    if (left < 12) {
      left = 12;
    }

    // Vertical placement: open upward if space permits, otherwise downward
    const openUpward = rect.top >= 200;
    const top = openUpward ? rect.top - 8 : rect.bottom + 8;

    setCoords({
      top,
      left,
      width: popW,
      openUpward,
    });
  }, [align]);

  useEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScroll(event: Event) {
      // Don't close if scrolling inside the popup itself
      if (popupRef.current && popupRef.current.contains(event.target as Node)) {
        return;
      }
      updatePosition();
    }

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  const popupElement =
    isOpen && coords && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-modal="false"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              transform: coords.openUpward ? 'translateY(-100%)' : 'none',
              backgroundColor: SOLID_BG[status] || '#071d36',
              zIndex: 99999,
            }}
            className={`p-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] border ${cfg.border} animate-in fade-in zoom-in-95 duration-150 text-left pointer-events-auto select-none`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-white/10">
              <div className="flex items-center space-x-1.5 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border shrink-0 ${cfg.badgeBg}`}
                >
                  {cfg.badgeText}
                </span>
                <span className="text-[11px] font-mono font-bold text-white truncate">
                  {label || cfg.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-0.5 -mr-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 text-[11px] font-sans text-slate-200 leading-snug">
              {citation ||
                (status === 'nasa'
                  ? 'Directly verified from NASA mission engineering publications and public domain technical specifications.'
                  : status === 'derived'
                  ? 'Calculated via astrodynamics formulas (e.g. Tsiolkovsky, inverse-square, orbital period geometry).'
                  : 'Balanced gameplay value calibrated against NASA SMD Discovery/New Frontiers cost and payload envelopes.')}
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
              <span className={cfg.text}>{cfg.title}</span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-[#38BDF8] hover:text-white font-bold transition-colors group"
              >
                <span>Visit Source</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={containerRef}
      className={`${inline ? 'inline-flex' : 'flex'} items-center relative text-left ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={`Source information: ${cfg.title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-0.5 rounded transition-all duration-150 inline-flex items-center justify-center opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-rift-orange ${
          status === 'nasa'
            ? 'text-emerald-400 hover:text-emerald-300'
            : status === 'derived'
            ? 'text-sky-400 hover:text-sky-300'
            : 'text-amber-400 hover:text-amber-300'
        }`}
        title={`${label ? `${label}: ` : ''}${cfg.title}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {popupElement}
    </div>
  );
}

