"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "season";

// ─── Season detection ─────────────────────────────────────────────────────────
export type Season = "spring" | "summer" | "autumn" | "winter";

export function getSeason(date = new Date()): Season {
  const m = date.getMonth(); // 0-11
  const d = date.getDate();
  // Astronomical: spring Mar20, summer Jun21, autumn Sep22, winter Dec21
  if (m === 2 && d >= 20 || m === 3 || m === 4 || m === 5 && d < 21) return "spring";
  if (m === 5 && d >= 21 || m === 6 || m === 7 || m === 8 && d < 22) return "summer";
  if (m === 8 && d >= 22 || m === 9 || m === 10 || m === 11 && d < 21) return "autumn";
  return "winter";
}

export const SEASON_CONFIG: Record<Season, {
  bg: string; cardBg: string; cardBorder: string;
  metricBg: string; titleColor: string; accentColor: string;
  rowBorder: string; label: string;
}> = {
  spring: {
    bg: "#e8f5e0", cardBg: "rgba(255,255,255,0.78)", cardBorder: "rgba(45,74,30,0.1)",
    metricBg: "rgba(255,255,255,0.70)", titleColor: "#2d4a1e", accentColor: "#5aaa35",
    rowBorder: "rgba(45,74,30,0.06)", label: "Primavera",
  },
  summer: {
    bg: "#fff8e1", cardBg: "rgba(255,255,255,0.80)", cardBorder: "rgba(180,120,0,0.1)",
    metricBg: "rgba(255,255,255,0.72)", titleColor: "#78350f", accentColor: "#f59e0b",
    rowBorder: "rgba(180,120,0,0.06)", label: "Verano",
  },
  autumn: {
    bg: "#fff7ed", cardBg: "rgba(255,255,255,0.78)", cardBorder: "rgba(150,70,0,0.1)",
    metricBg: "rgba(255,255,255,0.70)", titleColor: "#7c2d12", accentColor: "#ea580c",
    rowBorder: "rgba(150,70,0,0.06)", label: "Otoño",
  },
  winter: {
    bg: "#eff6ff", cardBg: "rgba(255,255,255,0.80)", cardBorder: "rgba(30,60,120,0.1)",
    metricBg: "rgba(255,255,255,0.72)", titleColor: "#1e3a5f", accentColor: "#3b82f6",
    rowBorder: "rgba(30,60,120,0.06)", label: "Invierno",
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  theme: Theme;
  season: Season;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light", season: "spring", toggle: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [season] = useState<Season>(getSeason());

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = stored ?? preferred;
    apply(initial, getSeason());
    setTheme(initial);
  }, []);

  function apply(t: Theme, s: Season) {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    // Set season CSS vars on root for global use
    if (t === "season") {
      const cfg = SEASON_CONFIG[s];
      root.style.setProperty("--season-bg", cfg.bg);
      root.style.setProperty("--season-card-bg", cfg.cardBg);
      root.style.setProperty("--season-card-border", cfg.cardBorder);
      root.style.setProperty("--season-metric-bg", cfg.metricBg);
      root.style.setProperty("--season-title", cfg.titleColor);
      root.style.setProperty("--season-accent", cfg.accentColor);
      root.style.setProperty("--season-row-border", cfg.rowBorder);
      root.setAttribute("data-season", s);
    } else {
      root.removeAttribute("data-season");
      root.style.removeProperty("--season-bg");
    }
  }

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : prev === "dark" ? "season" : "light";
      localStorage.setItem("theme", next);
      apply(next, getSeason());
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, season, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Toggle button ────────────────────────────────────────────────────────────
export function ThemeToggle() {
  const { theme, season, toggle } = useTheme();

  const label =
    theme === "light" ? "Cambiar a oscuro" :
    theme === "dark"  ? "Cambiar a temporada" :
    "Cambiar a claro";

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
      style={
        theme === "season"
          ? { color: SEASON_CONFIG[season].accentColor }
          : { color: undefined }
      }
      aria-label={label}
      title={label}
    >
      {theme === "dark"   ? <SunIcon /> :
       theme === "season" ? <SeasonIcon season={season} /> :
       <MoonIcon />}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SeasonIcon({ season }: { season: Season }) {
  if (season === "spring") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22V12" />
      <path d="M12 12C12 7 8 3 3 3c0 5 4 9 9 9z" />
      <path d="M12 12c0-5 4-9 9-9-1 5-5 9-9 9z" />
    </svg>
  );
  if (season === "summer") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
  if (season === "autumn") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
  // winter
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 7l-5 5-5-5" />
      <path d="M17 17l-5-5-5 5" />
      <path d="M2 12h20" />
      <path d="M7 7l-5 5 5 5" />
      <path d="M17 7l5 5-5 5" />
    </svg>
  );
}
