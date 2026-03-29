"use client";

import { useMemo } from "react";
import { MonthData, fmtEur, calcBalance } from "../lib/data";

interface Props {
  data: MonthData;
  totalSavings: number;
  isPastMonth?: boolean;
}

export function SummaryGrid({ data, totalSavings, isPastMonth }: Props) {
  const { totalInc, totalFix, fixPaid, fixPending, totalVar, savMonth, balance, varBudget, varPct, varOver } = useMemo(() => {
    const totalInc  = data.incomes.reduce((a, i) => a + i.amount, 0);
    const totalFix  = data.fixedExpenses.reduce((a, i) => a + i.amount, 0);
    const fixPaid   = data.fixedExpenses.filter(i => i.paid).reduce((a, i) => a + i.amount, 0);
    const fixPending = totalFix - fixPaid;
    const totalVar  = data.varExpenses.filter(i => i.paid !== false).reduce((a, i) => a + i.amount, 0);
    const savMonth  = data.savingsEntries.reduce((a, i) => a + i.amount, 0);
    const balance   = calcBalance(data);
    const varBudget = data.varBudget ?? 0;
    const varPct    = varBudget > 0 ? Math.min(100, Math.round((totalVar / varBudget) * 100)) : 0;
    const varOver   = varBudget > 0 && totalVar > varBudget;
    return { totalInc, totalFix, fixPaid, fixPending, totalVar, savMonth, balance, varBudget, varPct, varOver };
  }, [data]);

  return (
    <div className="mb-5" data-tour="summary">
      {isPastMonth && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
          <span className="text-amber-500 text-xs">◷</span>
          <p className="text-xs text-amber-700 dark:text-amber-400">Estás viendo un mes pasado — los cambios afectarán datos históricos</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
        <MetricCard label="Ingresos" value={fmtEur(totalInc + (data.carryover ?? 0))} color="green">
          {(data.carryover ?? 0) > 0 && (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">+{fmtEur(data.carryover ?? 0)} anterior</p>
          )}
        </MetricCard>
        <MetricCard label="Balance" value={fmtEur(balance)} color={balance >= 0 ? "green" : "red"} />
        <MetricCard label="Gastos fijos" value={fmtEur(totalFix)} color="amber">
          <div className="flex gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] text-brand-green-dark dark:text-green-400">✓ {fmtEur(fixPaid)}</span>
            <span className="text-[11px] text-brand-red-dark dark:text-red-400">✗ {fmtEur(fixPending)}</span>
          </div>
        </MetricCard>
        <MetricCard label="Gastos variables" value={fmtEur(totalVar)} color={varOver ? "red" : "orange"}>
          {varBudget > 0 && (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{varPct}% de {fmtEur(varBudget)}</p>
          )}
        </MetricCard>
        <MetricCard label="Ahorros mes" value={fmtEur(savMonth)} color="blue" />
        <MetricCard label="Ahorro total" value={fmtEur(totalSavings)} color="blue" />
      </div>
    </div>
  );
}

const colorMap = {
  green:  "text-brand-green",
  red:    "text-brand-red",
  amber:  "text-brand-amber",
  blue:   "text-brand-blue",
  orange: "text-brand-orange",
};

const accentMap = {
  green:  "border-l-brand-green",
  red:    "border-l-brand-red",
  amber:  "border-l-brand-amber",
  blue:   "border-l-brand-blue",
  orange: "border-l-[#D85A30]",
};

function MetricCard({ label, value, color, children }: {
  label: string; value: string; color: keyof typeof colorMap; children?: React.ReactNode;
}) {
  return (
    <div className={`metric-card border-l-[3px] ${accentMap[color]}`}>
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1.5 font-semibold truncate">{label}</p>
      <p className={`text-base font-bold leading-tight ${colorMap[color]}`}>{value}</p>
      {children}
    </div>
  );
}
