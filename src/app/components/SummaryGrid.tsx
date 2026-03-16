"use client";

import { MonthData, fmtEur, calcBalance } from "../lib/data";

interface Props {
  data: MonthData;
  totalSavings: number;
}

export function SummaryGrid({ data, totalSavings }: Props) {
  const totalInc   = data.incomes.reduce((a, i) => a + i.amount, 0);
  const totalFix   = data.fixedExpenses.reduce((a, i) => a + i.amount, 0);
  const fixPaid    = data.fixedExpenses.filter((i) => i.paid).reduce((a, i) => a + i.amount, 0);
  const fixPending = data.fixedExpenses.filter((i) => !i.paid).reduce((a, i) => a + i.amount, 0);
  const totalVar   = data.varExpenses.reduce((a, i) => a + i.amount, 0);
  const savMonth   = data.savingsEntries.reduce((a, i) => a + i.amount, 0);
  const balance    = calcBalance(data);
  const varBudget  = data.varBudget ?? 0;
  const varPct     = varBudget > 0 ? Math.min(100, Math.round((totalVar / varBudget) * 100)) : 0;
  const varOver    = varBudget > 0 && totalVar > varBudget;

  return (
    <div className="space-y-2.5 mb-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <MetricCard label="Ingresos" value={fmtEur(totalInc + (data.carryover ?? 0))} color="green">
          {(data.carryover ?? 0) > 0 && (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              +{fmtEur(data.carryover ?? 0)} anterior
            </p>
          )}
        </MetricCard>
        <MetricCard label="Gastos fijos" value={fmtEur(totalFix)} color="amber">
          <div className="flex gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] text-brand-green-dark dark:text-green-400">✓ {fmtEur(fixPaid)}</span>
            <span className="text-[11px] text-brand-red-dark dark:text-red-400">✗ {fmtEur(fixPending)}</span>
          </div>
        </MetricCard>
        <MetricCard label="Gastos variables" value={fmtEur(totalVar)} color={varOver ? "red" : "orange"}>
          {varBudget > 0 && (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
              {varPct}% de {fmtEur(varBudget)}
            </p>
          )}
        </MetricCard>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <MetricCard label="Balance" value={fmtEur(balance)} color={balance >= 0 ? "green" : "red"} />
        <MetricCard label="Ahorros mes" value={fmtEur(savMonth)} color="blue" />
        <MetricCard label="Ahorros total" value={fmtEur(totalSavings)} color="blue" />
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

function MetricCard({ label, value, color, children }: {
  label: string;
  value: string;
  color: keyof typeof colorMap;
  children?: React.ReactNode;
}) {
  return (
    <div className="metric-card">
      <p className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">{label}</p>
      <p className={`text-sm sm:text-base font-medium leading-tight ${colorMap[color]}`}>{value}</p>
      {children}
    </div>
  );
}
