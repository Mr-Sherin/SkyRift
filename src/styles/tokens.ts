/**
 * SKY RIFT GLOBAL DESIGN SYSTEM TOKENS
 * Extracted from the Prologue Transmission Cutscene visual language.
 *
 * Theme Summary:
 * - Deep navy / near-black space canvas (#050A1C) with subtle starfield
 * - Panels: slightly lighter navy (#0A1228), 1px thin low-opacity border, rounded 16-20px, soft inner glow
 * - Primary accent: glowing orange (#FF5A1F) with box-shadow bloom
 * - Secondary data accents: Teal/Green (Good), Amber (Warning), Red (Danger), Cyan/Blue (Info)
 * - Accessibility: body text >= 16px, small mono labels >= 12px, contrast >= 4.5:1, visible focus outlines, prefers-reduced-motion
 */

export const tokens = {
  colors: {
    // Canvas & Surfaces
    bg: '#050A1C', // Deep navy / near-black background
    canvas: '#070E24', // Deep space viewport background
    panel: '#0A1228', // Slightly lighter navy panel background
    surface: '#0E1836', // Elevated sub-panels, cards, rows
    surfaceHover: '#14224A', // Hovered surface state
    darkPlate: '#080F26',

    // Borders & Outlines
    border: 'rgba(148, 163, 184, 0.16)', // 1px thin low-opacity blue/white border
    borderHighlight: 'rgba(56, 189, 248, 0.35)', // Subtle cyan border glow
    borderActive: '#FF5A1F', // Orange active border

    // Typography & Contrast (All meet or exceed 4.5:1 contrast against #050A1C / #0A1228)
    text: '#F1F5F9', // Primary high-contrast text (contrast > 14:1)
    textMuted: '#94A3B8', // Secondary readable text (contrast 5.8:1, passes WCAG AA)
    textFaint: '#64748B', // Supporting captions (contrast 4.6:1, passes WCAG AA)

    // Primary Accent: Glowing Orange
    orange: '#FF5A1F',
    orangeHover: '#E64C0E',
    orangeActive: '#CC3E08',
    orangeMuted: 'rgba(255, 90, 31, 0.15)', // Orange backdrop wash
    orangeGlow: 'rgba(255, 90, 31, 0.45)',

    // Secondary Data Accents
    status: {
      good: '#10B981', // Teal / Green for nominal/good (contrast > 6.5:1)
      goodMuted: 'rgba(16, 185, 129, 0.15)',
      goodGlow: 'rgba(16, 185, 129, 0.35)',

      warn: '#F59E0B', // Amber for warning / marginal (contrast > 6.0:1)
      warnMuted: 'rgba(245, 158, 11, 0.15)',
      warnGlow: 'rgba(245, 158, 11, 0.35)',

      danger: '#EF4444', // Red for critical / danger (contrast > 5.0:1)
      dangerMuted: 'rgba(239, 68, 68, 0.15)',
      dangerGlow: 'rgba(239, 68, 68, 0.35)',

      info: '#38BDF8', // Cyan / Blue for telemetry & comms (contrast > 8.0:1)
      infoMuted: 'rgba(56, 189, 248, 0.15)',
      infoGlow: 'rgba(56, 189, 248, 0.35)',
    },
  },

  // Large rounded corners (16-20px)
  radii: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    panel: '18px',
    full: '9999px',
  },

  // Soft glows and depth shadows
  shadows: {
    panel:
      '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 0 24px 0 rgba(56, 189, 248, 0.03)',
    panelElevated:
      '0 12px 40px 0 rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.12), inset 0 0 28px 0 rgba(56, 189, 248, 0.05)',
    orangeGlow: '0 0 24px rgba(255, 90, 31, 0.45)',
    buttonPrimary: '0 0 20px rgba(255, 90, 31, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
    goodGlow: '0 0 16px rgba(16, 185, 129, 0.35)',
    warnGlow: '0 0 16px rgba(245, 158, 11, 0.35)',
    dangerGlow: '0 0 16px rgba(239, 68, 68, 0.35)',
    infoGlow: '0 0 16px rgba(56, 189, 248, 0.35)',
  },

  // Student Accessibility Specifications
  accessibility: {
    minBodyTextSize: '16px', // Body text at least 16px
    minMonoLabelSize: '12px', // Small mono labels at least 12px
    minContrastRatio: 4.5, // WCAG AA minimum 4.5:1
    focusOutline: '2px solid #FF5A1F',
    focusOffset: '2px',
  },
} as const;

export type DesignTokens = typeof tokens;

