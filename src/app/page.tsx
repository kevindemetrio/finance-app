"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Entry, MonthData, CategoryBudget, getAllTimeSavings, getCarryover,
  loadMonth, saveEntry, deleteEntry, saveMonthConfig,
  searchEntries, importTemplates, loadCategoryBudgets, uid,
} from "./lib/data";
import { createClient } from "./lib/supabase/client";
import { SummaryGrid } from "./components/SummaryGrid";
import { Section } from "./components/Section";
import { AddEntryModal } from "./components/AddEntryModal";
import { MonthPicker } from "./components/MonthPicker";
import { ThemeToggle, useTheme, SEASON_CONFIG } from "./components/ThemeProvider";
import { Navbar, DesktopTabs } from "./components/Navbar";
import { CategoryBadge } from "./components/EntryRow";
import { TemplateManager } from "./components/TemplateManager";
import { SeasonWrapper } from "./components/SeasonWrapper";
import { CategoryBudgetPanel } from "./components/CategoryBudgetPanel";
import { toast, confirm as confirmDialog } from "./components/Toast";
import { PdfReportButton } from "./components/PdfReportButton";
import { SettingsPanel } from "./components/SettingsPanel";
import { AppTour } from "./components/AppTour";
import { useUserSettings, SectionKey } from "./lib/userSettings";

function emptyMonth(): MonthData {
  return { incomes:[], fixedExpenses:[], varExpenses:[], savingsEntries:[], varBudget:0, carryover:0 };
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function HomePage() {
  const { theme, season } = useTheme();
  const isSeason = theme === "season";
  const today = new Date();
  const [year, setYear]              = useState(today.getFullYear());
  const [month, setMonth]            = useState(today.getMonth());

  // Restore last viewed month on mount
  useEffect(() => {
    try {
      const y = localStorage.getItem("last_month_year");
      const m = localStorage.getItem("last_month_month");
      if (y && m) { setYear(Number(y)); setMonth(Number(m)); }
    } catch {}
  }, []);
  const [data, setData]              = useState<MonthData>(emptyMonth());
  const [totalSavings, setSavings]   = useState(0);
  const [catBudgets, setCatBudgets]   = useState<CategoryBudget[]>([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState("");
  const [userEmail, setUserEmail]    = useState("");
  const [search, setSearch]          = useState("");
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchEntries>>>([]);
  const [searching, setSearching]    = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [importing, setImporting]    = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWithdrawSaving, setShowWithdrawSaving] = useState(false);
  const [sectionColors, setSectionColors] = useState<Record<string, string>>({});
  const { settings, update: updateSettings } = useUserSettings();
  const fetchId = useRef(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    function loadColors() {
      const keys = ["incomes", "savings", "fixedExpenses", "varExpenses"];
      const colors: Record<string, string> = {};
      for (const k of keys) {
        const c = localStorage.getItem(`section_color_${k}`);
        if (c) colors[k] = c;
      }
      setSectionColors(colors);
    }
    loadColors();
    window.addEventListener("section-colors-updated", loadColors);
    return () => window.removeEventListener("section-colors-updated", loadColors);
  }, []);

  useEffect(() => {
    const id = ++fetchId.current;
    setLoading(true); setError("");
    Promise.all([loadMonth(year, month), getCarryover(year, month), getAllTimeSavings(year, month), loadCategoryBudgets(year, month)])
      .then(([monthData, carryover, savings, catBdgs]) => {
        if (id !== fetchId.current) return;
        monthData.carryover = carryover;
        setData(monthData); setSavings(savings); setCatBudgets(catBdgs); setLoading(false);
      })
      .catch(() => {
        if (id === fetchId.current) { setError("Error cargando datos."); setLoading(false); }
      });
  }, [year, month]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!search.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const res = await searchEntries(search);
      setSearchResults(res);
      setSearching(false);
    }, 300);
  }, [search]);

  async function handleImportTemplate() {
    if (importing) return;
    setImporting(true);
   
    const newEntries = await importTemplates(year, month);
    if (newEntries.length > 0) {
      setData(d => ({ ...d, fixedExpenses: [...d.fixedExpenses, ...newEntries] }));
      toast(`+${newEntries.length} importados`);
    } else {
      toast("Ya están todos", "info");
    }
    setImporting(false);
  }

  const addEntryToSection = useCallback(async (
    entry: Entry, type: "income"|"fixed"|"variable"|"saving",
    section: keyof Pick<MonthData,"incomes"|"fixedExpenses"|"varExpenses"|"savingsEntries">
  ) => {
    const newEntry = { ...entry, id: entry.id || uid() };
    await saveEntry(newEntry, type, year, month);
    setData(d => ({ ...d, [section]: [...d[section], newEntry] }));
    if (type === "saving") getAllTimeSavings(year, month).then(setSavings);
    toast("Movimiento añadido");
  }, [year, month]);

  const updateEntryInSection = useCallback(async (
    idx: number, updated: Entry, type: "income"|"fixed"|"variable"|"saving",
    section: keyof Pick<MonthData,"incomes"|"fixedExpenses"|"varExpenses"|"savingsEntries">
  ) => {
    await saveEntry(updated, type, year, month);
    setData(d => { const arr = [...d[section]] as Entry[]; arr[idx] = updated; return { ...d, [section]: arr }; });
    if (type === "saving") getAllTimeSavings(year, month).then(setSavings);
  }, [year, month]);

  const deleteEntryFromSection = useCallback(async (
    idx: number, type: string,
    section: keyof Pick<MonthData,"incomes"|"fixedExpenses"|"varExpenses"|"savingsEntries">
  ) => {
    const entry = (data[section] as Entry[])[idx];
    const ok = await confirmDialog({ title: `¿Eliminar "${entry.name}"?`, danger: true });
    if (!ok) return;
    await deleteEntry(entry.id);
    setData(d => ({ ...d, [section]: (d[section] as Entry[]).filter((_,i) => i !== idx) }));
    if (type === "saving") getAllTimeSavings(year, month).then(setSavings);
    toast("Movimiento eliminado", "info");
  }, [data, year, month]);

  const addIncome    = (e: Entry) => addEntryToSection(e, "income", "incomes");
  const updateIncome = (i: number, e: Entry) => updateEntryInSection(i, e, "income", "incomes");
  const deleteIncome = (i: number) => deleteEntryFromSection(i, "income", "incomes");
  const addFixed     = (e: Entry) => addEntryToSection({...e, paid: e.paid ?? false}, "fixed", "fixedExpenses");
  const updateFixed  = (i: number, e: Entry) => updateEntryInSection(i, e, "fixed", "fixedExpenses");
  const deleteFixed  = (i: number) => deleteEntryFromSection(i, "fixed", "fixedExpenses");
  const addVar       = (e: Entry) => addEntryToSection(e, "variable", "varExpenses");
  const updateVar    = (i: number, e: Entry) => updateEntryInSection(i, e, "variable", "varExpenses");
  const deleteVar    = (i: number) => deleteEntryFromSection(i, "variable", "varExpenses");
  const addSaving    = (e: Entry) => addEntryToSection(e, "saving", "savingsEntries");
  const updateSaving = (i: number, e: Entry) => updateEntryInSection(i, e, "saving", "savingsEntries");
  const deleteSaving = (i: number) => deleteEntryFromSection(i, "saving", "savingsEntries");
  const handleBudget = async (v: number) => { await saveMonthConfig(year, month, v); setData(d => ({...d, varBudget:v})); };

  function saveMonth(y: number, m: number) {
    try { localStorage.setItem("last_month_year", String(y)); localStorage.setItem("last_month_month", String(m)); } catch {}
  }
  function prevMonth() {
    const y = month === 0 ? year - 1 : year;
    const m = month === 0 ? 11 : month - 1;
    setYear(y); setMonth(m); saveMonth(y, m);
  }
  function nextMonth() {
    const y = month === 11 ? year + 1 : year;
    const m = month === 11 ? 0 : month + 1;
    setYear(y); setMonth(m); saveMonth(y, m);
  }

  const varTotal = data.varExpenses.reduce((a,i) => a+i.amount, 0);
  const TYPE_LABEL: Record<string,string> = { income:"Ingreso", fixed:"Fijo", variable:"Variable", saving:"Ahorro" };
  const TYPE_COLOR: Record<string,string> = { income:"text-brand-green", fixed:"text-brand-amber", variable:"text-brand-red", saving:"text-brand-blue" };

  // Savings withdraw button in body header
  const savingsBodyHeader = (
    <button
      onClick={() => setShowWithdrawSaving(true)}
      className="flex items-center gap-1.5 text-xs text-brand-red
        border border-brand-red rounded-lg px-2.5 py-1.5
        hover:bg-brand-red-light dark:hover:bg-red-950 transition-colors"
    >
      <WithdrawIcon /> Retirar
    </button>
  );

  // Template controls shown inside fixed expenses body
  const fixedBodyHeader = (
    <>
      <button
        onClick={() => setShowTemplate(true)}
        className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400
          border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 transition-colors
          hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-neutral-400"
      >
        <GridIcon /> Plantilla
      </button>
      <button
        onClick={handleImportTemplate}
        disabled={importing}
        className="flex items-center gap-1.5 text-xs text-brand-amber
          border border-brand-amber rounded-lg px-2.5 py-1.5
          hover:bg-brand-amber-light dark:hover:bg-amber-950 transition-colors disabled:opacity-50"
      >
        <ImportIcon />
        {importing ? "..." : "Importar plantilla"}
      </button>
    </>
  );

  return (
    <SeasonWrapper>
      <AppTour />
      <Navbar />

      {showTemplate && <TemplateManager onClose={() => setShowTemplate(false)} />}
      {showWithdrawSaving && (
        <AddEntryModal
          title="Retirar ahorro"
          onAdd={e => { addSaving({ ...e, amount: -Math.abs(e.amount) }); setShowWithdrawSaving(false); }}
          onClose={() => setShowWithdrawSaving(false)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xl leading-none">‹</button>
            <MonthPicker year={year} month={month} onChange={(y,m) => { setYear(y); setMonth(m); saveMonth(y, m); }} />
            <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xl leading-none">›</button>
          </div>
          <div className="flex items-center gap-1 pl-2 border-l border-neutral-200 dark:border-neutral-700 ml-1">
            <PdfReportButton year={year} month={month} data={data} totalSavings={totalSavings} categoryBudgets={catBudgets} carryover={data.carryover ?? 0} />
            <ThemeToggle />
            {/* stopPropagation on mousedown so SettingsPanel's outside-click handler doesn't fire when clicking this button */}
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
                  onOpenTemplate={() => setShowTemplate(true)}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 px-4 py-3 rounded-xl bg-brand-red-light dark:bg-red-950 text-brand-red text-sm">{error}</div>}

        {/* Search */}
        <div className="relative mb-4">
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-colors ${!isSeason ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" : ""}`}
            style={isSeason ? {
              background: SEASON_CONFIG[season].metricBg,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderColor: SEASON_CONFIG[season].cardBorder,
            } : undefined}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400 shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar movimientos o categorías..."
              style={isSeason ? { color: SEASON_CONFIG[season].titleColor } : undefined}
              className="flex-1 text-sm bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400" />
            {search && <button onClick={() => { setSearch(""); setSearchResults([]); }} className="text-neutral-400 hover:text-neutral-600 text-lg leading-none">×</button>}
          </div>
          {search && (
            <div
              className={`absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 ${!isSeason ? "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg" : ""}`}
              style={isSeason ? {
                background: SEASON_CONFIG[season].cardBg,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: `0.5px solid ${SEASON_CONFIG[season].cardBorder}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              } : undefined}
            >
              {searching ? (
                <p className="px-4 py-3 text-sm text-neutral-400">Buscando...</p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-neutral-400">Sin resultados para &quot;{search}&quot;</p>
              ) : searchResults.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="text-neutral-900 dark:text-neutral-100 truncate block">{r.name}</span>
                    <span className="text-xs text-neutral-400">{MONTH_NAMES[r.month]} {r.year} · {TYPE_LABEL[r.type]}</span>
                  </div>
                  {r.category && <CategoryBadge cat={r.category} />}
                  <span className={`font-medium shrink-0 ${TYPE_COLOR[r.type]}`}>
                    {r.type==="income"||r.type==="saving" ? "+" : "−"}{r.amount.toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})} €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {/* Metrics skeleton — 2 cols mobile, 3 cols sm */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="metric-card">
                  <div className="h-2.5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
                  <div className="h-5 w-24 bg-neutral-300 dark:bg-neutral-600 rounded" />
                </div>
              ))}
            </div>
            {/* Section skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { rows: 2 }, { rows: 3 }, { rows: 4 }, { rows: 3 },
              ].map((s, i) => (
                <div key={i} className="card overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                      <div className="h-3.5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    </div>
                    <div className="h-3.5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  </div>
                  {/* Row skeletons */}
                  {[...Array(s.rows)].map((_,j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <div className="flex-1 space-y-1.5">
                        <div className={`h-3 bg-neutral-200 dark:bg-neutral-700 rounded ${j % 2 === 0 ? "w-3/4" : "w-1/2"}`} />
                      </div>
                      <div className="h-3 w-10 bg-neutral-200 dark:bg-neutral-700 rounded shrink-0" />
                      <div className="h-3 w-16 bg-neutral-300 dark:bg-neutral-600 rounded shrink-0" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <SummaryGrid data={data} totalSavings={totalSavings} isPastMonth={year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth())} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {settings.sectionOrder.map((key: SectionKey) => {
                const prefs = settings.sectionPrefs[key];
                const common = {
                  showDate: prefs.showDate, showNotes: prefs.showNotes, showName: prefs.showName,
                };
                if (key === "incomes") return (
                  <Section key="incomes" title="Ingresos" dotColor="bg-brand-green" totalColor="text-brand-green" sign="+"
                    entries={data.incomes} storageKey="incomes" tourId="income-section"
                    accentHex={sectionColors["incomes"]}
                    showCategory={prefs.showCategory} showPaid={false} {...common}
                    onAdd={addIncome} onUpdate={updateIncome} onDelete={deleteIncome} />
                );
                if (key === "savings") return (
                  <Section key="savings" title="Ahorros" dotColor="bg-brand-blue" totalColor="text-brand-blue" sign="+"
                    entries={data.savingsEntries} storageKey="savings"
                    accentHex={sectionColors["savings"]}
                    showCategory={prefs.showCategory} showPaid={false} {...common}
                    bodyHeader={savingsBodyHeader}
                    onAdd={addSaving} onUpdate={updateSaving} onDelete={deleteSaving} />
                );
                if (key === "fixedExpenses") return (
                  <Section key="fixedExpenses" title="Gastos fijos" dotColor="bg-brand-amber" totalColor="text-brand-amber" sign="−"
                    entries={data.fixedExpenses} storageKey="fixed" tourId="fixed-section"
                    accentHex={sectionColors["fixedExpenses"]}
                    showPaid={prefs.showPaid} showCategory={prefs.showCategory} {...common}
                    bodyHeader={fixedBodyHeader}
                    onAdd={addFixed} onUpdate={updateFixed} onDelete={deleteFixed} />
                );
                return (
                  <Section key="varExpenses" title="Gastos variables" dotColor="bg-brand-red" totalColor="text-brand-red" sign="−"
                    entries={data.varExpenses} storageKey="variable" tourId="var-section"
                    accentHex={sectionColors["varExpenses"]}
                    showCategory={prefs.showCategory} showPaid={prefs.showPaid} {...common}
                    onAdd={addVar} onUpdate={updateVar} onDelete={deleteVar} />
                );
              })}
            </div>
            <CategoryBudgetPanel year={year} month={month} varExpenses={data.varExpenses} budgets={catBudgets} varBudget={data.varBudget ?? 0} onChange={setCatBudgets} onVarBudgetChange={handleBudget} />
          </>
        )}
      </div>
    </SeasonWrapper>
  );
}

function WithdrawIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
}
function GearIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function GridIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function ImportIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="21" x2="12" y2="3"/></svg>;
}
