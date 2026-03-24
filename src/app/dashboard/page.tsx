"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAnnualData, loadCategoryData, fmtEur } from "../lib/data";
import { createClient } from "../lib/supabase/client";
import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { ThemeToggle } from "../components/ThemeProvider";
import { SettingsPanel } from "../components/SettingsPanel";
import { useUserSettings } from "../lib/userSettings";

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const CAT_COLORS = ['#E24B4A','#BA7517','#378ADD','#1D9E75','#7F77DD','#D85A30','#D4537E','#639922','#888780'];

type ChartType = "annual" | "cats" | "monthly";

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [chart, setChart]   = useState<ChartType>("annual");
  const [annual, setAnnual] = useState<Awaited<ReturnType<typeof loadAnnualData>>>([]);
  const [catData, setCatData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { settings, update: updateSettings } = useUserSettings();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadAnnualData(year), loadCategoryData(year, month)])
      .then(([a, c]) => { setAnnual(a); setCatData(c); setLoading(false); });
  }, [year, month]);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/auth/login"); router.refresh();
  }

  const maxBalance = Math.max(...annual.map(m => Math.abs(m.balance)), 1);
  const maxIncome  = Math.max(...annual.map(m => m.income), 1);
  const catEntries = Object.entries(catData).sort((a, b) => b[1] - a[1]);
  const catTotal   = catEntries.reduce((a, [,v]) => a + v, 0);

  return (
    <SeasonWrapper>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Dashboard</h1>
          <div className="flex items-center gap-2">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="input-base text-sm py-1.5 w-24">
              {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
            </select>
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
                  onLogout={handleLogout}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Chart selector */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Mostrar:</span>
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
            {([["annual","Balance anual"],["monthly","Ingresos vs gastos"],["cats","Por categoría"]] as [ChartType, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setChart(id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${chart===id ? "bg-white dark:bg-neutral-900 font-medium" : "text-neutral-500 dark:text-neutral-400"}`}>
                {label}
              </button>
            ))}
          </div>
          {chart === "cats" && (
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input-base text-sm py-1.5">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="card h-64 animate-pulse bg-neutral-100 dark:bg-neutral-800" />
        ) : (
          <div className="card p-5">
            {/* Annual balance bars */}
            {chart === "annual" && (
              <>
                <p className="text-sm font-medium mb-4">Balance mensual {year}</p>
                <div className="flex items-end gap-1.5 h-36 mb-4">
                  {annual.map((m) => {
                    const h = m.income > 0 ? Math.max(Math.round((Math.abs(m.balance) / maxBalance) * 120), 4) : 4;
                    const color = m.income === 0 ? "bg-neutral-200 dark:bg-neutral-700" : m.balance >= 0 ? "bg-brand-green" : "bg-brand-red";
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        {m.income > 0 && <span className="text-[9px] text-neutral-400">{Math.round(m.balance)}€</span>}
                        <div className={`w-full rounded-t-sm ${color}`} style={{ height: h }} />
                        <span className="text-[9px] text-neutral-400">{MONTHS[m.month]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {annual.map((m) => (
                    <div key={m.month} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-neutral-400 mb-1">{MONTHS[m.month]}</p>
                      <p className={`text-[11px] font-medium ${m.income===0 ? "text-neutral-400" : m.balance>=0 ? "text-brand-green" : "text-brand-red"}`}>
                        {m.income > 0 ? fmtEur(m.balance) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Income vs expenses */}
            {chart === "monthly" && (
              <>
                <p className="text-sm font-medium mb-4">Ingresos vs gastos {year}</p>
                <div className="flex items-end gap-1.5 h-36 mb-3">
                  {annual.map((m) => {
                    const hi = m.income > 0 ? Math.max(Math.round((m.income / maxIncome) * 120), 4) : 4;
                    const hg = m.income > 0 ? Math.max(Math.round(((m.fixed + m.variable) / maxIncome) * 120), 4) : 4;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex gap-0.5 items-end">
                          <div className="w-3 rounded-t-sm bg-brand-green" style={{ height: hi }} />
                          <div className="w-3 rounded-t-sm bg-brand-red" style={{ height: hg }} />
                        </div>
                        <span className="text-[9px] text-neutral-400">{MONTHS[m.month]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs text-neutral-500"><div className="w-3 h-2.5 rounded-sm bg-brand-green" /> Ingresos</div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500"><div className="w-3 h-2.5 rounded-sm bg-brand-red" /> Gastos</div>
                </div>
              </>
            )}

            {/* Category donut */}
            {chart === "cats" && (
              <>
                <p className="text-sm font-medium mb-4">Gastos por categoría — {MONTHS[month]} {year}</p>
                {catTotal === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-8">Sin gastos variables este mes</p>
                ) : (
                  <div className="flex items-center gap-8">
                    <svg width={120} height={120} viewBox="0 0 120 120">
                      {catEntries.reduce((acc, [,v], i) => {
                        const pct = v / catTotal;
                        const len = pct * 251;
                        const el = <circle key={i} cx={60} cy={60} r={40} fill="none"
                          stroke={CAT_COLORS[i % CAT_COLORS.length]}
                          strokeWidth={20} strokeDasharray={`${len} ${251-len}`}
                          strokeDashoffset={-acc.offset} />;
                        return { offset: acc.offset + len, els: [...acc.els, el] };
                      }, { offset: 0, els: [] as React.ReactElement[] }).els}
                      <text x={60} y={60} textAnchor="middle" dominantBaseline="middle"
                        className="text-[11px] font-medium fill-neutral-900 dark:fill-neutral-100">
                        {fmtEur(catTotal)}
                      </text>
                    </svg>
                    <div className="flex-1 space-y-2">
                      {catEntries.map(([cat, val], i) => (
                        <div key={cat} className="flex items-center gap-2 text-sm">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                          <span className="flex-1 text-neutral-600 dark:text-neutral-400 truncate">{cat}</span>
                          <span className="font-medium">{fmtEur(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </SeasonWrapper>
  );
}

function GearIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
