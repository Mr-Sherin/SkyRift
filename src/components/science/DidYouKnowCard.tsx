'use client';

import React, { useState, useEffect } from 'react';
import { getDidYouKnowFact, DidYouKnowFact } from '@/data/nasaApi';
import { Lightbulb, RefreshCw, Compass } from 'lucide-react';
import { sfx } from '@/lib/audio';

interface DidYouKnowCardProps {
  destination?: string;
  variant?: 'light' | 'dark' | 'compact';
  className?: string;
}

export function DidYouKnowCard({
  destination,
  variant = 'light',
  className = '',
}: DidYouKnowCardProps) {
  const [fact, setFact] = useState<DidYouKnowFact>(() => getDidYouKnowFact(destination));

  const handleRefresh = () => {
    sfx.playClick();
    setFact(getDidYouKnowFact(destination));
  };

  if (variant === 'dark') {
    return (
      <div
        className={`p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-left backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <a
              href="https://science.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center space-x-1"
            >
              <span>DID YOU KNOW? • NASA ARCHIVE</span>
            </a>
            <span className="text-slate-500 font-normal">• SKY RIFT educational note</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            title="Next Fact"
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-slate-300 font-mono leading-relaxed">
          {fact.fact}
        </p>
        <div className="mt-1 text-[9px] font-mono text-slate-500">
          Source: {fact.source}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-3 rounded-lg bg-rift-canvas border border-rift-line text-xs font-mono text-rift-text flex items-start space-x-2.5 ${className}`}>
        <Lightbulb className="w-4 h-4 text-rift-orange shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-rift-orange uppercase text-[10px] block mb-0.5">
            DID YOU KNOW?
          </span>
          <p className="text-rift-slate leading-relaxed">{fact.fact}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl bg-[#0A1228] border border-[rgba(148,163,184,0.18)] text-left shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
              <a
                href="https://science.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                AEROSPACE FACT • NASA ARCHIVE
              </a>
              <span className="text-slate-500 font-normal">• SKY RIFT educational note</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          title="New Fact"
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-slate-200 font-medium leading-relaxed">
        {fact.fact}
      </p>

      <div className="mt-2 pt-1.5 border-t border-[rgba(148,163,184,0.15)] flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span><b>Category:</b> {fact.category.toUpperCase()}</span>
        <span><b>Ref:</b> {fact.source}</span>
      </div>
    </div>
  );
}

