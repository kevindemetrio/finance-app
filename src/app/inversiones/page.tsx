"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { usePlan } from "../hooks/usePlan";

const DEFAULT_CAT_ORDER: InvestmentCategory[] = ["emergency", "variable", "fixed", "stock"];
const INV_ORDER_KEY = "finanzas_inv_order";

const CAT_HEX: Record<InvestmentCategory, string> = {
  emergency: "#378ADD",
  variable:  "#1D9E75",
  fixed:     "#BA7517",
  stock:     "#E24B4A",
};


export default function InversionesPage() {
  const router = useRouter();
  const { canUseInvestments, loading: planLoading } = usePlan();

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
    if (planLoading || !canUseInvestments) return;
    load();
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
    const saved = localStorage.getItem(INV_ORDER_KEY);
    if (saved) { try { setCatOrder(JSON.parse(saved)); } catch {} }
  }, [load, planLoading, canUseInvestments]);

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

  // Wait for plan to load before showing upsell to avoid flash
  if (planLoading) {
    return (
      <SeasonWrapper>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
          <div className="flex items-center justify-between mb-6">
            <DesktopTabs />
            <h1 className="text-lg font-medium lg:hidden">Inversiones</h1>
            <ThemeToggle />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        </div>
      </SeasonWrapper>
    );
  }

  // Upsell screen for non-Pro users
  if (!canUseInvestments) {
    return (
      <SeasonWrapper>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
          <div className="flex items-center justify-between mb-6">
            <DesktopTabs />
            <h1 className="text-lg font-medium lg:hidden">Inversiones</h1>
            <ThemeToggle />
          </div>
          <div className="card flex flex-col items-center gap-5 px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
              <ChartIcon />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                Inversiones es una función Pro
              </h2>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 max-w-xs">
                Registra tu cartera, sigue tus aportaciones y visualiza tu patrimonio total.
              </p>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="mt-1 text-sm font-semibold px-5 py-2.5 rounded-xl bg-brand-blue text-white hover:bg-blue-600 transition-colors"
            >
              Ver planes
            </button>
          </div>
        </div>
      </SeasonWrapper>
    );
  }

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
                  hideFinanceSettings
                  pageOrder={{
                    title: "Orden de categorías",
                    items: catOrder.map(cat => ({ id: cat, label: CATEGORY_LABELS[cat], color: CAT_HEX[cat] })),
                    onMove: (id, dir) => moveCat(id as InvestmentCategory, dir),
                  }}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Summary cards + reorder */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
          {catOrder.map((cat) => {
            const total = grouped[cat].reduce((a, inv) => a + totalContributions(inv), 0);
            const colors = CATEGORY_COLORS[cat];
            const borderColor = cat === "emergency" ? "#378ADD" : cat === "variable" ? "#1D9E75" : cat === "fixed" ? "#BA7517" : "#E24B4A";
            return (
              <div key={cat} className="metric-card relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                  style={{ backgroundColor: borderColor }}
                />
                <div className="pl-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {CATEGORY_LABELS[cat]}
                    </p>
                  </div>
                  <p className={`text-base font-medium ${colors.text}`}>{fmtEur(total)}</p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {grouped[cat].length} posición{grouped[cat].length !== 1 ? "es" : ""}
                  </p>
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
function ChartIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
}
