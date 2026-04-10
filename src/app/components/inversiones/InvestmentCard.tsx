"use client";

import { useEffect, useRef, useState } from "react";
import {
  Contribution, Investment, InvestmentCategory, INVESTMENT_CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS,
  totalContributions, addContribution, deleteContribution,
  updateContribution, deleteInvestment, updateInvestment,
} from "../../lib/investments";
import { fmtEur, fmtDate, todayStr } from "../../lib/data";
import { SaveButton, GhostButton, TextInput } from "../ui";
import { toast, confirm as confirmDialog } from "../Toast";

// ── Contribution modal (add & edit) ──────────────────────────────────────────
interface ContribModalProps {
  colorHex: string;
  initial?: Contribution;
  onSave: (amount: number, date: string, notes: string) => void;
  onClose: () => void;
}

function ContribModal({ colorHex, initial, onSave, onClose }: ContribModalProps) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate]     = useState(initial?.date ?? todayStr());
  const [notes, setNotes]   = useState(initial?.notes ?? "");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave() {
    const a = parseFloat(amount);
    if (isNaN(a) || a === 0) return;
    onSave(a, date, notes.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {initial ? "Editar aportación" : "Añadir aportación"}
          </p>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none transition-colors">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Importe €</label>
            <TextInput
              ref={amountRef}
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Ej: 500" step="0.01" className="w-full"
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Fecha</label>
            <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              Nota <span className="text-neutral-300 dark:text-neutral-600">(opcional)</span>
            </label>
            <TextInput
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ej: aportación mensual..."
              className="w-full"
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: colorHex }}
          >
            {initial ? "Guardar" : "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contribution row with swipe gestures ─────────────────────────────────────
interface ContribRowProps {
  c: Contribution;
  colorText: string;
  onOpenEdit: () => void;
  onDelete: () => void;
}

function ContribRow({ c, colorText, onOpenEdit, onDelete }: ContribRowProps) {
  const startX = useRef(0);
  const startY = useRef(0);
  const dx = useRef(0);
  const isSwiping = useRef(false);
  const isHoriz = useRef<boolean | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const delRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  function apply(d: number) {
    const cl = Math.max(-90, Math.min(70, d));
    dx.current = cl;
    if (rowRef.current) { rowRef.current.style.transform = `translateX(${cl}px)`; rowRef.current.style.transition = "none"; }
    if (delRef.current) { delRef.current.style.width = `${Math.max(0, -cl)}px`; delRef.current.style.transition = "none"; }
    if (editRef.current) { editRef.current.style.width = `${Math.max(0, cl)}px`; editRef.current.style.transition = "none"; }
  }

  function snap() {
    const S = "0.32s cubic-bezier(0.34,1.56,0.64,1)";
    const E = "0.32s cubic-bezier(0.4,0,0.2,1)";
    if (rowRef.current) { rowRef.current.style.transform = "translateX(0px)"; rowRef.current.style.transition = `transform ${S}`; }
    if (delRef.current) { delRef.current.style.width = "0px"; delRef.current.style.transition = `width ${E}`; }
    if (editRef.current) { editRef.current.style.width = "0px"; editRef.current.style.transition = `width ${E}`; }
  }

  function onTS(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHoriz.current = null;
    isSwiping.current = true;
    dx.current = 0;
  }

  function onTM(e: React.TouchEvent) {
    if (!isSwiping.current) return;
    const ddx = e.touches[0].clientX - startX.current;
    const ddy = e.touches[0].clientY - startY.current;
    if (isHoriz.current === null && (Math.abs(ddx) > 5 || Math.abs(ddy) > 5)) {
      isHoriz.current = Math.abs(ddx) > Math.abs(ddy);
    }
    if (isHoriz.current === false) { isSwiping.current = false; snap(); return; }
    if (isHoriz.current) { e.preventDefault(); apply(ddx); }
  }

  function onTE() {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const d = dx.current;
    snap();
    if (d < -60) onDelete();
    else if (d > 60) onOpenEdit();
  }

  return (
    <div className="relative overflow-hidden border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div ref={delRef} className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
        <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
          <XIcon />
          <span className="text-[9px] font-semibold whitespace-nowrap">Eliminar</span>
        </div>
      </div>
      <div ref={editRef} className="absolute inset-y-0 left-0 bg-brand-blue flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
        <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
          <PencilIcon />
          <span className="text-[9px] font-semibold whitespace-nowrap">Editar</span>
        </div>
      </div>
      <div
        ref={rowRef}
        className="flex items-center gap-2 px-4 py-2.5 relative z-20 bg-white dark:bg-neutral-900"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTS}
        onTouchMove={onTM}
        onTouchEnd={onTE}
      >
        <div className="flex-1 min-w-0">
          {c.notes && <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{c.notes}</p>}
        </div>
        <span className="text-[12px] text-neutral-400 shrink-0">{fmtDate(c.date)}</span>
        <span className={`text-sm font-medium shrink-0 ${colorText}`}>
          {c.amount >= 0 ? "+" : ""}{fmtEur(c.amount)}
        </span>
        <button
          onClick={onOpenEdit}
          title="Editar aportación"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
            text-neutral-400 hover:text-brand-blue hover:border-blue-300 dark:hover:border-blue-700
            hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-90"
        >
          <PencilIcon />
        </button>
        <button
          onClick={onDelete}
          title="Eliminar aportación"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
            text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
            hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}

// ── Category hex map for modal button color ───────────────────────────────────
const CATEGORY_HEX: Record<InvestmentCategory, string> = {
  emergency: "#378ADD",
  variable:  "#1D9E75",
  fixed:     "#BA7517",
  stock:     "#E24B4A",
};

// ── Main card ─────────────────────────────────────────────────────────────────
interface Props {
  investment: Investment;
  onChange: () => void;
}

export function InvestmentCard({ investment, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [editingInv, setEditingInv] = useState(false);
  const [invName, setInvName] = useState(investment.name);
  const [invIsin, setInvIsin] = useState(investment.isin ?? "");
  const [invCategory, setInvCategory] = useState(investment.category);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContrib, setEditingContrib] = useState<Contribution | null>(null);

  const colors = CATEGORY_COLORS[investment.category];
  const colorHex = CATEGORY_HEX[investment.category];
  const total = totalContributions(investment);
  const sorted = [...investment.contributions].sort((a, b) => b.date.localeCompare(a.date));

  async function handleSaveInv() {
    if (!invName.trim()) return;
    await updateInvestment(investment.id, invName.trim(), invIsin.trim() || undefined, invCategory);
    setEditingInv(false);
    toast("Inversión actualizada");
    onChange();
  }

  async function handleDelete() {
    const ok = await confirmDialog({ title: `¿Eliminar "${investment.name}"?`, message: "Se eliminarán todas sus aportaciones.", danger: true });
    if (!ok) return;
    await deleteInvestment(investment.id);
    toast("Inversión eliminada", "info");
    onChange();
  }

  async function handleAddContrib(amount: number, date: string, notes: string) {
    await addContribution(investment.id, amount, date, notes || undefined);
    onChange();
  }

  async function handleDeleteContrib(id: string) {
    await deleteContribution(id);
    onChange();
  }

  async function handleSaveContrib(amount: number, date: string, notes: string) {
    if (!editingContrib) return;
    await updateContribution(editingContrib.id, amount, date, notes || undefined);
    onChange();
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
          <button
            onClick={() => { setEditingInv(e => !e); setOpen(true); }}
            title="Editar inversión"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
              text-neutral-400 hover:text-brand-blue hover:border-blue-300 dark:hover:border-blue-700
              hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-90"
          >
            <PencilIcon />
          </button>
          <button
            onClick={handleDelete}
            title="Eliminar inversión"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
              text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
              hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* Edit investment form */}
      {editingInv && (
        <div className="flex flex-wrap gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
          <TextInput value={invName} onChange={e => setInvName(e.target.value)} placeholder="Nombre" className="flex-1 min-w-[140px]" autoFocus />
          <TextInput value={invIsin} onChange={e => setInvIsin(e.target.value)} placeholder="ISIN (opcional)" className="w-36 font-mono" />
          <select value={invCategory} onChange={e => setInvCategory(e.target.value as InvestmentCategory)} className="input-base w-36">
            {INVESTMENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
          </select>
          <SaveButton onClick={handleSaveInv} />
          <GhostButton onClick={() => setEditingInv(false)}>✕</GhostButton>
        </div>
      )}

      {/* Contributions */}
      {open && (
        <>
          {/* Add button */}
          <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: colorHex }}
            >
              + Añadir aportación
            </button>
          </div>

          {/* Contribution list */}
          {sorted.length === 0 ? (
            <p className="px-4 py-4 text-sm text-neutral-400 dark:text-neutral-600">
              Sin aportaciones todavía
            </p>
          ) : (
            sorted.map((c) => (
              <ContribRow
                key={c.id}
                c={c}
                colorText={c.amount >= 0 ? colors.text : "text-brand-red"}
                onOpenEdit={() => setEditingContrib(c)}
                onDelete={() => handleDeleteContrib(c.id)}
              />
            ))
          )}
        </>
      )}

      {/* Add modal */}
      {showAddModal && (
        <ContribModal
          colorHex={colorHex}
          onSave={handleAddContrib}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit modal */}
      {editingContrib && (
        <ContribModal
          colorHex={colorHex}
          initial={editingContrib}
          onSave={handleSaveContrib}
          onClose={() => setEditingContrib(null)}
        />
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
