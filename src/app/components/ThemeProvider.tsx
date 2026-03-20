"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark" | "season";

// Extended season — halloween & christmas are sub-seasons with their own look
export type Season = "spring" | "summer" | "autumn" | "halloween" | "winter" | "christmas";

export function getSeason(date = new Date()): Season {
  const m = date.getMonth(); // 0-11
  const d = date.getDate();

  // Spring: Mar 20 – Jun 20
  if ((m === 2 && d >= 20) || m === 3 || m === 4 || (m === 5 && d < 21)) return "spring";
  // Summer: Jun 21 – Sep 21
  if ((m === 5 && d >= 21) || m === 6 || m === 7 || (m === 8 && d < 22)) return "summer";

  // Autumn with Halloween: Oct 1 – Nov 7
  if (m === 9 || (m === 10 && d <= 7)) return "halloween";
  // Standard autumn: Sep 22 – Sep 30 and Nov 8 – Nov 30
  if ((m === 8 && d >= 22) || (m === 10 && d > 7)) return "autumn";

  // Christmas: Dec 1 – Jan 7
  if (m === 11 || (m === 0 && d <= 7)) return "christmas";
  // Standard winter: Jan 8 – Mar 19
  return "winter";
}

export const SEASON_CONFIG: Record<Season, {
  bg: string; cardBg: string; cardBorder: string;
  metricBg: string; titleColor: string; accentColor: string;
  rowBorder: string; label: string;
  navBg: string; navBorder: string;
}> = {
  spring: {
    bg: "#e8f5e0",
    cardBg: "rgba(255,255,255,0.88)", cardBorder: "rgba(45,100,20,0.12)",
    metricBg: "rgba(255,255,255,0.80)", titleColor: "#1a3a0e", accentColor: "#4a9a28",
    rowBorder: "rgba(45,100,20,0.08)", label: "Primavera",
    navBg: "rgba(240,250,230,0.92)", navBorder: "rgba(100,160,60,0.2)",
  },
  summer: {
    bg: "#e0f7fa",
    cardBg: "rgba(255,255,255,0.88)", cardBorder: "rgba(0,100,120,0.12)",
    metricBg: "rgba(255,255,255,0.80)", titleColor: "#006064", accentColor: "#0097a7",
    rowBorder: "rgba(0,100,120,0.08)", label: "Verano",
    navBg: "rgba(225,248,252,0.92)", navBorder: "rgba(0,150,170,0.2)",
  },
  // Standard autumn: warm orange tones, light background
  autumn: {
    bg: "#fff7ed",
    cardBg: "rgba(255,255,255,0.86)", cardBorder: "rgba(150,70,0,0.12)",
    metricBg: "rgba(255,255,255,0.78)", titleColor: "#7c2d12", accentColor: "#ea580c",
    rowBorder: "rgba(150,70,0,0.08)", label: "Otoño",
    navBg: "rgba(255,247,237,0.92)", navBorder: "rgba(180,80,0,0.2)",
  },
  // Halloween: dark spooky
  halloween: {
    bg: "#1a0a00",
    cardBg: "rgba(30,12,0,0.82)", cardBorder: "rgba(255,150,0,0.18)",
    metricBg: "rgba(25,10,0,0.75)", titleColor: "#ffcc80", accentColor: "#ff8f00",
    rowBorder: "rgba(255,150,0,0.12)", label: "Halloween",
    navBg: "rgba(20,8,0,0.92)", navBorder: "rgba(200,100,0,0.3)",
  },
  // Standard winter: cold blue tones, light background
  winter: {
    bg: "#eff6ff",
    cardBg: "rgba(255,255,255,0.88)", cardBorder: "rgba(30,60,120,0.12)",
    metricBg: "rgba(255,255,255,0.80)", titleColor: "#1e3a5f", accentColor: "#3b82f6",
    rowBorder: "rgba(30,60,120,0.08)", label: "Invierno",
    navBg: "rgba(239,246,255,0.92)", navBorder: "rgba(60,120,220,0.2)",
  },
  // Christmas: dark festive
  christmas: {
    bg: "#050e1f",
    cardBg: "rgba(10,22,45,0.85)", cardBorder: "rgba(100,181,246,0.18)",
    metricBg: "rgba(8,18,38,0.80)", titleColor: "#e3f2fd", accentColor: "#64b5f6",
    rowBorder: "rgba(100,181,246,0.12)", label: "Navidad",
    navBg: "rgba(5,12,28,0.92)", navBorder: "rgba(80,150,220,0.25)",
  },
};

// Dark seasons (need dark class on html)
const DARK_SEASONS: Season[] = ["halloween", "christmas"];

interface ThemeContextValue { theme: Theme; season: Season; toggle: () => void; forceSeason: (s: Season) => void; }
const ThemeContext = createContext<ThemeContextValue>({ theme: "light", season: "spring", toggle: () => {}, forceSeason: () => {} });

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
    const isDark = t === "dark" || (t === "season" && DARK_SEASONS.includes(s));
    root.classList.toggle("dark", isDark);

    if (t === "season") {
      const cfg = SEASON_CONFIG[s];
      root.style.setProperty("--season-bg", cfg.bg);
      root.style.setProperty("--season-card-bg", cfg.cardBg);
      root.style.setProperty("--season-card-border", cfg.cardBorder);
      root.style.setProperty("--season-metric-bg", cfg.metricBg);
      root.style.setProperty("--season-title", cfg.titleColor);
      root.style.setProperty("--season-accent", cfg.accentColor);
      root.style.setProperty("--season-row-border", cfg.rowBorder);
      root.style.setProperty("--season-nav-bg", cfg.navBg);
      root.style.setProperty("--season-nav-border", cfg.navBorder);
      root.setAttribute("data-season", s);
    } else {
      root.removeAttribute("data-season");
      root.style.removeProperty("--season-bg");
      root.style.removeProperty("--season-nav-bg");
    }
  }

  function toggle() {
    setForcedSeasonState(null);
    localStorage.removeItem("forcedSeason");
    setTheme(prev => {
      const next: Theme = prev === "light" ? "dark" : prev === "dark" ? "season" : "light";
      localStorage.setItem("theme", next);
      apply(next, getSeason());
      return next;
    });
  }

  // Read forced season from localStorage/DOM on mount
  const [forcedSeason, setForcedSeasonState] = useState<Season | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("forcedSeason") as Season | null;
    if (stored) setForcedSeasonState(stored);
  }, []);

  const activeSeason = forcedSeason || season;

  function forceSeason2(s: Season) {
    setForcedSeasonState(s);
    localStorage.setItem("theme", "season");
    localStorage.setItem("forcedSeason", s);
    setTheme("season");
    apply("season", s);
  }

  return <ThemeContext.Provider value={{ theme, season: activeSeason, toggle, forceSeason: forceSeason2 }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }

const ALL_SEASONS: Season[] = ["spring","summer","autumn","halloween","winter","christmas"];

export function ThemeToggle() {
  const { theme, season, toggle, forceSeason } = useTheme();
  const [showSeasons, setShowSeasons] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSeasons(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleMainClick() {
    if (theme === "season") {
      setShowSeasons(p => !p);
    } else {
      toggle();
    }
  }

  const label =
    theme === "light" ? "Cambiar a oscuro" :
    theme === "dark"  ? "Cambiar a temporada" :
    `Temporada: ${SEASON_CONFIG[season].label}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleMainClick}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors
          text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800
          hover:text-neutral-700 dark:hover:text-neutral-200"
        style={theme === "season" ? { color: SEASON_CONFIG[season].accentColor } : undefined}
        aria-label={label} title={label}
      >
        {theme === "dark"   ? <SunIcon /> :
         theme === "season" ? <SeasonIcon season={season} /> :
         <MoonIcon />}
      </button>

      {/* Season picker dropdown — only in season mode */}
      {showSeasons && (
        <div className="absolute right-0 top-full mt-1 z-50 rounded-2xl border border-neutral-200 dark:border-neutral-700
          bg-white dark:bg-neutral-900 shadow-xl py-1.5 min-w-[160px]">
          {ALL_SEASONS.map(s => (
            <button
              key={s}
              onClick={() => { forceSeason(s); setShowSeasons(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left"
              style={s === season ? { color: SEASON_CONFIG[s].accentColor, fontWeight: 500 } : undefined}
            >
              <span style={{ color: SEASON_CONFIG[s].accentColor }}><SeasonIcon season={s} /></span>
              <span className="text-neutral-700 dark:text-neutral-300">{SEASON_CONFIG[s].label}</span>
              {s === season && <span className="ml-auto text-[10px]" style={{ color: SEASON_CONFIG[s].accentColor }}>✓</span>}
            </button>
          ))}
          <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />
          <button
            onClick={() => { toggle(); setShowSeasons(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-500
              hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <MoonIcon />
            <span>Volver a claro</span>
          </button>
        </div>
      )}
    </div>
  );
}

function SunIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function MoonIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function SeasonIcon({ season }: { season: Season }) {
  if (season === "spring")    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12"/><path d="M12 12C12 7 8 3 3 3c0 5 4 9 9 9z"/><path d="M12 12c0-5 4-9 9-9-1 5-5 9-9 9z"/></svg>;
  if (season === "summer")    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
  if (season === "halloween") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
  if (season === "autumn")    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
  if (season === "christmas") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  // winter
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 7l-5 5-5-5"/><path d="M17 17l-5-5-5 5"/><path d="M2 12h20"/><path d="M7 7l-5 5 5 5"/><path d="M17 7l5 5-5 5"/></svg>;
}
