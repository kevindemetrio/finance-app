"use client";

import { useEffect, useRef, useState } from "react";
import { Category, Entry, todayStr } from "../lib/data";
import { GhostButton, PrimaryButton, TextInput } from "./ui";
import { useCategories } from "./CategoriesProvider";

interface Props {
  entry: Entry;
  showCategory?: boolean;
  showPaid?: boolean;
  onSave: (updated: Entry) => void;
  onClose: () => void;
}

export function EditEntryModal({ entry, showCategory, showPaid, onSave, onClose }: Props) {
  const { categories } = useCategories();
  const [name, setName]         = useState(entry.name);
  const [amount, setAmount]     = useState(String(entry.amount));
  const [date, setDate]         = useState(entry.date ?? todayStr());
  const [category, setCategory] = useState(entry.category ?? "");
  const [notes, setNotes]       = useState(entry.notes ?? "");
  const [paid, setPaid]         = useState(entry.paid ?? false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave() {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a)) return;
    onSave({
      ...entry,
      name: name.trim(),
      amount: a,
      date,
      category: (category as Category) || undefined,
      notes: notes.trim() || undefined,
      paid: showPaid ? paid : entry.paid,
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
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Editar movimiento</p>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Descripción</label>
            <TextInput
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Supermercado, Netflix..."
              className="w-full"
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Importe €</label>
              <TextInput
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0,00"
                step="0.01"
                className="w-full"
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Fecha</label>
              <TextInput
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {showCategory && (
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Categoría</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input-base w-full"
              >
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {showPaid && (
            <div>
              <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">Estado</label>
              <select
                value={paid ? "1" : "0"}
                onChange={e => setPaid(e.target.value === "1")}
                className="input-base w-full"
              >
                <option value="0">Pendiente</option>
                <option value="1">Cobrado</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
              Nota <span className="text-neutral-300 dark:text-neutral-600">(opcional)</span>
            </label>
            <TextInput
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: cena cumpleaños de Marina, vuelo Copenhagen ida..."
              className="w-full"
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton onClick={handleSave}>Guardar cambios</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
