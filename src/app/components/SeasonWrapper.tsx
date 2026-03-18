"use client";

import { useTheme } from "./ThemeProvider";
import { SeasonBackground } from "./SeasonBackground";

export function SeasonWrapper({ children }: { children: React.ReactNode }) {
  const { theme, season } = useTheme();

  return (
    <div
      className="relative min-h-screen transition-colors duration-500"
      style={theme === "season" ? { background: "var(--season-bg, #f0faf0)" } : undefined}
    >
      {theme === "season" && <SeasonBackground season={season} />}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
