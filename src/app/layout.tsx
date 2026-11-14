import type { Metadata } from 'next';
import './globals.css';
import { GameProvider } from '@/game/engine/GameContext';
import { TeamProvider } from '@/game/team/TeamContext';
import { TeamCommsDock } from '@/components/team/TeamCommsDock';
import { TeamErrorBoundary } from '@/components/team/TeamErrorBoundary';
import { Navigation } from '@/components/hud/Navigation';
import { AchievementToast } from '@/components/achievements/AchievementToast';

export const metadata: Metadata = {
  title: 'SKYRIFT: Orbital Frontier | NASA Space Apps Challenge',
  description: 'Design the mission. Master the orbital mechanics. Explore the solar system.',
  icons: {
    icon: '/images/skyrift_logo_64.png',
    shortcut: '/favicon.ico',
    apple: '/images/skyrift_logo_192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-rift-bg text-rift-text antialiased selection:bg-rift-orange selection:text-white">
        <TeamProvider>
          <GameProvider>
            <div className="relative min-h-screen flex flex-col justify-between">
              <Navigation />
              <main className="flex-1 flex flex-col">
                {children}
              </main>
              <TeamErrorBoundary>
                <TeamCommsDock />
              </TeamErrorBoundary>
              <AchievementToast />
            </div>
          </GameProvider>
        </TeamProvider>
      </body>
    </html>
  );
}
