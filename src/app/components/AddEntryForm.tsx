"use client";

import { useState } from "react";
import { CATEGORIES, Entry, todayStr, uid } from "../lib/data";
import { PrimaryButton, TextInput } from "./ui";

interface Props {
  placeholder?: string;
  showCategory?: boolean;
  showRecurring?: boolean;
  onAdd: (entry: Entry) => void;
}

export function AddEntryForm({ placeholder = "Descripción", showCategory, showRecurring, onAdd }: Props) {
  const [name, setName]           = useState("");
  const [amount, setAmount]       = useState("");
  const [date, setDate]           = useState(todayStr());
  const [category, setCategory]   = useState("");
  const [recurring, setRecurring] = useState(false);

  function handleAdd() {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a) || a <= 0) return;
    onAdd({ id: uid(), name: name.trim(), amount: a, date, category: category as never || undefined, recurring });
    setName(""); setAmount(""); setDate(todayStr()); setCategory(""); setRecurring(false);
  }

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
      <TextInput value={name} onChange={e => setName(e.target.value)} placeholder={placeholder} className="flex-1 min-w-[120px]" onKeyDown={e => e.key==="Enter" && handleAdd()} />
      <TextInput type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Importe €" min="0" step="0.01" className="w-28" onKeyDown={e => e.key==="Enter" && handleAdd()} />
      <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-36" />
      {showCategory && (
        <select value={category} onChange={e => setCategory(e.target.value)} className="input-base w-36">
          <option value="">Categoría</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      {showRecurring && (
        <label className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap self-center">
          <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="rounded" />
          Recurrente
        </label>
      )}
      <PrimaryButton onClick={handleAdd}>Añadir</PrimaryButton>
    </div>
  );
}
