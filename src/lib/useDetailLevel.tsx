'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Eye, Sliders } from 'lucide-react';
import { sfx } from '@/lib/audio';

export type DetailLevel = 'focus' | 'full';

const STORAGE_KEY = 'skyrift_detail_level';
const EVENT_NAME = 'skyrift_detail_level_change';

/**
 * Hook to read and toggle the UI detail level across the game.
 * - 'focus': Clean, distraction-free view with collapsed technical derivations.
 * - 'full': High-density view showing all telemetry chips, allowances, and formulas.
 * Persists in localStorage and stays in sync across components.
 */
export function useDetailLevel() {
  const [detailLevel, setDetailLevelState] = useState<DetailLevel>('focus');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'focus' || stored === 'full') {
        setDetailLevelState(stored);
      } else {
        // Default to focus
        setDetailLevelState('focus');
      }
    } catch {
      // ignore
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'focus' || e.newValue === 'full')) {
        setDetailLevelState(e.newValue);
      }
    };

    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent<DetailLevel>;
      if (customEvent.detail) {
        setDetailLevelState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_NAME, handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_NAME, handleCustom);
    };
  }, []);

  const setDetailLevel = useCallback((level: DetailLevel) => {
    setDetailLevelState(level);
    try {
      localStorage.setItem(STORAGE_KEY, level);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: level }));
    } catch {
      // ignore
    }
  }, []);

  const toggleDetailLevel = useCallback(() => {
    sfx.playClick();
    const next = detailLevel === 'focus' ? 'full' : 'focus';
    setDetailLevel(next);
  }, [detailLevel, setDetailLevel]);

  return {
    detailLevel,
    isFocus: detailLevel === 'focus',
    isFull: detailLevel === 'full',
    setDetailLevel,
    toggleDetailLevel,
  };
}

/**
 * Compact pill toggle component for the navigation header and toolbars.
 */
export function DetailLevelToggle({
  className = '',
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { detailLevel, toggleDetailLevel, isFull } = useDetailLevel();

  return (
    <button
      type="button"
      onClick={toggleDetailLevel}
      title={
        isFull
          ? 'Detail Level: FULL (Showing all engineering notes and formulas). Click for FOCUS mode.'
          : 'Detail Level: FOCUS (Clean decluttered view). Click for FULL density.'
      }
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
        isFull
          ? 'bg-[#0E1836] border-rift-orange text-rift-orange shadow-[0_0_10px_rgba(255,90,31,0.25)]'
          : 'bg-[#0A1228] border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500'
      } ${className}`}
    >
      <Sliders className="w-3.5 h-3.5 text-rift-orange shrink-0" />
      {showLabel && (
        <span className="tracking-wider uppercase">
          VIEW: <span className="text-white">{detailLevel.toUpperCase()}</span>
        </span>
      )}
    </button>
  );
}
