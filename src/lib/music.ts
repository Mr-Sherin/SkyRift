/**
 * Web Audio API Soundtrack Engine for SkyRift.
 * Decodes local NCS tracks, detects each track's peak-energy drop ("high moment")
 * snapped to zero-crossings for gapless looping, and supports continuous
 * Auto-Mix rotation across all high-energy drops or single-track peak locking.
 */

export type MusicLoopMode = 'peak-mix' | 'peak-single' | 'full-track';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  vibe: string;
  /** Seconds bounds where the main high-energy chorus/drop lives */
  searchRange: [number, number];
  /** Guaranteed fallback peak loop points (seconds) */
  fallbackLoop: [number, number];
}

export const SOUNDTRACK_TRACKS: MusicTrack[] = [
  {
    id: 'feel-the-rush',
    title: 'FEEL THE RUSH',
    artist: 'tonytonychopper999 [NCS]',
    url: '/audio/feel-the-rush.mp3',
    vibe: 'HIGH ENERGY',
    searchRange: [40, 84],
    fallbackLoop: [50, 82],
  },
  {
    id: 'labels',
    title: 'LABELS',
    artist: 'Lynxie, Pat [NCS]',
    url: '/audio/labels.mp3',
    vibe: 'ADRENALINE',
    searchRange: [68, 116],
    fallbackLoop: [80, 112],
  },
  {
    id: 'dont-wanna-know',
    title: "DON'T WANNA KNOW!!!",
    artist: 'Laeko [NCS]',
    url: '/audio/dont-wanna-know.mp3',
    vibe: 'OVERDRIVE',
    searchRange: [38, 70],
    fallbackLoop: [39, 68],
  },
];

interface CachedTrack {
  buffer: AudioBuffer;
  peakStart: number;
  peakEnd: number;
}

export interface MusicStateSnapshot {
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  userPaused: boolean;
  volume: number;
  loopMode: MusicLoopMode;
  trackIndex: number;
  track: MusicTrack;
  peakStart: number;
  peakEnd: number;
  duration: number;
}

const PREFS_STORAGE_KEY = 'skyrift_music_prefs_v1';
const AUTO_MIX_SWITCH_MS = 58000;

function findRisingZeroCrossing(data: Float32Array, sampleRate: number, targetSec: number): number {
  const maxIdx = data.length - 1;
  const center = Math.max(1, Math.min(maxIdx - 1, Math.floor(targetSec * sampleRate)));
  const searchRadius = Math.floor(sampleRate * 0.045);
  const start = Math.max(1, center - searchRadius);
  const end = Math.min(maxIdx, center + searchRadius);

  let bestIdx = center;
  let bestDist = Infinity;

  for (let i = start; i <= end; i++) {
    if (data[i - 1] <= 0 && data[i] >= 0) {
      const dist = Math.abs(i - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
  }
  return bestIdx / sampleRate;
}

function analyzePeakLoopWindow(
  buffer: AudioBuffer,
  track: MusicTrack
): { peakStart: number; peakEnd: number } {
  const duration = buffer.duration;
  const sr = buffer.sampleRate;
  const ch0 = buffer.getChannelData(0);

  const rangeStart = Math.max(2, Math.min(duration - 16, track.searchRange[0]));
  const rangeEnd = Math.max(rangeStart + 16, Math.min(duration - 2, track.searchRange[1]));

  const binSec = 0.25;
  const samplesPerBin = Math.max(1, Math.floor(binSec * sr));
  const startBin = Math.floor((rangeStart * sr) / samplesPerBin);
  const endBin = Math.floor((rangeEnd * sr) / samplesPerBin);
  const totalBins = endBin - startBin;

  if (totalBins < 48) {
    const start = findRisingZeroCrossing(ch0, sr, Math.min(track.fallbackLoop[0], duration - 12));
    const end = findRisingZeroCrossing(ch0, sr, Math.min(track.fallbackLoop[1], duration - 1));
    return { peakStart: start, peakEnd: Math.max(start + 8, end) };
  }

  const binRms: number[] = new Array(totalBins);
  const stride = 8;
  for (let b = 0; b < totalBins; b++) {
    const offset = (startBin + b) * samplesPerBin;
    const limit = Math.min(ch0.length, offset + samplesPerBin);
    let sumSq = 0;
    let count = 0;
    for (let i = offset; i < limit; i += stride) {
      const s = ch0[i];
      sumSq += s * s;
      count++;
    }
    binRms[b] = count > 0 ? Math.sqrt(sumSq / count) : 0;
  }

  // Target ~30 seconds continuous peak drop window inside searchRange
  const windowBins = Math.min(totalBins - 1, Math.round(30 / binSec));
  let bestStartBin = 0;
  let bestScore = -1;

  for (let i = 0; i <= totalBins - windowBins; i++) {
    let sum = 0;
    for (let j = 0; j < windowBins; j++) {
      sum += binRms[i + j];
    }
    const mean = sum / windowBins;
    // Slight preference for a strong onset right at the start of the loop
    const onsetBoost = binRms[i] * 0.15;
    const score = mean + onsetBoost;
    if (score > bestScore) {
      bestScore = score;
      bestStartBin = i;
    }
  }

  const rawStart = rangeStart + bestStartBin * binSec;
  const rawEnd = Math.min(duration - 0.5, rawStart + windowBins * binSec);

  const peakStart = findRisingZeroCrossing(ch0, sr, rawStart);
  const peakEnd = findRisingZeroCrossing(ch0, sr, rawEnd);

  return {
    peakStart,
    peakEnd: Math.max(peakStart + 10, peakEnd),
  };
}

class SoundtrackEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array | null = null;

  private activeSource: AudioBufferSourceNode | null = null;
  private activeTrackGain: GainNode | null = null;
  private mixTimer: ReturnType<typeof setTimeout> | null = null;

  private cache = new Map<string, CachedTrack>();
  private loadingPromises = new Map<string, Promise<CachedTrack>>();
  private listeners = new Set<(snapshot: MusicStateSnapshot) => void>();

  private trackIndex = 0;
  private loopMode: MusicLoopMode = 'peak-mix';
  private volume = 0.40;
  private isMuted = false;
  private userPaused = false;
  private isPlaying = false;
  private isLoading = false;
  private playRequestId = 0;
  private gestureHooked = false;
  private prefsLoaded = false;

  private loadPrefs() {
    if (this.prefsLoaded || typeof window === 'undefined') return;
    this.prefsLoaded = true;
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.volume === 'number') {
        this.volume = Math.max(0, Math.min(1, parsed.volume));
      }
      if (parsed.loopMode === 'peak-mix' || parsed.loopMode === 'peak-single' || parsed.loopMode === 'full-track') {
        this.loopMode = parsed.loopMode;
      }
      if (typeof parsed.trackIndex === 'number' && parsed.trackIndex >= 0 && parsed.trackIndex < SOUNDTRACK_TRACKS.length) {
        this.trackIndex = parsed.trackIndex;
      }
    } catch {
      // ignore storage errors
    }
  }

  private savePrefs() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          volume: this.volume,
          loopMode: this.loopMode,
          trackIndex: this.trackIndex,
          userPaused: this.userPaused,
        })
      );
    } catch {
      // ignore storage errors
    }
  }

  private ensureAudioGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.78;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private async preloadAndAutoplay(index: number) {
    const safeIdx = ((index % SOUNDTRACK_TRACKS.length) + SOUNDTRACK_TRACKS.length) % SOUNDTRACK_TRACKS.length;
    const ctx = this.ensureAudioGraph();
    if (!ctx) return;
    const reqId = this.playRequestId;
    try {
      const track = SOUNDTRACK_TRACKS[safeIdx];
      const loaded = await this.fetchAndAnalyze(track);
      if (reqId !== this.playRequestId || this.userPaused || this.isMuted || this.isPlaying || this.isLoading) {
        return;
      }
      if (ctx.state === 'running') {
        this.playCachedTrack(safeIdx, loaded, true);
      } else {
        // Warm next track in cache while waiting for user gesture to unlock AudioContext
        setTimeout(() => this.prefetchNext(safeIdx), 500);
      }
    } catch {
      // ignore preload failures
    }
  }

  public initGestureUnlock() {
    this.loadPrefs();
    if (typeof window === 'undefined') return;

    if (!this.isMuted && !this.userPaused && !this.isPlaying && !this.isLoading) {
      void this.preloadAndAutoplay(this.trackIndex);
    }

    if (this.gestureHooked) return;
    this.gestureHooked = true;

    const unlock = () => {
      if (this.userPaused || this.isMuted) {
        return;
      }
      const ctx = this.ensureAudioGraph();
      if (!ctx) return;

      if (!this.isPlaying && !this.isLoading) {
        void this.startTrack(this.trackIndex, true);
      } else if (this.isPlaying && this.loopMode === 'peak-mix' && !this.mixTimer && ctx.state === 'running') {
        this.scheduleAutoMix(this.trackIndex);
      }

      if (ctx.state === 'running') {
        cleanup();
      } else {
        void ctx.resume().then(() => {
          if (ctx.state === 'running') {
            if (this.isPlaying && this.loopMode === 'peak-mix' && !this.mixTimer) {
              this.scheduleAutoMix(this.trackIndex);
            }
            cleanup();
          }
        }).catch(() => {});
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  private scheduleAutoMix(currentIdx: number) {
    if (this.loopMode !== 'peak-mix') return;
    this.clearMixTimer();
    this.mixTimer = setTimeout(() => {
      if (this.isPlaying && !this.userPaused && this.loopMode === 'peak-mix') {
        const nextIdx = (currentIdx + 1) % SOUNDTRACK_TRACKS.length;
        void this.startTrack(nextIdx, true);
      }
    }, AUTO_MIX_SWITCH_MS);
  }

  private async fetchAndAnalyze(track: MusicTrack): Promise<CachedTrack> {
    const cached = this.cache.get(track.id);
    if (cached) return cached;

    const existingPromise = this.loadingPromises.get(track.id);
    if (existingPromise) return existingPromise;

    const promise = (async () => {
      const ctx = this.ensureAudioGraph();
      if (!ctx) throw new Error('Web Audio unavailable');

      const res = await fetch(track.url);
      if (!res.ok) throw new Error(`Failed to fetch ${track.url}`);
      const arr = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arr);
      const { peakStart, peakEnd } = analyzePeakLoopWindow(buffer, track);
      const entry: CachedTrack = { buffer, peakStart, peakEnd };
      this.cache.set(track.id, entry);
      this.loadingPromises.delete(track.id);
      return entry;
    })().catch((err) => {
      this.loadingPromises.delete(track.id);
      throw err;
    });

    this.loadingPromises.set(track.id, promise);
    return promise;
  }

  private clearMixTimer() {
    if (this.mixTimer) {
      clearTimeout(this.mixTimer);
      this.mixTimer = null;
    }
  }

  private stopActiveSource(fadeSec = 0.25) {
    this.clearMixTimer();
    const src = this.activeSource;
    const gain = this.activeTrackGain;
    this.activeSource = null;
    this.activeTrackGain = null;

    if (src && gain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
        src.stop(now + fadeSec + 0.05);
      } catch {
        // already stopped
      }
    }
  }

  private prefetchNext(currentIdx: number) {
    const nextIdx = (currentIdx + 1) % SOUNDTRACK_TRACKS.length;
    const nextTrack = SOUNDTRACK_TRACKS[nextIdx];
    if (!this.cache.has(nextTrack.id) && !this.loadingPromises.has(nextTrack.id)) {
      void this.fetchAndAnalyze(nextTrack).catch(() => {});
    }
  }

  private playCachedTrack(safeIdx: number, loaded: CachedTrack, fadeIn: boolean) {
    const ctx = this.ensureAudioGraph();
    if (!ctx || !this.masterGain) return;

    // Crossfade out previous source cleanly
    this.stopActiveSource(fadeIn ? 0.9 : 0.15);

    const source = ctx.createBufferSource();
    source.buffer = loaded.buffer;
    source.loop = true;

    const usePeak = this.loopMode !== 'full-track';
    const loopStart = usePeak ? loaded.peakStart : 0;
    const loopEnd = usePeak ? loaded.peakEnd : loaded.buffer.duration;

    source.loopStart = loopStart;
    source.loopEnd = loopEnd;

    const trackGain = ctx.createGain();
    const now = ctx.currentTime;
    if (fadeIn) {
      trackGain.gain.setValueAtTime(0.001, now);
      trackGain.gain.linearRampToValueAtTime(1.0, now + 0.85);
    } else {
      trackGain.gain.setValueAtTime(1.0, now);
    }

    source.connect(trackGain);
    trackGain.connect(this.masterGain);
    source.start(0, loopStart);

    this.activeSource = source;
    this.activeTrackGain = trackGain;
    this.isPlaying = true;
    this.isLoading = false;
    this.emit();

    // Schedule smooth rotation into the next track's high moment once audio is actively running
    if (this.loopMode === 'peak-mix' && ctx.state === 'running') {
      this.scheduleAutoMix(safeIdx);
    }

    setTimeout(() => this.prefetchNext(safeIdx), 1500);
  }

  public async startTrack(index = this.trackIndex, fadeIn = true) {
    this.loadPrefs();
    const safeIdx = ((index % SOUNDTRACK_TRACKS.length) + SOUNDTRACK_TRACKS.length) % SOUNDTRACK_TRACKS.length;
    this.trackIndex = safeIdx;
    this.userPaused = false;
    this.savePrefs();

    const ctx = this.ensureAudioGraph();
    if (!ctx || !this.masterGain) return;

    const reqId = ++this.playRequestId;
    const track = SOUNDTRACK_TRACKS[safeIdx];
    const cached = this.cache.get(track.id);
    if (cached) {
      this.playCachedTrack(safeIdx, cached, fadeIn);
      return;
    }

    this.isLoading = true;
    this.emit();

    try {
      const loaded = await this.fetchAndAnalyze(track);
      if (reqId !== this.playRequestId || this.userPaused) {
        return;
      }
      this.playCachedTrack(safeIdx, loaded, fadeIn);
    } catch {
      this.isLoading = false;
      this.isPlaying = false;
      this.emit();
    }
  }

  public ensurePlaying() {
    this.loadPrefs();
    if (this.isMuted || this.userPaused || this.isPlaying || this.isLoading) return;
    void this.startTrack(this.trackIndex, true);
  }

  public togglePlayPause() {
    this.loadPrefs();
    if (this.isPlaying || this.isLoading) {
      this.playRequestId++;
      this.userPaused = true;
      this.isPlaying = false;
      this.isLoading = false;
      this.stopActiveSource(0.25);
      this.savePrefs();
      this.emit();
    } else {
      this.userPaused = false;
      if (this.isMuted) {
        this.setMuted(false);
      }
      void this.startTrack(this.trackIndex, true);
    }
  }

  public async nextTrack() {
    const nextIdx = (this.trackIndex + 1) % SOUNDTRACK_TRACKS.length;
    await this.startTrack(nextIdx, true);
  }

  public async prevTrack() {
    const prevIdx = (this.trackIndex - 1 + SOUNDTRACK_TRACKS.length) % SOUNDTRACK_TRACKS.length;
    await this.startTrack(prevIdx, true);
  }

  public async selectTrack(index: number) {
    await this.startTrack(index, true);
  }

  public setLoopMode(mode: MusicLoopMode) {
    this.loadPrefs();
    if (this.loopMode === mode) return;
    this.loopMode = mode;
    this.savePrefs();
    if (this.isPlaying) {
      void this.startTrack(this.trackIndex, true);
    } else {
      this.emit();
    }
  }

  public setVolume(nextVol: number) {
    this.loadPrefs();
    this.volume = Math.max(0, Math.min(1, nextVol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.savePrefs();
    this.emit();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      if (!muted && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.06);
    }
    if (!muted && !this.userPaused && !this.isPlaying && !this.isLoading) {
      void this.startTrack(this.trackIndex, true);
    } else if (!muted && this.isPlaying && this.loopMode === 'peak-mix' && !this.mixTimer) {
      this.scheduleAutoMix(this.trackIndex);
    }
    this.emit();
  }

  public getSpectrumLevels(barCount = 5): number[] {
    if (!this.analyser || !this.freqData || !this.isPlaying || this.isMuted) {
      return new Array(barCount).fill(0.12);
    }
    this.analyser.getByteFrequencyData(this.freqData as Uint8Array<ArrayBuffer>);
    const levels: number[] = [];
    const usableBins = Math.min(this.freqData.length, barCount * 3);
    const step = Math.max(1, Math.floor(usableBins / barCount));
    for (let b = 0; b < barCount; b++) {
      let sum = 0;
      for (let k = 0; k < step; k++) {
        sum += this.freqData[b * step + k] || 0;
      }
      const norm = sum / (step * 255);
      levels.push(Math.max(0.15, Math.min(1, norm * 1.35)));
    }
    return levels;
  }

  public getSnapshot(): MusicStateSnapshot {
    const track = SOUNDTRACK_TRACKS[this.trackIndex];
    const cached = this.cache.get(track.id);
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      isMuted: this.isMuted,
      userPaused: this.userPaused,
      volume: this.volume,
      loopMode: this.loopMode,
      trackIndex: this.trackIndex,
      track,
      peakStart: cached ? cached.peakStart : track.fallbackLoop[0],
      peakEnd: cached ? cached.peakEnd : track.fallbackLoop[1],
      duration: cached ? cached.buffer.duration : 0,
    };
  }

  public subscribe(fn: (snapshot: MusicStateSnapshot) => void): () => void {
    this.loadPrefs();
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }
}

export const music = new SoundtrackEngine();
