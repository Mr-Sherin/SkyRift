import type { Config } from "tailwindcss";
import { tokens } from "./src/styles/tokens";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rift: {
          bg: tokens.colors.bg,
          canvas: tokens.colors.canvas,
          panel: tokens.colors.panel,
          surface: tokens.colors.surface,
          surfaceHover: tokens.colors.surfaceHover,
          line: tokens.colors.border,
          lineDark: tokens.colors.borderHighlight,
          text: tokens.colors.text,
          muted: tokens.colors.textMuted,
          faint: tokens.colors.textFaint,
          orange: tokens.colors.orange,
          orangeHover: tokens.colors.orangeHover,
          orangeMuted: tokens.colors.orangeMuted,
          slate: "#131E3D",
          darkPlate: tokens.colors.darkPlate,
          statusGreen: tokens.colors.status.good,
          statusRed: tokens.colors.status.danger,
          statusAmber: tokens.colors.status.warn,
          statusCyan: tokens.colors.status.info,
        },
      },
      borderRadius: {
        panel: tokens.radii.panel,
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        hud: tokens.shadows.panel,
        "hud-orange": tokens.shadows.orangeGlow,
        "hud-good": tokens.shadows.goodGlow,
        "hud-warn": tokens.shadows.warnGlow,
        "hud-danger": tokens.shadows.dangerGlow,
        "hud-info": tokens.shadows.infoGlow,
      },
    },
  },
  plugins: [],
};
export default config;
