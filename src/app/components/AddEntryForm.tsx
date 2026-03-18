"use client";

import { useState } from "react";
import { CATEGORIES, Entry, todayStr, uid } from "../lib/data";
import { PrimaryButton, TextInput } from "./ui";

interface Props {
  placeholder?: string;
  showCategory?: boolean;
  onAdd: (entry: Entry) => void;
}

export function AddEntryForm({ placeholder = "Descripción", showCategory, onAdd }: Props) {
  const [name, setName]       = useState("");
  const [amount, setAmount]   = useState("");
  const [date, setDate]       = useState(todayStr());
  const [category, setCategory] = useState("");
  const [notes, setNotes]     = useState("");
  const [showNotes, setShowNotes] = useState(false);

  function handleAdd() {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a) || a <= 0) return;
    onAdd({
      id: uid(), name: name.trim(), amount: a, date,
      category: category as never || undefined,
      notes: notes.trim() || undefined,
    });
    setName(""); setAmount(""); setDate(todayStr());
    setCategory(""); setNotes(""); setShowNotes(false);
  }

  return (
    <div className="border-b border-neutral-100 dark:border-neutral-800">
      <div className="flex flex-wrap gap-2 px-4 py-3">
        <TextInput
          value={name} onChange={e => setName(e.target.value)}
          placeholder={placeholder} className="flex-1 min-w-[120px]"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <TextInput
          type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Importe €" min="0" step="0.01" className="w-28"
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-36" />
        {showCategory && (
          <select value={category} onChange={e => setCategory(e.target.value)} className="input-base w-36">
            <option value="">Categoría</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={() => setShowNotes(s => !s)}
          title="Añadir nota"
          className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors
            ${showNotes
              ? "border-brand-blue text-brand-blue bg-brand-blue-light dark:bg-blue-950"
              : "border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
        >
          <NoteIcon />
        </button>
        <PrimaryButton onClick={handleAdd}>Añadir</PrimaryButton>
      </div>
      {showNotes && (
        <div className="px-4 pb-3">
          <TextInput
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Nota — ej: cena cumpleaños de Marina, vuelo Copenhagen ida..."
            className="w-full"
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
