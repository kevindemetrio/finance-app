"use client";

import { useState } from "react";
import { Entry, fmtDate, fmtEur, todayStr } from "../lib/data";
import { Badge, GhostButton, IconButton, SaveButton, TextInput } from "./ui";

interface Props {
  entry: Entry;
  sign: "+" | "−";
  colorClass: string;
  showPaid?: boolean;
  onUpdate: (updated: Entry) => void;
  onDelete: () => void;
}

export function EntryRow({ entry, sign, colorClass, showPaid, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entry.name);
  const [amount, setAmount] = useState(String(entry.amount));
  const [date, setDate] = useState(entry.date ?? todayStr());
  const [paid, setPaid] = useState(entry.paid ?? false);

  function handleSave() {
    const a = parseFloat(amount);
    if (!name.trim() || isNaN(a) || a <= 0) return;
    onUpdate({ ...entry, name: name.trim(), amount: a, date, paid });
    setEditing(false);
  }

  function handleCancel() {
    setName(entry.name);
    setAmount(String(entry.amount));
    setDate(entry.date ?? todayStr());
    setPaid(entry.paid ?? false);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2.5 text-sm border-b border-neutral-100 dark:border-neutral-800 last:border-0">
        <span className="flex-1 text-neutral-800 dark:text-neutral-200 truncate">{entry.name}</span>
        <span className="text-[12px] text-neutral-400 dark:text-neutral-500 w-10 shrink-0">{fmtDate(entry.date)}</span>
        {showPaid && (
          <Badge
            variant={entry.paid ? "paid" : "pending"}
            onClick={() => onUpdate({ ...entry, paid: !entry.paid })}
          />
        )}
        <span className={`font-medium text-right w-24 shrink-0 ${colorClass}`}>
          {sign}{fmtEur(entry.amount)}
        </span>
        <IconButton onClick={() => setEditing(!editing)} title="Editar">
          <PencilIcon />
        </IconButton>
        <IconButton danger onClick={onDelete} title="Eliminar">
          <XIcon />
        </IconButton>
      </div>

      {editing && (
        <div className="flex flex-wrap gap-2 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Descripción" className="flex-1 min-w-[120px]" />
          <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Importe €" min="0" step="0.01" className="w-28" />
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-36" />
          {showPaid && (
            <select
              value={paid ? "1" : "0"}
              onChange={(e) => setPaid(e.target.value === "1")}
              className="input-base w-32"
            >
              <option value="0">Pendiente</option>
              <option value="1">Cobrado</option>
            </select>
          )}
          <SaveButton onClick={handleSave} />
          <GhostButton onClick={handleCancel}>✕</GhostButton>
        </div>
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
