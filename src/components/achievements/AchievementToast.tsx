'use client';

import React, { useState, useEffect } from 'react';
import { Achievement } from '@/data/achievements';
import {
  Trophy,
  X,
  Sparkles,
  Radio,
  Coins,
  Database,
  HeartPulse,
  Rocket,
  Sun,
  Moon,
  Compass,
  Zap,
  Wifi,
  Users,
  Calendar,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Radio,
  Coins,
  Database,
  HeartPulse,
  Rocket,
  Sun,
  Moon,
  Compass,
  Sparkles,
  Zap,
  Wifi,
  Trophy,
  Users,
  Calendar,
};

export function AchievementToast() {
  const [toasts, setToasts] = useState<Array<Achievement & { timestamp: number }>>([]);

  useEffect(() => {
    const handleUnlock = (e: Event) => {
      const custom = e as CustomEvent<Achievement>;
      if (!custom.detail) return;
      const ach = custom.detail;

      setToasts((prev) => [
        ...prev.filter((t) => t.id !== ach.id),
        { ...ach, timestamp: Date.now() },
      ]);
    };

    window.addEventListener('skyrift_achievement_unlocked', handleUnlock);
    return () => window.removeEventListener('skyrift_achievement_unlocked', handleUnlock);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4500);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full"
    >
      {toasts.map((toast) => {
        const IconComponent = ICON_MAP[toast.icon] || Trophy;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto p-3.5 rounded-xl bg-white border border-rift-orange/40 shadow-xl flex items-start space-x-3 transition-all animate-bounce-in"
            style={{
              boxShadow: '0 10px 25px -5px rgba(255, 94, 30, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-rift-orangeMuted border border-rift-orange/30 text-rift-orange flex items-center justify-center shrink-0">
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 text-[9px] font-mono font-bold text-rift-orange uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>ACHIEVEMENT UNLOCKED!</span>
              </div>
              <h4 className="text-xs font-black text-rift-text truncate mt-0.5">
                {toast.title}
              </h4>
              <p className="text-[11px] text-rift-muted leading-tight mt-0.5">
                {toast.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-rift-faint hover:text-rift-text transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

