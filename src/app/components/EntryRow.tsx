"use client";

import { useState } from "react";
import { Category, Entry, fmtDate, fmtEur, todayStr } from "../lib/data";
import { Badge, GhostButton, IconButton, SaveButton, TextInput } from "./ui";
import { toast } from "./Toast";
import { useCategories } from "./CategoriesProvider";

interface Props {
  entry: Entry;
  sign: "+" | "−";
  colorClass: string;
  accentHex?: string;
  showPaid?: boolean;
  showCategory?: boolean;
  showDate?: boolean;
  showNotes?: boolean;
  showName?: boolean;
  readOnly?: boolean;
  onUpdate: (updated: Entry) => void;
  onDelete: () => void;
}

const CAT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Alimentación": { bg: "#E1F5EE", text: "#1D9E75", dot: "#6CC8A8" },
  "Ocio":         { bg: "#FCEBEB", text: "#C05B5A", dot: "#E09190" },
  "Tecnología":   { bg: "#EAF3DE", text: "#5A8A35", dot: "#8FBA6A" },
  "Transporte":   { bg: "#E6F1FB", text: "#4A80C4", dot: "#7AAEE0" },
  "Hogar":        { bg: "#E6F1FB", text: "#4A80C4", dot: "#7AAEE0" },
  "Salud":        { bg: "#E1F5EE", text: "#1D9E75", dot: "#6CC8A8" },
  "Ropa":         { bg: "#FBEAF0", text: "#B05878", dot: "#D98FAA" },
  "Regalos":      { bg: "#FBEAF0", text: "#B05878", dot: "#D98FAA" },
  "Educación":    { bg: "#EAF3DE", text: "#5A8A35", dot: "#8FBA6A" },
  "Viajes":       { bg: "#FAEEDA", text: "#C4862A", dot: "#E0B472" },
  "Otro":         { bg: "#F1EFE8", text: "#7A7770", dot: "#A8A49E" },
};

export function CategoryBadge({ cat }: { cat: string }) {
  const c = CAT_COLORS[cat] || { bg: "#F1EFE8", text: "#7A7770", dot: "#A8A49E" };
  return (
    <span style={{ background: c.bg, color: c.text }}
      className="text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0">
      {cat}
    </span>
  );
}

export function EntryRow({ entry, sign, colorClass, accentHex, showPaid, showCategory, showDate = true, showNotes = true, showName = true, readOnly, onUpdate, onDelete }: Props) {
  const { categories } = useCategories();
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(entry.name);
  const [amount, setAmount]     = useState(String(entry.amount));
  const [date, setDate]         = useState(entry.date ?? todayStr());
  const [paid, setPaid]         = useState(entry.paid ?? false);
  const [category, setCategory] = useState(entry.category ?? "");
  const [notes, setNotes]       = useState(entry.notes ?? "");

  function handleSave() {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a)) return;
    onUpdate({ ...entry, name: name.trim(), amount: a, date, paid, category: category as Category || undefined, notes: notes.trim() || undefined });
    setEditing(false);
    toast("Movimiento actualizado");
  }

  function handleCancel() {
    setName(entry.name); setAmount(String(entry.amount));
    setDate(entry.date ?? todayStr()); setPaid(entry.paid ?? false);
    setCategory(entry.category ?? ""); setNotes(entry.notes ?? "");
    setEditing(false);
  }

  // B5: negative amount display
  const displaySign   = sign === "+" && entry.amount < 0 ? "−" : sign;
  const displayAmount = Math.abs(entry.amount);
  const displayColor  = sign === "+" && entry.amount < 0 ? "text-brand-red" : (accentHex ? "" : colorClass);

  return (
    <div>
      <div className="group flex items-start gap-2 px-4 py-3 text-sm
        border-b border-neutral-100/70 dark:border-neutral-800/50 last:border-0
        hover:bg-white dark:hover:bg-neutral-800/40 transition-colors">
        <div className="flex-1 min-w-0 pt-0.5">
          {showName && <p className="text-neutral-800 dark:text-neutral-200 truncate leading-snug">{entry.name}</p>}
          {showNotes && entry.notes && (
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate leading-snug mt-0.5 italic">{entry.notes}</p>
          )}
        </div>
        {showDate && (
          <span className="text-[11px] text-neutral-300 dark:text-neutral-600 shrink-0 tabular-nums pt-0.5">{fmtDate(entry.date)}</span>
        )}
        {showCategory && entry.category && <span className="pt-0.5"><CategoryBadge cat={entry.category} /></span>}
        {showPaid && (
          <span className="pt-0.5">
            <Badge
              variant={entry.paid ? "paid" : "pending"}
              onClick={readOnly ? undefined : () => onUpdate({ ...entry, paid: !entry.paid })}
            />
          </span>
        )}
        <span
          className={`font-semibold text-right w-20 shrink-0 pt-0.5 ${displayColor}`}
          style={accentHex && entry.amount >= 0 ? { color: accentHex } : undefined}
        >
          {displaySign}{fmtEur(displayAmount)}
        </span>
        {!readOnly && (
          <div className="flex items-center pt-0.5">
            <IconButton onClick={() => setEditing(!editing)} title="Editar"><PencilIcon /></IconButton>
            <IconButton danger onClick={onDelete} title="Eliminar"><XIcon /></IconButton>
          </div>
        )}
      </div>

      {editing && !readOnly && (
        <div className="flex flex-wrap gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/40
          border-l-2 border-brand-blue border-b border-neutral-100 dark:border-neutral-800">
          <p className="w-full text-xs font-medium text-brand-blue mb-1">Editando: {entry.name}</p>
          <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="Descripción" className="flex-1 min-w-[120px]" />
          <TextInput type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Importe €" step="0.01" className="w-28" />
          <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} className="w-36" />
          {showCategory && (
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-base w-36">
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {showPaid && (
            <select value={paid ? "1" : "0"} onChange={e => setPaid(e.target.value === "1")} className="input-base w-32">
              <option value="0">Pendiente</option>
              <option value="1">Cobrado</option>
            </select>
          )}
          <TextInput value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nota (opcional)..." className="w-full" />
          <SaveButton onClick={handleSave} />
          <GhostButton onClick={handleCancel}>Cancelar</GhostButton>
        </div>
      )}
    </div>
  );
}

function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
