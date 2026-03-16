"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Entry,
  MonthData,
  getAllTimeSavings,
  getCarryover,
  loadMonth,
  saveEntry,
  deleteEntry,
  saveMonthConfig,
  calcBalance,
  uid,
} from "./lib/data";
import { createClient } from "./lib/supabase/client";
import { SummaryGrid } from "./components/SummaryGrid";
import { Section } from "./components/Section";
import { BudgetBar } from "./components/BudgetBar";
import { MonthPicker } from "./components/MonthPicker";
import { ThemeToggle } from "./components/ThemeProvider";

function emptyMonth(): MonthData {
  return { incomes: [], fixedExpenses: [], varExpenses: [], savingsEntries: [], varBudget: 0, carryover: 0 };
}

export default function HomePage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear]           = useState(today.getFullYear());
  const [month, setMonth]         = useState(today.getMonth());
  const [data, setData]           = useState<MonthData>(emptyMonth());
  const [totalSavings, setSavings] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [userEmail, setUserEmail] = useState("");

  // Load user email
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Load month data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadMonth(year, month),
      getCarryover(year, month),
      getAllTimeSavings(year, month),
    ]).then(([monthData, carryover, savings]) => {
      monthData.carryover = carryover;
      setData(monthData);
      setSavings(savings);
      setLoading(false);
    });
  }, [year, month]);

  // ── Generic updater ───────────────────────────────────────────────────────
  const addEntryToSection = useCallback(
    async (
      entry: Entry,
      type: "income" | "fixed" | "variable" | "saving",
      section: keyof Pick<MonthData, "incomes" | "fixedExpenses" | "varExpenses" | "savingsEntries">
    ) => {
      const newEntry = { ...entry, id: entry.id || uid() };
      await saveEntry(newEntry, type, year, month);
      setData((d) => ({ ...d, [section]: [...d[section], newEntry] }));
      if (type === "saving") {
        setSavings((s) => s + newEntry.amount);
      }
    },
    [year, month]
  );

  const updateEntryInSection = useCallback(
    async (
      idx: number,
      updated: Entry,
      type: "income" | "fixed" | "variable" | "saving",
      section: keyof Pick<MonthData, "incomes" | "fixedExpenses" | "varExpenses" | "savingsEntries">
    ) => {
      await saveEntry(updated, type, year, month);
      setData((d) => {
        const arr = [...d[section]] as Entry[];
        arr[idx] = updated;
        return { ...d, [section]: arr };
      });
      if (type === "saving") {
        getAllTimeSavings(year, month).then(setSavings);
      }
    },
    [year, month]
  );

  const deleteEntryFromSection = useCallback(
    async (
      idx: number,
      type: "saving" | string,
      section: keyof Pick<MonthData, "incomes" | "fixedExpenses" | "varExpenses" | "savingsEntries">
    ) => {
      const entry = (data[section] as Entry[])[idx];
      await deleteEntry(entry.id);
      setData((d) => ({ ...d, [section]: (d[section] as Entry[]).filter((_, i) => i !== idx) }));
      if (type === "saving") {
        getAllTimeSavings(year, month).then(setSavings);
      }
    },
    [data, year, month]
  );

  // ── Section handlers ──────────────────────────────────────────────────────
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

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const varTotal = data.varExpenses.reduce((a, i) => a + i.amount, 0);

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400
              hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800
              dark:hover:text-neutral-200 transition-colors text-xl leading-none"
          >‹</button>

          <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />

          <div className="flex items-center gap-1">
            <button
              onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800
                dark:hover:text-neutral-200 transition-colors text-xl leading-none"
            >›</button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title={userEmail}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-400
                hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700
                dark:hover:text-neutral-200 transition-colors"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400 dark:text-neutral-600 text-sm">
            Cargando...
          </div>
        ) : (
          <>
            <SummaryGrid data={data} totalSavings={totalSavings} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <Section title="Gastos variables" dotColor="bg-brand-red" totalColor="text-brand-red" sign="−"
                entries={data.varExpenses} addPlaceholder="Ej: Supermercado, restaurante..."
                headerAfter={<BudgetBar budget={data.varBudget ?? 0} spent={varTotal} onSave={handleBudget} />}
                onAdd={addVar} onUpdate={updateVar} onDelete={deleteVar} />

                <Section title="Gastos fijos" dotColor="bg-brand-amber" totalColor="text-brand-amber" sign="−"
                entries={data.fixedExpenses} showPaid addPlaceholder="Ej: Alquiler, Spotify..."
                onAdd={addFixed} onUpdate={updateFixed} onDelete={deleteFixed} />

              <Section title="Ingresos" dotColor="bg-brand-green" totalColor="text-brand-green" sign="+"
                entries={data.incomes} addPlaceholder="Descripción del ingreso"
                onAdd={addIncome} onUpdate={updateIncome} onDelete={deleteIncome} />

              <Section title="Ahorros" dotColor="bg-brand-blue" totalColor="text-brand-blue" sign="+"
                entries={data.savingsEntries} addPlaceholder="Ej: Fondo emergencia, vacaciones..."
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
