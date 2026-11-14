'use client';

import React from 'react';
import { useGameStore, GameStoreState } from './gameStore';

export type { GameStoreState } from './gameStore';
export { useGameStore } from './gameStore';

/**
 * GameProvider component maintaining compatibility with Next.js root layout.
 * The underlying state is managed centrally by useGameStore (Zustand + LocalStorage persistence).
 */
export function GameProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * useGame hook providing all game state, computed budgets, and actions.
 * Directly reads from and writes to the central useGameStore.
 */
export function useGame(): GameStoreState {
  return useGameStore();
}
