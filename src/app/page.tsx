"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Entry, MonthData, getAllTimeSavings, getCarryover,
  loadMonth, saveEntry, deleteEntry, saveMonthConfig, uid,
} from "./lib/data";
import { createClient } from "./lib/supabase/client";
import { SummaryGrid } from "./components/SummaryGrid";
import { Section } from "./components/Section";
import { BudgetBar } from "./components/BudgetBar";
import { MonthPicker } from "./components/MonthPicker";
import { ThemeToggle } from "./components/ThemeProvider";
import { Navbar, DesktopTabs } from "./components/Navbar";

function emptyMonth(): MonthData {
  return { incomes: [], fixedExpenses: [], varExpenses: [], savingsEntries: [], varBudget: 0, carryover: 0 };
}

export default function HomePage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear]            = useState(today.getFullYear());
  const [month, setMonth]          = useState(today.getMonth());
  const [data, setData]            = useState<MonthData>(emptyMonth());
  const [totalSavings, setSavings] = useState(0);
  const [loading, setLoading]      = useState(true);
  const [error, setError]          = useState("");
  const [userEmail, setUserEmail]  = useState("");
  const fetchId = useRef(0);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    const id = ++fetchId.current;
    setLoading(true);
    setError("");
    Promise.all([
      loadMonth(year, month),
      getCarryover(year, month),
      getAllTimeSavings(year, month),
    ])
      .then(([monthData, carryover, savings]) => {
        if (id !== fetchId.current) return;
        monthData.carryover = carryover;
        setData(monthData);
        setSavings(savings);
        setLoading(false);
      })
      .catch(() => {
        if (id !== fetchId.current) return;
        setError("Error cargando los datos.");
        setLoading(false);
      });
  }, [year, month]);

  const addEntryToSection = useCallback(async (
    entry: Entry,
    type: "income" | "fixed" | "variable" | "saving",
    section: keyof Pick<MonthData, "incomes" | "fixedExpenses" | "varExpenses" | "savingsEntries">
  ) => {
    const newEntry = { ...entry, id: entry.id || uid() };
    await saveEntry(newEntry, type, year, month);
    setData((d) => ({ ...d, [section]: [...d[section], newEntry] }));
    if (type === "saving") getAllTimeSavings(year, month).then(setSavings);
  }, [year, month]);

  const updateEntryInSection = useCallback(async (
    idx: number, updated: Entry,
    type: "income" | "fixed" | "variable" | "saving",
    section: keyof Pick<MonthData, "incomes" | "fixedExpenses" | "varExpenses" | "savingsEntries">
  ) => {
    await saveEntry(updated, type, year, month);
    setData((d) => { const arr = [...d[section]] as Entry[]; arr[idx] = updated; return { ...d, [section]: arr }; });
    if (type === "saving") getAllTimeSavings(year, month).then(setSavings);
  }, [year, month]);

  const deleteEntryFromSection = useCallback(async (
    idx: number, type: string,
    section: keyof Pick<MonthData, "incomes" | "fixedExpenses" | "varExpenses" | "savingsEntries">
  ) => {
    const entry = (data[section] as Entry[])[idx];
    await deleteEntry(entry.id);
    setData((d) => ({ ...d, [section]: (d[section] as Entry[]).filter((_, i) => i !== idx) }));
    if (type === "saving") getAllTimeSavings(year, month).then(setSavings);
  }, [data, year, month]);

  const addIncome    = (e: Entry) => addEntryToSection(e, "income", "incomes");
  const updateIncome = (i: number, e: Entry) => updateEntryInSection(i, e, "income", "incomes");
  const deleteIncome = (i: number) => deleteEntryFromSection(i, "income", "incomes");

  const addFixed    = (e: Entry) => addEntryToSection({ ...e, paid: false }, "fixed", "fixedExpenses");
  const updateFixed = (i: number, e: Entry) => updateEntryInSection(i, e, "fixed", "fixedExpenses");
  const deleteFixed = (i: number) => deleteEntryFromSection(i, "fixed", "fixedExpenses");

  const addVar    = (e: Entry) => addEntryToSection(e, "variable", "varExpenses");
  const updateVar = (i: number, e: Entry) => updateEntryInSection(i, e, "variable", "varExpenses");
  const deleteVar = (i: number) => deleteEntryFromSection(i, "variable", "varExpenses");

  const addSaving    = (e: Entry) => addEntryToSection(e, "saving", "savingsEntries");
  const updateSaving = (i: number, e: Entry) => updateEntryInSection(i, e, "saving", "savingsEntries");
  const deleteSaving = (i: number) => deleteEntryFromSection(i, "saving", "savingsEntries");

  const handleBudget = async (v: number) => {
    await saveMonthConfig(year, month, v);
    setData((d) => ({ ...d, varBudget: v }));
  };

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  }

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const varTotal = data.varExpenses.reduce((a, i) => a + i.amount, 0);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Desktop: tab switcher left, month nav center-right */}
          <DesktopTabs />

          {/* Month nav — always visible */}
          <div className="flex items-center gap-1">
            <button onClick={prevMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800
                dark:hover:text-neutral-200 transition-colors text-xl leading-none"
            >‹</button>
            <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
            <button onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800
                dark:hover:text-neutral-200 transition-colors text-xl leading-none"
            >›</button>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={handleLogout} title={userEmail}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700
                dark:hover:text-neutral-200 transition-colors"
            ><LogoutIcon /></button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-brand-red-light dark:bg-red-950 text-brand-red dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="metric-card h-16 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card h-40 animate-pulse bg-neutral-100 dark:bg-neutral-800" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <SummaryGrid data={data} totalSavings={totalSavings} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Ingresos" dotColor="bg-brand-green" totalColor="text-brand-green" sign="+"
                entries={data.incomes} addPlaceholder="Descripción del ingreso"
                storageKey="incomes"
                onAdd={addIncome} onUpdate={updateIncome} onDelete={deleteIncome} />

              <Section title="Gastos fijos" dotColor="bg-brand-amber" totalColor="text-brand-amber" sign="−"
                entries={data.fixedExpenses} showPaid addPlaceholder="Ej: Alquiler, Spotify..."
                storageKey="fixed"
                onAdd={addFixed} onUpdate={updateFixed} onDelete={deleteFixed} />

              <Section title="Gastos variables" dotColor="bg-brand-red" totalColor="text-brand-red" sign="−"
                entries={data.varExpenses} addPlaceholder="Ej: Supermercado, restaurante..."
                storageKey="variable"
                headerAfter={<BudgetBar budget={data.varBudget ?? 0} spent={varTotal} onSave={handleBudget} />}
                onAdd={addVar} onUpdate={updateVar} onDelete={deleteVar} />

              <Section title="Ahorros" dotColor="bg-brand-blue" totalColor="text-brand-blue" sign="+"
                entries={data.savingsEntries} addPlaceholder="Ej: Fondo emergencia, vacaciones..."
                storageKey="savings"
                onAdd={addSaving} onUpdate={updateSaving} onDelete={deleteSaving} />
            </div>
          </>
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
