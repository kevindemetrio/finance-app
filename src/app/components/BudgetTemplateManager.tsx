"use client";

import { useEffect, useState } from "react";
import {
  BudgetTemplateItem, Category, CATEGORIES, GLOBAL_BUDGET_KEY,
  loadBudgetTemplate, saveBudgetTemplateItem, deleteBudgetTemplateItem,
} from "../lib/data";
import { GhostButton, IconButton, SaveButton, TextInput } from "./ui";

const CAT_COLORS: Record<string, { dot: string; text: string }> = {
  "Alimentación": { dot: "#6CC8A8", text: "#1D9E75" },
  "Ocio":         { dot: "#E09190", text: "#C05B5A" },
  "Tecnología":   { dot: "#8FBA6A", text: "#5A8A35" },
  "Transporte":   { dot: "#7AAEE0", text: "#4A80C4" },
  "Hogar":        { dot: "#7AAEE0", text: "#4A80C4" },
  "Salud":        { dot: "#6CC8A8", text: "#1D9E75" },
  "Ropa":         { dot: "#D98FAA", text: "#B05878" },
  "Regalos":      { dot: "#D98FAA", text: "#B05878" },
  "Educación":    { dot: "#8FBA6A", text: "#5A8A35" },
  "Viajes":       { dot: "#E0B472", text: "#C4862A" },
  "Otro":         { dot: "#A8A49E", text: "#7A7770" },
};

interface Props {
  onClose: () => void;
}

export function BudgetTemplateManager({ onClose }: Props) {
  const [items, setItems]         = useState<BudgetTemplateItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [addingNew, setAddingNew] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);

  const [newCat, setNewCat] = useState<Category | "">("");
  const [newAmt, setNewAmt] = useState("");
  const [editAmt, setEditAmt] = useState("");

  useEffect(() => {
    loadBudgetTemplate().then(t => { setItems(t); setLoading(false); });
  }, []);

  const globalItem   = items.find(i => i.category === GLOBAL_BUDGET_KEY);
  const catItems     = items.filter(i => i.category !== GLOBAL_BUDGET_KEY);
  const usedCats     = new Set(catItems.map(i => i.category));
  const availableCats = CATEGORIES.filter(c => !usedCats.has(c));

  const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  const totalCats = catItems.reduce((a, i) => a + i.budget, 0);

  async function handleAdd() {
    const a = parseFloat(newAmt);
    if (!newCat || isNaN(a) || a <= 0) return;
    await saveBudgetTemplateItem(newCat as Category, a);
    setNewCat(""); setNewAmt(""); setAddingNew(false);
    loadBudgetTemplate().then(setItems);
  }

  function openEdit(item: BudgetTemplateItem) {
    setEditId(item.id);
    setEditAmt(String(item.budget));
  }

  async function handleSaveEdit(item: BudgetTemplateItem) {
    const a = parseFloat(editAmt);
    if (isNaN(a) || a <= 0) return;
    await saveBudgetTemplateItem(item.category, a);
    setEditId(null);
    loadBudgetTemplate().then(setItems);
  }

  async function handleDelete(id: string) {
    await deleteBudgetTemplateItem(id);
    loadBudgetTemplate().then(setItems);
  }

  async function handleSaveGlobal() {
    const a = parseFloat(editAmt);
    if (isNaN(a) || a <= 0) return;
    await saveBudgetTemplateItem(GLOBAL_BUDGET_KEY, a);
    setEditId(null);
    loadBudgetTemplate().then(setItems);
  }

  async function handleAddGlobal() {
    const a = parseFloat(editAmt);
    if (isNaN(a) || a <= 0) return;
    await saveBudgetTemplateItem(GLOBAL_BUDGET_KEY, a);
    setEditAmt(""); setEditId(null);
    loadBudgetTemplate().then(setItems);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <p className="text-sm font-medium">Plantilla de presupuestos</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {catItems.length} {catItems.length === 1 ? "categoría" : "categorías"} · {fmt(totalCats)}/mes en límites
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none transition-colors"
          >×</button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* ── Presupuesto global ── */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Presupuesto total de variables</span>
              {!globalItem && editId !== "__new_global__" && (
                <button
                  onClick={() => { setEditId("__new_global__"); setEditAmt(""); }}
                  className="text-[11px] font-medium text-brand-blue hover:underline"
                >+ Definir</button>
              )}
            </div>
            {editId === "__new_global__" || (globalItem && editId === globalItem.id) ? (
              <div className="flex items-center gap-2 mt-1">
                <TextInput
                  type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)}
                  placeholder="€/mes" className="flex-1" autoFocus min="0" step="1"
                  onKeyDown={e => {
                    if (e.key === "Enter") globalItem ? handleSaveGlobal() : handleAddGlobal();
                    if (e.key === "Escape") setEditId(null);
                  }}
                />
                <SaveButton onClick={globalItem ? handleSaveGlobal : handleAddGlobal} />
                <GhostButton onClick={() => setEditId(null)}>✕</GhostButton>
              </div>
            ) : globalItem ? (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{fmt(globalItem.budget)}<span className="text-xs font-normal text-neutral-400 ml-1">/mes</span></span>
                <div className="flex items-center gap-1">
                  <IconButton onClick={() => openEdit(globalItem)}><PencilIcon /></IconButton>
                  <IconButton danger onClick={() => handleDelete(globalItem.id)}><XIcon /></IconButton>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic mt-0.5">No definido</p>
            )}
          </div>

          {/* ── Column headers ── */}
          {catItems.length > 0 && (
            <div className="grid grid-cols-[1fr_80px_56px] gap-2 px-4 py-1.5 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800">
              {["Categoría", "Límite", ""].map((h, i) => (
                <span key={i} className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-600">{h}</span>
              ))}
            </div>
          )}

          {/* ── Lista categorías ── */}
          {loading ? (
            <div className="py-8 text-center text-sm text-neutral-400">Cargando...</div>
          ) : catItems.length === 0 && !addingNew ? (
            <div className="py-6 text-center text-sm text-neutral-400">Sin categorías en la plantilla</div>
          ) : null}

          {catItems.map(item => {
            const cc = CAT_COLORS[item.category as string] || { dot: "#A8A49E", text: "#7A7770" };
            return (
              <div key={item.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                {editId === item.id ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cc.dot }} />
                    <span className="text-xs font-medium flex-1" style={{ color: cc.text }}>{item.category}</span>
                    <TextInput
                      type="number" value={editAmt} onChange={e => setEditAmt(e.target.value)}
                      placeholder="€" className="w-20" autoFocus min="0" step="1"
                      onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(item); if (e.key === "Escape") setEditId(null); }}
                    />
                    <SaveButton onClick={() => handleSaveEdit(item)} />
                    <GhostButton onClick={() => setEditId(null)}>✕</GhostButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_80px_56px] gap-2 items-center px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cc.dot }} />
                      <span className="text-xs font-medium truncate" style={{ color: cc.text }}>{item.category}</span>
                    </div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{fmt(item.budget)}</span>
                    <div className="flex items-center gap-1 justify-end">
                      <IconButton onClick={() => openEdit(item)}><PencilIcon /></IconButton>
                      <IconButton danger onClick={() => handleDelete(item.id)}><XIcon /></IconButton>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new */}
          {addingNew ? (
            <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
              <select
                value={newCat}
                onChange={e => setNewCat(e.target.value as Category)}
                className="input-base flex-1 min-w-[140px] text-xs"
                autoFocus
              >
                <option value="">Seleccionar categoría...</option>
                {availableCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <TextInput
                type="number" value={newAmt} onChange={e => setNewAmt(e.target.value)}
                placeholder="€/mes" className="w-24"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
              <SaveButton onClick={handleAdd} />
              <GhostButton onClick={() => { setAddingNew(false); setNewCat(""); setNewAmt(""); }}>✕</GhostButton>
            </div>
          ) : availableCats.length > 0 ? (
            <button
              onClick={() => setAddingNew(true)}
              className="w-full text-left px-4 py-3 text-sm text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
            >
              + Añadir categoría a plantilla
            </button>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <p className="text-xs text-neutral-400">Al importar se aplican todos los valores</p>
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
