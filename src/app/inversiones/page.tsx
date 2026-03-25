"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Investment, InvestmentCategory, CATEGORY_COLORS, CATEGORY_LABELS,
  groupByCategory, loadInvestments, totalContributions,
} from "../lib/investments";
import { fmtEur } from "../lib/data";
import { createClient } from "../lib/supabase/client";
import { CategorySection } from "../components/inversiones/CategorySection";
import { ThemeToggle, useTheme, SEASON_CONFIG } from "../components/ThemeProvider";
import { DesktopTabs, Navbar } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { SettingsPanel } from "../components/SettingsPanel";
import { useUserSettings } from "../lib/userSettings";

const DEFAULT_CAT_ORDER: InvestmentCategory[] = ["emergency", "variable", "fixed", "stock"];
const INV_ORDER_KEY = "investment_cat_order";

// Color accent per investment category (left border)
const ACCENT_STYLE: Record<InvestmentCategory, string> = {
  emergency: "border-l-brand-green",
  variable:  "border-l-brand-blue",
  fixed:     "border-l-brand-amber",
  stock:     "border-l-[#7F77DD]",
};

export default function InversionesPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [catOrder, setCatOrder] = useState<InvestmentCategory[]>(DEFAULT_CAT_ORDER);
  const { settings, update: updateSettings } = useUserSettings();
  const fetchId = useRef(0);

  const load = useCallback(async () => {
    const id = ++fetchId.current;
    setLoading(true);
    setError("");
    try {
      const data = await loadInvestments();
      if (id !== fetchId.current) return;
      setInvestments(data);
    } catch (e) {
      console.error(e);
      setError("Error cargando inversiones.");
    } finally {
      if (id === fetchId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
    const saved = localStorage.getItem(INV_ORDER_KEY);
    if (saved) { try { setCatOrder(JSON.parse(saved)); } catch {} }
  }, [load]);

  function moveCat(cat: InvestmentCategory, dir: -1 | 1) {
    setCatOrder(prev => {
      const order = [...prev];
      const i = order.indexOf(cat);
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      try { localStorage.setItem(INV_ORDER_KEY, JSON.stringify(order)); } catch {}
      return order;
    });
  }

  const { theme, season } = useTheme();
  const isSeason = theme === "season";
  const seasonCfg = isSeason ? SEASON_CONFIG[season] : null;

  const grouped = groupByCategory(investments);
  const grandTotal = investments.reduce((a, inv) => a + totalContributions(inv), 0);

  return (
    <SeasonWrapper>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Inversiones</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="relative" onMouseDown={e => e.stopPropagation()}>
              <button
                onClick={() => setShowSettings(v => !v)}
                title="Ajustes"
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors
                  ${showSettings
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                <GearIcon />
              </button>
              {showSettings && (
                <SettingsPanel
                  userEmail={userEmail}
                  settings={settings}
                  onUpdate={updateSettings}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Summary cards + reorder */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
          {catOrder.map((cat, i) => {
            const total = grouped[cat].reduce((a, inv) => a + totalContributions(inv), 0);
            const colors = CATEGORY_COLORS[cat];
            return (
              <div key={cat} className={`metric-card border-l-[3px] ${ACCENT_STYLE[cat]} relative group`}>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5 font-bold truncate">
                  {CATEGORY_LABELS[cat]}
                </p>
                <p className={`text-base font-bold ${colors.text}`}>{fmtEur(total)}</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {grouped[cat].length} posición{grouped[cat].length !== 1 ? "es" : ""}
                </p>
                <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveCat(cat, -1)} disabled={i === 0}
                    className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all"
                    title="Mover izquierda / arriba">
                    <TinyChevLeftIcon />
                  </button>
                  <button onClick={() => moveCat(cat, 1)} disabled={i === catOrder.length - 1}
                    className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all"
                    title="Mover derecha / abajo">
                    <TinyChevRightIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand total */}
        <div
          className="card flex items-center justify-between px-4 py-3 mb-5"
          style={seasonCfg ? { background: seasonCfg.metricBg, borderColor: seasonCfg.cardBorder } : undefined}
        >
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
            style={{ color: seasonCfg ? seasonCfg.titleColor : undefined }}>
            Total invertido
          </span>
          <span className="text-lg font-bold" style={{ color: seasonCfg ? seasonCfg.accentColor : undefined }}>{fmtEur(grandTotal)}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-brand-red-light dark:bg-red-950 text-brand-red dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Category sections */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {catOrder.map((cat) => (
              <CategorySection
                key={cat}
                category={cat}
                investments={grouped[cat]}
                onChange={load}
              />
            ))}
          </div>
        )}
      </div>
    </SeasonWrapper>
  );
}

function GearIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function TinyChevLeftIcon() {
  return <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>;
}
function TinyChevRightIcon() {
  return <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>;
}
