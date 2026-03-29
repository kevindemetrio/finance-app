"use client";

import { useEffect, useState } from "react";
import {
  Category, CATEGORIES, RecurringTemplate,
  createTemplate, deleteTemplate, loadTemplates, updateTemplate,
} from "../lib/data";
import { GhostButton, IconButton, SaveButton, TextInput } from "./ui";

interface Props {
  onClose: () => void;
}

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export function TemplateManager({ onClose }: Props) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);

  const [newName, setNewName]   = useState("");
  const [newAmt, setNewAmt]     = useState("");
  const [newCat, setNewCat]     = useState("");
  const [newDay, setNewDay]     = useState("1");
  const [newNotes, setNewNotes] = useState("");

  const [editName, setEditName]   = useState("");
  const [editAmt, setEditAmt]     = useState("");
  const [editCat, setEditCat]     = useState("");
  const [editDay, setEditDay]     = useState("1");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    loadTemplates().then(t => { setTemplates(t); setLoading(false); });
  }, []);

  async function handleAdd() {
    const a = parseFloat(newAmt);
    if (!newName.trim() || isNaN(a) || a <= 0) return;
    await createTemplate(newName.trim(), a, newCat || undefined, parseInt(newDay) || 1, newNotes.trim() || undefined);
    setNewName(""); setNewAmt(""); setNewCat(""); setNewDay("1"); setNewNotes(""); setAddingNew(false);
    loadTemplates().then(setTemplates);
  }

  function openEdit(t: RecurringTemplate) {
    setEditId(t.id);
    setEditName(t.name);
    setEditAmt(String(t.amount));
    setEditCat(t.category ?? "");
    setEditDay(String(t.dayOfMonth ?? 1));
    setEditNotes(t.notes ?? "");
  }

  async function handleSaveEdit() {
    if (!editId || !editName.trim()) return;
    const a = parseFloat(editAmt);
    if (isNaN(a) || a <= 0) return;
    await updateTemplate(editId, editName.trim(), a, editCat || undefined, parseInt(editDay) || 1, editNotes.trim() || undefined);
    setEditId(null);
    loadTemplates().then(setTemplates);
  }

  async function handleDelete(id: string) {
    await deleteTemplate(id);
    loadTemplates().then(setTemplates);
  }

  const total = templates.reduce((a, t) => a + t.amount, 0);
  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <p className="text-sm font-medium">Plantilla de gastos fijos</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {templates.length} gastos · −{fmt(total)}/mes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none transition-colors"
          >×</button>
        </div>

        {/* Column headers */}
        {templates.length > 0 && (
          <div className="grid grid-cols-[1fr_72px_100px_72px_56px] gap-2 px-4 py-1.5 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800">
            {["Nombre","Importe","Categoría","Día",""].map((h, i) => (
              <span key={i} className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-600">{h}</span>
            ))}
          </div>
        )}

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-neutral-400">Cargando...</div>
          ) : templates.length === 0 && !addingNew ? (
            <div className="py-8 text-center text-sm text-neutral-400">Sin gastos en la plantilla todavía</div>
          ) : null}

          {templates.map(t => (
            <div key={t.id}>
              {editId === t.id ? (
                <div className="flex flex-wrap gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                  <TextInput value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" className="flex-1 min-w-[120px]" autoFocus />
                  <TextInput type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)} placeholder="€" className="w-20" />
                  <select value={editCat} onChange={e => setEditCat(e.target.value)} className="input-base w-32">
                    <option value="">Categoría</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={editDay} onChange={e => setEditDay(e.target.value)} className="input-base w-16" title="Día del mes">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <TextInput value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Nota (opcional)" className="flex-1 min-w-[120px]" />
                  <SaveButton onClick={handleSaveEdit} />
                  <GhostButton onClick={() => setEditId(null)}>✕</GhostButton>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_72px_100px_56px_56px] gap-2 items-start px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 text-sm">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-amber shrink-0 mt-1" />
                      <span className="text-neutral-800 dark:text-neutral-200 truncate">{t.name}</span>
                    </div>
                    {t.notes && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 italic truncate ml-3.5 mt-0.5">{t.notes}</p>
                    )}
                  </div>
                  <span className="font-medium text-brand-amber pt-0.5">−{fmt(t.amount)}</span>
                  {t.category ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 truncate self-start mt-0.5">
                      {t.category}
                    </span>
                  ) : (
                    <span className="text-neutral-300 dark:text-neutral-600 text-xs pt-0.5">—</span>
                  )}
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 pt-0.5">
                    día {t.dayOfMonth ?? 1}
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <IconButton onClick={() => openEdit(t)}><PencilIcon /></IconButton>
                    <IconButton danger onClick={() => handleDelete(t.id)}><XIcon /></IconButton>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new row */}
          {addingNew ? (
            <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
              <TextInput
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Nombre del gasto" className="flex-1 min-w-[120px]"
                onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus
              />
              <TextInput
                type="number" value={newAmt} onChange={e => setNewAmt(e.target.value)}
                placeholder="€/mes" className="w-20"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
              <select value={newCat} onChange={e => setNewCat(e.target.value)} className="input-base w-32">
                <option value="">Categoría</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newDay} onChange={e => setNewDay(e.target.value)} className="input-base w-16" title="Día del mes">
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <TextInput value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Nota (opcional)" className="flex-1 min-w-[120px]" />
              <SaveButton onClick={handleAdd} />
              <GhostButton onClick={() => { setAddingNew(false); setNewName(""); setNewAmt(""); setNewCat(""); setNewDay("1"); setNewNotes(""); }}>✕</GhostButton>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              className="w-full text-left px-4 py-3 text-sm text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
            >
              + Añadir gasto a plantilla
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <p className="text-xs text-neutral-400">El día indica cuándo se cobra cada mes (máx. 28)</p>
          <GhostButton onClick={onClose}>Cerrar</GhostButton>
        </div>
      </div>
    </div>
  );
}

function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
