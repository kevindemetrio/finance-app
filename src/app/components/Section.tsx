"use client";

import { useEffect, useState } from "react";
import { Entry, fmtEur } from "../lib/data";
import { EntryRow } from "./EntryRow";
import { AddEntryModal } from "./AddEntryModal";

interface Props {
  title: string;
  dotColor: string;
  totalColor: string;
  sign: "+" | "−";
  entries: Entry[];
  showPaid?: boolean;
  showCategory?: boolean;
  showDate?: boolean;
  showNotes?: boolean;
  showName?: boolean;
  emptyMessage?: string;
  headerAfter?: React.ReactNode;
  bodyHeader?: React.ReactNode;
  storageKey: string;
  onAdd: (entry: Entry) => void;
  onUpdate: (idx: number, updated: Entry) => void;
  onDelete: (idx: number) => void;
}

export function Section({
  title, dotColor, totalColor, sign, entries, showPaid, showCategory,
  showDate, showNotes, showName,
  emptyMessage, headerAfter, bodyHeader, storageKey, onAdd, onUpdate, onDelete,
}: Props) {
  const lsKey = `section_open_${storageKey}`;
  const [open, setOpen]         = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(lsKey); if (s !== null) setOpen(s === "true"); } catch {}
  }, [lsKey]);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  const total = entries.reduce((a, i) => a + i.amount, 0);

  return (
    <>
      {showModal && (
        <AddEntryModal
          title={title} showCategory={showCategory} showPaid={showPaid}
          onAdd={onAdd} onClose={() => setShowModal(false)}
        />
      )}

      <div className="card">
        <button type="button" onClick={toggle}
          className="w-full flex items-center justify-between px-4 py-3.5
            border-b border-neutral-100 dark:border-neutral-800
            hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span className="text-sm font-medium">{title}</span>
            {entries.length > 0 && <span className="text-xs text-neutral-400 dark:text-neutral-600">{entries.length}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${totalColor}`}>{sign}{fmtEur(total)}</span>
            <svg className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>

        {open && (
          <>
            {headerAfter}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 flex-wrap">
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 text-sm text-brand-blue border border-brand-blue
                  rounded-lg px-3 py-1.5 hover:bg-brand-blue-light dark:hover:bg-blue-950 transition-colors"
              >
                <PlusIcon /> Añadir
              </button>
              {bodyHeader}
            </div>

            {entries.length === 0 ? (
              <div className="px-4 py-10 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <PlusIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                    {emptyMessage || `Sin ${title.toLowerCase()} este mes`}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
                    Pulsa Añadir para registrar el primero
                  </p>
                </div>
                <button onClick={() => setShowModal(true)}
                  className="text-xs font-medium text-brand-blue border border-brand-blue
                    rounded-lg px-4 py-1.5 hover:bg-brand-blue-light dark:hover:bg-blue-950 transition-colors"
                >
                  + Añadir {title.toLowerCase()}
                </button>
              </div>
            ) : (
              [...entries]
                .map((entry, idx) => ({ entry, idx }))
                .sort((a, b) => (b.entry.date ?? "").localeCompare(a.entry.date ?? ""))
                .map(({ entry, idx }) => (
                  <EntryRow key={entry.id} entry={entry} sign={sign} colorClass={totalColor}
                    showPaid={showPaid} showCategory={showCategory}
                    showDate={showDate} showNotes={showNotes} showName={showName}
                    onUpdate={updated => onUpdate(idx, updated)}
                    onDelete={() => onDelete(idx)}
                  />
                ))
            )}
          </>
        )}
      </div>
    </>
  );
}

function PlusIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
