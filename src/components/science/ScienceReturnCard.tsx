'use client';

import React, { useState, useEffect } from 'react';
import { fetchNasaScienceImage, NasaScienceImage, NASA_FALLBACK_IMAGES } from '@/data/nasaApi';
import { Sparkles, ExternalLink, Globe2, Eye, Info, Database, Radio } from 'lucide-react';
import { Panel, Badge, MissionSegmentChip } from '@/components/ui';

interface ScienceReturnCardProps {
  destination: string;
  missionName: string;
  totalScience: number;
  dataDownlinkedGb: number;
}

export function ScienceReturnCard({
  destination,
  missionName,
  totalScience,
  dataDownlinkedGb,
}: ScienceReturnCardProps) {
  const normKey = destination.toLowerCase().includes('moon')
    ? 'moon'
    : destination.toLowerCase().includes('mars')
    ? 'mars'
    : destination.toLowerCase().includes('bennu') || destination.toLowerCase().includes('asteroid')
    ? 'asteroid'
    : 'earth';

  const [nasaImage, setNasaImage] = useState<NasaScienceImage>(() => NASA_FALLBACK_IMAGES[normKey] || NASA_FALLBACK_IMAGES.earth);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchNasaScienceImage(destination)
      .then((data) => {
        if (isMounted) {
          setNasaImage(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [destination]);

  return (
    <Panel variant="default" className="p-6 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[rgba(148,163,184,0.18)]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-rift-orange text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-[0.2em] flex items-center space-x-1.5">
              <a
                href="https://images.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                NASA ARCHIVE • PRIMARY SCIENCE HARVEST
              </a>
              <span className="text-slate-500 font-normal">• SKY RIFT educational note</span>
            </div>
            <h3 className="text-base font-black text-white tracking-wide uppercase mt-0.5">
              AUTHENTIC PLANETARY OBSERVATION // {missionName}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <MissionSegmentChip segment="user" />
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
            {totalScience} SCIENCE PTS
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-400 font-bold">
            {dataDownlinkedGb} GB ARCHIVED
          </span>
        </div>
      </div>

      {/* Main Grid: Real NASA Image (Left/Top) + Observation Details (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Real NASA Image Box (5 cols) */}
        <div className="md:col-span-5 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md group aspect-video sm:aspect-4/3 flex items-center justify-center">
          <img
            src={imgError ? NASA_FALLBACK_IMAGES[normKey].imageUrl : nasaImage.imageUrl}
            alt={nasaImage.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

          {/* NASA Center attribution badge */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-slate-300">
            <span className="truncate max-w-[200px] font-medium bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
              {nasaImage.photographerOrCenter}
            </span>
            <span className="text-slate-400 font-bold bg-slate-900/80 px-1.5 py-0.5 rounded">
              {nasaImage.nasaId}
            </span>
          </div>
        </div>

        {/* Observation Metadata & Real Fact (7 cols) */}
        <div className="md:col-span-7 space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30 uppercase">
                {destination.toUpperCase()} RECONNAISSANCE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                NASA IMAGES API
              </span>
            </div>
            <h4 className="text-base font-black text-white leading-snug">
              {nasaImage.title}
            </h4>
          </div>

          {/* Real Scientific Fact Callout */}
          <div className="p-3.5 rounded-xl bg-[#050A1C] border border-[rgba(148,163,184,0.15)] space-y-1">
            <div className="text-[10px] font-mono font-bold text-rift-orange uppercase tracking-wider flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-rift-orange" />
              <span>REAL NASA SCIENTIFIC FACT</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {nasaImage.realFact}
            </p>
          </div>

          {/* Source Link & Telemetry Notes */}
          <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
            <span>Verified against NASA Planetary Data System</span>
            <a
              href={nasaImage.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rift-orange hover:underline font-bold inline-flex items-center space-x-1"
            >
              <span>View NASA Record</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </Panel>
  );
}

