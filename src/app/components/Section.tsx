"use client";

import { useEffect, useState } from "react";
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
  storageKey: string;
  onAdd: (entry: Entry) => void;
  onUpdate: (idx: number, updated: Entry) => void;
  onDelete: (idx: number) => void;
}

export function Section({
  title, dotColor, totalColor, sign, entries, showPaid,
  addPlaceholder, headerExtra, headerAfter, storageKey,
  onAdd, onUpdate, onDelete,
}: Props) {
  const lsKey = `section_open_${storageKey}`;
  const [open, setOpen] = useState(true);

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(lsKey);
      if (stored !== null) setOpen(stored === "true");
    } catch {}
  }, [lsKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  const total = entries.reduce((a, i) => a + i.amount, 0);

  return (
    <div className="card">
      {/* Header — clickable to collapse */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3.5
          border-b border-neutral-100 dark:border-neutral-800
          hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-neutral-400 dark:text-neutral-600">
            {entries.length > 0 ? `${entries.length}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <span className={`text-sm font-medium ${totalColor}`}>
            {sign}{fmtEur(total)}
          </span>
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Collapsible body */}
      {open && (
        <>
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
        </>
      )}
    </div>
  );
}
