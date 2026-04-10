"use client";

import { useEffect, useRef, useState } from "react";
import { Category, Entry, todayStr, uid } from "../lib/data";
import { GhostButton, TextInput } from "./ui";
import { useCategories } from "./CategoriesProvider";

type SectionKey = "incomes" | "savings" | "fixedExpenses" | "varExpenses";

const TYPES: { key: SectionKey; label: string; color: string; sign: string }[] = [
  { key: "incomes",       label: "Ingreso",        color: "#1D9E75", sign: "+" },
  { key: "savings",       label: "Ahorro",          color: "#378ADD", sign: "+" },
  { key: "fixedExpenses", label: "Gasto fijo",      color: "#BA7517", sign: "−" },
  { key: "varExpenses",   label: "Gasto variable",  color: "#E24B4A", sign: "−" },
];

interface Props {
  onAdd: (type: SectionKey, entry: Entry) => void;
  onClose: () => void;
}

export function QuickAddModal({ onAdd, onClose }: Props) {
  const { categories } = useCategories();
  const [selectedType, setSelectedType] = useState<SectionKey>("incomes");
  const [name, setName]         = useState("");
  const [amount, setAmount]     = useState("");
  const [date, setDate]         = useState(todayStr());
  const [category, setCategory] = useState("");
  const [notes, setNotes]       = useState("");
  const [paid, setPaid]         = useState(true);
  const nameRef = useRef<HTMLInputElement>(null);

  const current = TYPES.find(t => t.key === selectedType)!;
  const showCategory = selectedType === "fixedExpenses" || selectedType === "varExpenses";
  const showPaid     = selectedType === "fixedExpenses" || selectedType === "varExpenses";

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Reset form fields (not type) when type changes
  useEffect(() => {
    setName(""); setAmount(""); setDate(todayStr());
    setCategory(""); setNotes(""); setPaid(true);
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [selectedType]);

  function handleAdd() {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a) || a <= 0) return;
    onAdd(selectedType, {
      id: uid(), name: name.trim(), amount: a, date,
      category: (category as Category) || undefined,
      notes: notes.trim() || undefined,
      paid: showPaid ? paid : undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Añadir movimiento</p>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none transition-colors">×</button>
        </div>

        {/* Type selector */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800">
          {TYPES.map(t => {
            const active = selectedType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedType(t.key)}
                className="flex-1 flex flex-col items-center pt-3 pb-2.5 text-[11px] font-semibold transition-all"
                style={active ? {
                  color: t.color,
                  borderBottom: `2px solid ${t.color}`,
                  background: `${t.color}0a`,
                } : {
                  color: "#9ca3af",
                  borderBottom: "2px solid transparent",
                }}
              >
                <span className="text-lg font-bold leading-none mb-0.5">{t.sign}</span>
                <span className="leading-tight text-center">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Descripción</label>
            <TextInput
              ref={nameRef}
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Supermercado, Netflix..."
              className="w-full"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Importe €</label>
              <TextInput
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0,00" min="0" step="0.01" className="w-full"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Fecha</label>
              <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full" />
            </div>
          </div>

          {showCategory && (
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-base w-full">
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {showPaid && (
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Estado</label>
              <select value={paid ? "1" : "0"} onChange={e => setPaid(e.target.value === "1")} className="input-base w-full">
                <option value="0">Pendiente</option>
                <option value="1">Pagado</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              Nota <span className="text-neutral-300 dark:text-neutral-600">(opcional)</span>
            </label>
            <TextInput
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ej: cena cumpleaños de Marina..."
              className="w-full"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: current.color }}
          >
            Añadir {current.label.toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
