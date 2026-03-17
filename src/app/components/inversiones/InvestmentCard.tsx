"use client";

import { useState } from "react";
import {
  Contribution, Investment, CATEGORY_COLORS,
  totalContributions, addContribution, deleteContribution,
  updateContribution, deleteInvestment, updateInvestment,
} from "../../lib/investments";
import { fmtEur, fmtDate, todayStr } from "../../lib/data";
import { IconButton, SaveButton, GhostButton, TextInput } from "../ui";

interface Props {
  investment: Investment;
  onChange: () => void;
}

export function InvestmentCard({ investment, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [editingInv, setEditingInv] = useState(false);
  const [invName, setInvName] = useState(investment.name);
  const [invIsin, setInvIsin] = useState(investment.isin ?? "");
  const [addingContrib, setAddingContrib] = useState(false);
  const [contribAmount, setContribAmount] = useState("");
  const [contribDate, setContribDate] = useState(todayStr());
  const [contribNotes, setContribNotes] = useState("");
  const [editingContrib, setEditingContrib] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const colors = CATEGORY_COLORS[investment.category];
  const total = totalContributions(investment);
  const sorted = [...investment.contributions].sort((a, b) => b.date.localeCompare(a.date));

  async function handleSaveInv() {
    if (!invName.trim()) return;
    await updateInvestment(investment.id, invName.trim(), invIsin.trim() || undefined);
    setEditingInv(false);
    onChange();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${investment.name}" y todas sus aportaciones?`)) return;
    await deleteInvestment(investment.id);
    onChange();
  }

  async function handleAddContrib() {
    const a = parseFloat(contribAmount);
    if (isNaN(a) || a === 0) return;
    await addContribution(investment.id, a, contribDate, contribNotes.trim() || undefined);
    setContribAmount("");
    setContribDate(todayStr());
    setContribNotes("");
    setAddingContrib(false);
    onChange();
  }

  async function handleDeleteContrib(id: string) {
    await deleteContribution(id);
    onChange();
  }

  async function handleSaveContrib(c: Contribution) {
    const a = parseFloat(editAmount);
    if (isNaN(a) || a === 0) return;
    await updateContribution(c.id, a, editDate, editNotes.trim() || undefined);
    setEditingContrib(null);
    onChange();
  }

  function openEditContrib(c: Contribution) {
    setEditingContrib(c.id);
    setEditAmount(String(c.amount));
    setEditDate(c.date);
    setEditNotes(c.notes ?? "");
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <svg
            className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{investment.name}</p>
            {investment.isin && (
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">{investment.isin}</p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-medium ${colors.text}`}>{fmtEur(total)}</span>
          <IconButton onClick={() => { setEditingInv(e => !e); setOpen(true); }}>
            <PencilIcon />
          </IconButton>
          <IconButton danger onClick={handleDelete}>
            <XIcon />
          </IconButton>
        </div>
      </div>

      {/* Edit investment form */}
      {editingInv && (
        <div className="flex flex-wrap gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
          <TextInput value={invName} onChange={e => setInvName(e.target.value)} placeholder="Nombre" className="flex-1 min-w-[140px]" />
          <TextInput value={invIsin} onChange={e => setInvIsin(e.target.value)} placeholder="ISIN (opcional)" className="w-40 font-mono" />
          <SaveButton onClick={handleSaveInv} />
          <GhostButton onClick={() => setEditingInv(false)}>✕</GhostButton>
        </div>
      )}

      {/* Contributions */}
      {open && (
        <>
          {/* Add contribution form */}
          <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            {addingContrib ? (
              <>
                <TextInput
                  type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                  placeholder="Importe €" step="0.01" className="w-28"
                />
                <TextInput
                  type="date" value={contribDate} onChange={e => setContribDate(e.target.value)}
                  className="w-36"
                />
                <TextInput
                  value={contribNotes} onChange={e => setContribNotes(e.target.value)}
                  placeholder="Nota (opcional)" className="flex-1 min-w-[120px]"
                />
                <SaveButton onClick={handleAddContrib} />
                <GhostButton onClick={() => setAddingContrib(false)}>✕</GhostButton>
              </>
            ) : (
              <button
                onClick={() => setAddingContrib(true)}
                className="text-sm text-brand-blue hover:underline"
              >
                + Añadir aportación
              </button>
            )}
          </div>

          {/* Contribution list */}
          {sorted.length === 0 ? (
            <p className="px-4 py-4 text-sm text-neutral-400 dark:text-neutral-600">
              Sin aportaciones todavía
            </p>
          ) : (
            sorted.map((c) => (
              <div key={c.id}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    {c.notes && <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{c.notes}</p>}
                  </div>
                  <span className="text-[12px] text-neutral-400 shrink-0">{fmtDate(c.date)}</span>
                  <span className={`text-sm font-medium shrink-0 ${c.amount >= 0 ? colors.text : "text-brand-red"}`}>
                    {c.amount >= 0 ? "+" : ""}{fmtEur(c.amount)}
                  </span>
                  <IconButton onClick={() => openEditContrib(c)}><PencilIcon /></IconButton>
                  <IconButton danger onClick={() => handleDeleteContrib(c.id)}><XIcon /></IconButton>
                </div>
                {editingContrib === c.id && (
                  <div className="flex flex-wrap gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                    <TextInput type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="Importe €" step="0.01" className="w-28" />
                    <TextInput type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-36" />
                    <TextInput value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Nota (opcional)" className="flex-1 min-w-[120px]" />
                    <SaveButton onClick={() => handleSaveContrib(c)} />
                    <GhostButton onClick={() => setEditingContrib(null)}>✕</GhostButton>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
