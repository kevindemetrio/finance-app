"use client";

import { useTheme } from "./ThemeProvider";
import { SeasonBackground } from "./SeasonBackground";

export function SeasonWrapper({ children }: { children: React.ReactNode }) {
  const { theme, season } = useTheme();
  const isSeason = theme === "season";

  return (
    <div
      className="relative min-h-screen transition-colors duration-500"
      style={isSeason ? { background: `var(--season-bg)` } : undefined}
    >
      {isSeason && <SeasonBackground season={season} />}
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
