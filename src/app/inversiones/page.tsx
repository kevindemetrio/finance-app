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
import { ThemeToggle } from "../components/ThemeProvider";
import { DesktopTabs, Navbar } from "../components/Navbar";

const CATEGORIES: InvestmentCategory[] = ["emergency", "variable", "fixed", "stock"];

export default function InversionesPage() {
  const router = useRouter();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  useEffect(() => { load(); }, [load]);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const grouped = groupByCategory(investments);
  const grandTotal = investments.reduce((a, inv) => a + totalContributions(inv), 0);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Inversiones</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700
                dark:hover:text-neutral-200 transition-colors"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
          {CATEGORIES.map((cat) => {
            const total = grouped[cat].reduce((a, inv) => a + totalContributions(inv), 0);
            const colors = CATEGORY_COLORS[cat];
            return (
              <div key={cat} className="metric-card">
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
            );
          })}
        </div>

        {/* Grand total */}
        <div className="flex items-center justify-between px-4 py-3 mb-5
          bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Total invertido</span>
          <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{fmtEur(grandTotal)}</span>
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
            {CATEGORIES.map((cat) => (
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
    </main>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
