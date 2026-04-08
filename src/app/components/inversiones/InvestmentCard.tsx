"use client";

import { useRef, useState } from "react";
import {
  Contribution, Investment, InvestmentCategory, INVESTMENT_CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS,
  totalContributions, addContribution, deleteContribution,
  updateContribution, deleteInvestment, updateInvestment,
} from "../../lib/investments";
import { fmtEur, fmtDate, todayStr } from "../../lib/data";
import { SaveButton, GhostButton, TextInput } from "../ui";
import { toast, confirm as confirmDialog } from "../Toast";

interface ContribRowProps {
  c: Contribution;
  colorText: string;
  isEditing: boolean;
  editAmount: string;
  editDate: string;
  editNotes: string;
  onEditAmountChange: (v: string) => void;
  onEditDateChange: (v: string) => void;
  onEditNotesChange: (v: string) => void;
  onOpenEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function ContribRow({
  c, colorText, isEditing,
  editAmount, editDate, editNotes,
  onEditAmountChange, onEditDateChange, onEditNotesChange,
  onOpenEdit, onSaveEdit, onCancelEdit, onDelete,
}: ContribRowProps) {
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
    <div>
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
      {isEditing && (
        <div className="flex flex-wrap gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
          <TextInput type="number" value={editAmount} onChange={e => onEditAmountChange(e.target.value)} placeholder="Importe €" step="0.01" className="w-28" />
          <TextInput type="date" value={editDate} onChange={e => onEditDateChange(e.target.value)} className="w-36" />
          <TextInput value={editNotes} onChange={e => onEditNotesChange(e.target.value)} placeholder="Nota (opcional)" className="flex-1 min-w-[120px]" />
          <SaveButton onClick={onSaveEdit} />
          <GhostButton onClick={onCancelEdit}>✕</GhostButton>
        </div>
      )}
    </div>
  );
}

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
              <ContribRow
                key={c.id}
                c={c}
                colorText={c.amount >= 0 ? colors.text : "text-brand-red"}
                isEditing={editingContrib === c.id}
                editAmount={editAmount}
                editDate={editDate}
                editNotes={editNotes}
                onEditAmountChange={setEditAmount}
                onEditDateChange={setEditDate}
                onEditNotesChange={setEditNotes}
                onOpenEdit={() => openEditContrib(c)}
                onSaveEdit={() => handleSaveContrib(c)}
                onCancelEdit={() => setEditingContrib(null)}
                onDelete={() => handleDeleteContrib(c.id)}
              />
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
