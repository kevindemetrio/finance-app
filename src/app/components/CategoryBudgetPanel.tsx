"use client";

import { useEffect, useRef, useState } from "react";
import {
  Category, CategoryBudget, Entry, fmtEur,
  saveCategoryBudget, deleteCategoryBudget, saveMonthConfig,
  importBudgetTemplate, loadBudgetTemplate, BudgetTemplateItem,
} from "../lib/data";
import { GhostButton, SaveButton, TextInput } from "./ui";
import { useTheme, SEASON_CONFIG } from "./ThemeProvider";
import { useCategories } from "./CategoriesProvider";
import { toast } from "./Toast";
import { BudgetTemplateManager } from "./BudgetTemplateManager";

interface Props {
  year: number;
  month: number;
  varExpenses: Entry[];
  budgets: CategoryBudget[];
  varBudget: number;
  disabled?: boolean;
  onChange: (updated: CategoryBudget[]) => void;
  onVarBudgetChange: (v: number) => void;
}

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

function Bar({ pct, over, warn }: { pct: number; over: boolean; warn: boolean }) {
  const lightColor = over ? "#E24B4A" : warn ? "#F0B95A" : "#6CC8A8";
  return (
    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all dark:hidden"
           style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: lightColor }} />
      <div className={`h-full rounded-full transition-all hidden dark:block ${over ? "bg-brand-red" : warn ? "bg-brand-amber" : "bg-brand-green"}`}
           style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

// ── Modal para editar/añadir presupuesto de categoría ──────────────────────────
interface BudgetModalProps {
  category: Category | null;   // null = presupuesto global
  currentValue: number;
  categories: Category[];
  usedCategories: Category[];
  onSave: (cat: Category | null, value: number) => void;
  onClose: () => void;
}

function BudgetModal({ category, currentValue, categories, usedCategories, onSave, onClose }: BudgetModalProps) {
  const [val, setVal]       = useState(currentValue > 0 ? String(currentValue) : "");
  const [selCat, setSelCat] = useState<Category | "">(category ?? "");
  const isGlobal = category === null && selCat === "";

  const available = categories.filter(c => !usedCategories.includes(c) || c === category);

  function handleSave() {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    onSave(isGlobal ? null : (selCat as Category), n);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-sm font-medium">
            {category === null && !selCat ? "Presupuesto mensual" : `Límite de ${selCat || "categoría"}`}
          </p>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none transition-colors">×</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          {/* Si es nueva categoría, mostrar selector */}
          {category === null && (
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">Categoría</label>
              <select
                value={selCat}
                onChange={e => setSelCat(e.target.value as Category)}
                className="input-base w-full text-sm"
                autoFocus
              >
                <option value="">Presupuesto global de variables</option>
                {available.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 block">
              {isGlobal ? "Presupuesto total (€)" : "Límite mensual (€)"}
            </label>
            <TextInput
              type="number" value={val} onChange={e => setVal(e.target.value)}
              placeholder="0,00" className="w-full" min="0" step="1"
              autoFocus={category !== null}
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose(); }}
            />
          </div>
        </div>
        <div className="px-5 pb-4 flex gap-2 justify-end">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <SaveButton onClick={handleSave}>Guardar</SaveButton>
        </div>
      </div>
    </div>
  );
}

// ── Fila de categoría con swipe ───────────────────────────────────────────────
interface CatRowProps {
  cat: Category;
  spent: number;
  budget: number;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function CatRow({ cat, spent, budget, disabled, onEdit, onDelete }: CatRowProps) {
  const pct  = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const over = budget > 0 && spent > budget;
  const warn = budget > 0 && pct >= 80 && !over;
  const cc   = CAT_COLORS[cat] || { dot: "#A8A49E", text: "#7A7770" };

  // ── Swipe refs ───────────────────────────────────────────────────────────────
  const touchStartX  = useRef(0);
  const touchStartY  = useRef(0);
  const swipeDxRef   = useRef(0);
  const isSwipingRef = useRef(false);
  const isHorizRef   = useRef<boolean | null>(null);
  const rowRef       = useRef<HTMLDivElement>(null);
  const deleteRef    = useRef<HTMLDivElement>(null);
  const editRef      = useRef<HTMLDivElement>(null);

  function applySwipe(dx: number) {
    const clamped = Math.max(-100, Math.min(80, dx));
    swipeDxRef.current = clamped;
    if (rowRef.current)    { rowRef.current.style.transform = `translateX(${clamped}px)`; rowRef.current.style.transition = "none"; }
    if (deleteRef.current) { deleteRef.current.style.width = `${Math.max(0, -clamped)}px`; deleteRef.current.style.transition = "none"; }
    if (editRef.current)   { editRef.current.style.width   = `${Math.max(0, clamped)}px`;  editRef.current.style.transition = "none"; }
  }

  function snapBack() {
    const SPRING = "0.32s cubic-bezier(0.34,1.56,0.64,1)";
    const EASE   = "0.32s cubic-bezier(0.4,0,0.2,1)";
    if (rowRef.current)    { rowRef.current.style.transform = "translateX(0px)"; rowRef.current.style.transition = `transform ${SPRING}`; }
    if (deleteRef.current) { deleteRef.current.style.width  = "0px"; deleteRef.current.style.transition = `width ${EASE}`; }
    if (editRef.current)   { editRef.current.style.width    = "0px"; editRef.current.style.transition   = `width ${EASE}`; }
  }

  function onTouchStart(e: React.TouchEvent) {
    if (disabled) return;
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizRef.current  = null;
    isSwipingRef.current = true;
    swipeDxRef.current  = 0;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isSwipingRef.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (isHorizRef.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizRef.current = Math.abs(dx) > Math.abs(dy);
    }
    if (isHorizRef.current === false) { isSwipingRef.current = false; snapBack(); return; }
    if (isHorizRef.current) { e.stopPropagation(); applySwipe(dx); }
  }

  function onTouchEnd() {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const dx = swipeDxRef.current;
    snapBack();
    if (dx < -70) onDelete();
    else if (dx > 55) onEdit();
  }

  return (
    <div className="relative overflow-hidden border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      {/* Delete reveal */}
      <div ref={deleteRef} className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
        <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
          <XIcon size={13} /><span className="text-[9px] font-semibold whitespace-nowrap">Eliminar</span>
        </div>
      </div>
      {/* Edit reveal */}
      <div ref={editRef} className="absolute inset-y-0 left-0 bg-brand-blue flex items-center justify-center overflow-hidden z-10" style={{ width: "0px" }}>
        <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
          <PencilIcon size={13} /><span className="text-[9px] font-semibold whitespace-nowrap">Editar</span>
        </div>
      </div>
      {/* Row */}
      <div
        ref={rowRef}
        className="px-4 py-2.5 relative z-20 bg-white dark:bg-neutral-900"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cc.dot }} />
          <span className="text-xs font-medium flex-1" style={{ color: cc.text }}>{cat}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {fmtEur(spent)}
            {budget > 0 && <span className="text-neutral-400 dark:text-neutral-600"> / {fmtEur(budget)}</span>}
          </span>
          {budget > 0 && (
            <span className={`text-[10px] font-medium w-8 text-right ${over ? "text-brand-red" : warn ? "text-brand-amber" : "text-brand-green"}`}>
              {pct}%
            </span>
          )}
          {!disabled && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={onEdit}
                title="Editar"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
                  text-neutral-400 hover:text-brand-blue hover:border-blue-300 dark:hover:border-blue-700
                  hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-90"
              >
                <PencilIcon size={11} />
              </button>
              {budget > 0 && (
                <button
                  onClick={onDelete}
                  title="Eliminar"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
                    text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
                    hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90"
                >
                  <XIcon size={11} />
                </button>
              )}
            </div>
          )}
        </div>
        {budget > 0 && <Bar pct={pct} over={over} warn={warn} />}
        {over && <p className="text-[10px] text-brand-red mt-0.5">+{fmtEur(spent - budget)} sobre el límite</p>}
      </div>
    </div>
  );
}

// ── Panel principal ───────────────────────────────────────────────────────────
export function CategoryBudgetPanel({
  year, month, varExpenses, budgets, varBudget, disabled, onChange, onVarBudgetChange,
}: Props) {
  const lsKey = "budget_panel_open";
  const [open, setOpen]                 = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Category | "global" | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [measured, setMeasured]  = useState(false);

  const { categories } = useCategories();
  const { theme, season } = useTheme();
  const cfg = theme === "season" ? SEASON_CONFIG[season] : null;

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}
    const el = innerRef.current;
    if (!el) return;
    setNaturalHeight(el.scrollHeight);
    setMeasured(true);
    const ro = new ResizeObserver(() => setNaturalHeight(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  const paidVarExpenses = varExpenses.filter(e => e.paid !== false);
  const spending: Record<string, number> = {};
  for (const e of paidVarExpenses) {
    const cat = e.category || "Otro";
    spending[cat] = (spending[cat] || 0) + e.amount;
  }
  const varTotal = paidVarExpenses.reduce((a, e) => a + e.amount, 0);

  const globalPct  = varBudget > 0 ? Math.round((varTotal / varBudget) * 100) : 0;
  const globalOver = varBudget > 0 && varTotal > varBudget;
  const globalWarn = varBudget > 0 && globalPct >= 80 && !globalOver;

  const activeCats = categories.filter(c => spending[c] > 0 || budgets.find(b => b.category === c));
  const usedCats   = budgets.map(b => b.category);

  const definedCount = budgets.length + (varBudget > 0 ? 1 : 0);

  const collapseHeight = measured
    ? open ? naturalHeight + "px" : "0px"
    : open ? "auto" : "0px";

  function openEdit(key: Category | "global") {
    if (disabled) { toast("Tu prueba ha terminado. Activa un plan para continuar.", "info"); return; }
    setEditTarget(key);
    setShowModal(true);
  }

  function openAddCat() {
    if (disabled) { toast("Tu prueba ha terminado. Activa un plan para continuar.", "info"); return; }
    setEditTarget(null);
    setShowModal(true);
  }

  async function handleModalSave(cat: Category | null, value: number) {
    if (cat === null) {
      // Presupuesto global
      await saveMonthConfig(year, month, value);
      onVarBudgetChange(value);
    } else {
      await saveCategoryBudget(year, month, cat, value);
      const next = budgets.filter(b => b.category !== cat);
      if (value > 0) next.push({ category: cat, budget: value });
      onChange(next);
    }
    setShowModal(false);
    setEditTarget(null);
  }

  async function handleDeleteCat(cat: Category) {
    await deleteCategoryBudget(year, month, cat);
    onChange(budgets.filter(b => b.category !== cat));
  }

  async function handleImportTemplate() {
    if (disabled) { toast("Tu prueba ha terminado. Activa un plan para continuar.", "info"); return; }
    const items: BudgetTemplateItem[] = await loadBudgetTemplate();
    if (items.length === 0) { toast("La plantilla está vacía. Edítala primero.", "info"); return; }
    await importBudgetTemplate(year, month, items, onVarBudgetChange);
    const catItems = items.filter(i => i.category !== "__global__");
    const next: CategoryBudget[] = catItems.map(i => ({ category: i.category as Category, budget: i.budget }));
    // Merge: mantener los que ya existen si no están en la plantilla
    const merged = [...budgets];
    for (const item of next) {
      if (!merged.find(b => b.category === item.category)) merged.push(item);
    }
    onChange(merged);
    toast("Plantilla importada correctamente", "success");
  }

  return (
    <>
      {/* Modales */}
      {showModal && (
        <BudgetModal
          category={editTarget === "global" ? null : editTarget}
          currentValue={
            editTarget === "global" ? varBudget
            : editTarget ? (budgets.find(b => b.category === editTarget)?.budget ?? 0)
            : 0
          }
          categories={categories}
          usedCategories={usedCats}
          onSave={handleModalSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
      {showTemplate && <BudgetTemplateManager onClose={() => setShowTemplate(false)} />}

      <div className="card mb-4 mt-4" data-tour="budget-panel" style={cfg ? { background: cfg.cardBg, borderColor: cfg.cardBorder } : undefined}>
        {/* ── Header ── */}
        <button
          type="button" onClick={toggle}
          className="w-full flex items-center justify-between px-4 py-4
            hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors
            border-b border-neutral-100 dark:border-neutral-800"
          style={cfg ? { borderColor: cfg.rowBorder } : undefined}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-purple" />
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200" style={cfg ? { color: cfg.titleColor } : undefined}>Presupuestos</span>
            {definedCount > 0 && (
              <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-800 rounded-full px-1.5 py-0.5 leading-none">
                {definedCount}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-neutral-300 dark:text-neutral-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Animated collapse */}
        <div style={{ height: collapseHeight, overflow: "hidden", transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
          <div ref={innerRef}>

            {/* ── Action bar ── */}
            <div className="flex gap-2 px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
              {[
                { label: "Añadir",    icon: <PlusIcon size={11} />,    onClick: openAddCat,                          accent: true  },
                { label: "Plantilla", icon: <TemplateIcon />,           onClick: () => !disabled && setShowTemplate(true), accent: false },
                { label: "Importar",  icon: <ImportIcon />,             onClick: handleImportTemplate,                accent: false },
              ].map(({ label, icon, onClick, accent }) => (
                <button
                  key={label}
                  onClick={onClick}
                  disabled={disabled}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg border transition-all
                    ${accent
                      ? "text-brand-purple border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/20"
                      : "text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"}
                    ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 active:scale-[0.98]"}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* ── Presupuesto global ── */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Presupuesto mensual de gastos variables
                </span>
                <button
                  onClick={() => openEdit("global")}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg
                    text-brand-blue bg-brand-blue-light dark:bg-blue-950/60
                    hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors
                    ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {varBudget > 0 ? <><PencilIcon size={10} /> Editar</> : <><PlusIcon size={10} /> Definir</>}
                </button>
              </div>

              {varBudget > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs ${globalOver ? "text-brand-red" : globalWarn ? "text-brand-amber" : "text-brand-green"} font-medium`}>
                      {fmtEur(varTotal)} gastado de {fmtEur(varBudget)}
                    </span>
                    <span className={`text-xs font-medium ${globalOver ? "text-brand-red" : globalWarn ? "text-brand-amber" : "text-brand-green"}`}>
                      {globalPct}%
                    </span>
                  </div>
                  <Bar pct={globalPct} over={globalOver} warn={globalWarn} />
                  {globalOver && <p className="text-[11px] text-brand-red mt-1">+{fmtEur(varTotal - varBudget)} sobre el presupuesto</p>}
                </>
              ) : (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                  Sin presupuesto definido — pulsa Definir para añadir uno
                </p>
              )}
            </div>

            {/* ── Categorías ── */}
            {activeCats.length > 0 && (
              <div>
                {activeCats.map(cat => (
                  <CatRow
                    key={cat}
                    cat={cat}
                    spent={spending[cat] || 0}
                    budget={budgets.find(b => b.category === cat)?.budget ?? 0}
                    disabled={disabled}
                    onEdit={() => openEdit(cat)}
                    onDelete={() => handleDeleteCat(cat)}
                  />
                ))}
              </div>
            )}

            {activeCats.length === 0 && definedCount === 0 && (
              <p className="px-4 py-4 text-xs text-neutral-400 dark:text-neutral-500 italic text-center">
                Sin límites por categoría — pulsa Añadir o importa una plantilla
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PencilIcon({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function XIcon({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function PlusIcon({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function TemplateIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17.5 14v7"/></svg>;
}
function ImportIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
