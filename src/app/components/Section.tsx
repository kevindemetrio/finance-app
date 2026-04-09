"use client";

import { useEffect, useRef, useState } from "react";
import { Entry, fmtEur } from "../lib/data";
import { EntryRow } from "./EntryRow";
import { AddEntryModal } from "./AddEntryModal";

interface Props {
  title: string;
  dotColor: string;
  totalColor: string;
  accentHex?: string;
  sign: "+" | "−";
  entries: Entry[];
  showPaid?: boolean;
  defaultPaid?: boolean;
  showCategory?: boolean;
  showDate?: boolean;
  showNotes?: boolean;
  showName?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  headerAfter?: React.ReactNode;
  bodyHeader?: React.ReactNode;
  storageKey: string;
  tourId?: string;
  /** Controla si el modal AddEntry muestra el campo "estado de pago". Por defecto true. */
  formShowPaid?: boolean;
  /** Controla si el modal AddEntry muestra el selector de categoría. Por defecto true. */
  formShowCategory?: boolean;
  onAdd: (entry: Entry) => void;
  onUpdate: (idx: number, updated: Entry) => void;
  onDelete: (idx: number) => void;
}

export function Section({
  title, dotColor, totalColor, accentHex, sign, entries, showPaid, defaultPaid, showCategory,
  showDate, showNotes, showName, disabled,
  emptyMessage, headerAfter, bodyHeader, storageKey, tourId,
  formShowPaid, formShowCategory,
  onAdd, onUpdate, onDelete,
}: Props) {
  const lsKey = `section_open_${storageKey}`;
  const [open, setOpen]          = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Animated collapse — track the inner content's natural height
  const innerRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [measured, setMeasured]  = useState(false);

  // Single effect: load localStorage state + start ResizeObserver together
  useEffect(() => {
    try {
      const s = localStorage.getItem(lsKey);
      if (s !== null) setOpen(s === "true");
    } catch {}

    const el = innerRef.current;
    if (!el) return;
    setNaturalHeight(el.scrollHeight);
    setMeasured(true);
    const ro = new ResizeObserver(() => setNaturalHeight(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey]);

  function toggle() {
    setOpen(prev => {
      const next = !prev;
      try { localStorage.setItem(lsKey, String(next)); } catch {}
      return next;
    });
  }

  const total      = entries.reduce((a, i) => a + i.amount, 0);
  const shownTotal = sign === "−" ? Math.abs(total) : total;
  const shownSign  = sign === "+" && total < 0 ? "" : sign;

  const collapseHeight = measured
    ? open ? naturalHeight + "px" : "0px"
    : open ? "auto" : "0px";

  return (
    <>
      {showModal && (
        <AddEntryModal
          title={title}
          showCategory={formShowCategory ?? true}
          showPaid={formShowPaid ?? true}
          defaultPaid={defaultPaid}
          onAdd={onAdd}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="card" {...(tourId ? { "data-tour": tourId } : {})}>
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center justify-between px-4 py-4
            border-b border-neutral-100 dark:border-neutral-800
            hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={accentHex ? "w-2.5 h-2.5 rounded-full" : `w-2.5 h-2.5 rounded-full ${dotColor}`}
              style={accentHex ? { background: accentHex } : undefined}
            />
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</span>
            {entries.length > 0 && (
              <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600
                bg-neutral-100 dark:bg-neutral-800 rounded-full px-1.5 py-0.5 leading-none">
                {entries.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-semibold ${accentHex ? "" : totalColor}`}
              style={accentHex ? { color: accentHex } : undefined}
            >
              {shownSign}{fmtEur(shownTotal)}
            </span>
            <svg
              className={`w-4 h-4 text-neutral-300 dark:text-neutral-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Animated collapse wrapper */}
        <div
          style={{
            height: collapseHeight,
            overflow: "hidden",
            transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div ref={innerRef}>
            {headerAfter}

            {/* Action bar — always at the top of expanded content */}
            <div className="flex border-b border-neutral-100 dark:border-neutral-800 divide-x divide-neutral-100 dark:divide-neutral-800">
              <button
                onClick={() => { if (!disabled) setShowModal(true); }}
                disabled={disabled}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors
                  ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40 active:scale-[0.98]"}`}
                style={accentHex ? { color: accentHex } : { color: "#6b7280" }}
              >
                <PlusIcon size={11} />
                Añadir
              </button>
              {bodyHeader}
            </div>

            {entries.length === 0 ? (
              <div className="px-4 py-10 text-center flex flex-col items-center gap-3 bg-neutral-50/40 dark:bg-neutral-800/10">
                <div className={`w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-300 dark:text-neutral-600 ${disabled ? "opacity-40" : ""}`}>
                  <PlusIcon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
                    {emptyMessage || `Sin ${title.toLowerCase()} este mes`}
                  </p>
                  <p className="text-xs text-neutral-300 dark:text-neutral-700 mt-0.5">
                    {disabled ? "Solo lectura en tu plan actual" : "Pulsa Añadir para registrar el primero"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-50/30 dark:bg-neutral-800/10">
                {[...entries]
                  .map((entry, idx) => ({ entry, idx }))
                  .sort((a, b) => (b.entry.date ?? "").localeCompare(a.entry.date ?? ""))
                  .map(({ entry, idx }) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      sign={sign}
                      colorClass={accentHex ? "" : totalColor}
                      accentHex={accentHex}
                      showPaid={showPaid}
                      showCategory={showCategory}
                      showDate={showDate}
                      showNotes={showNotes}
                      showName={showName}
                      readOnly={disabled}
                      onUpdate={updated => onUpdate(idx, updated)}
                      onDelete={() => onDelete(idx)}
                    />
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PlusIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
