"use client";

import { Entry, fmtEur } from "../lib/data";
import { EntryRow } from "./EntryRow";
import { AddEntryForm } from "./AddEntryForm";

interface Props {
  title: string;
  dotColor: string;
  totalColor: string;
  sign: "+" | "−";
  entries: Entry[];
  showPaid?: boolean;
  addPlaceholder?: string;
  headerExtra?: React.ReactNode;
  headerAfter?: React.ReactNode;
  onAdd: (entry: Entry) => void;
  onUpdate: (idx: number, updated: Entry) => void;
  onDelete: (idx: number) => void;
}

export function Section({
  title, dotColor, totalColor, sign, entries, showPaid,
  addPlaceholder, headerExtra, headerAfter, onAdd, onUpdate, onDelete,
}: Props) {
  const total = entries.reduce((a, i) => a + i.amount, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <span className={`text-sm font-medium ${totalColor}`}>
            {sign}{fmtEur(total)}
          </span>
        </div>
      </div>

      {headerAfter}

      <AddEntryForm placeholder={addPlaceholder} onAdd={onAdd} />

      {[...entries]
        .map((entry, idx) => ({ entry, idx }))
        .sort((a, b) => (b.entry.date ?? "").localeCompare(a.entry.date ?? ""))
        .map(({ entry, idx }) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            sign={sign}
            colorClass={totalColor}
            showPaid={showPaid}
            onUpdate={(updated) => onUpdate(idx, updated)}
            onDelete={() => onDelete(idx)}
          />
        ))}

      
    </div>
  );
}
