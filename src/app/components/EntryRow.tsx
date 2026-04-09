"use client";

import { useRef, useState } from "react";
import { Entry, fmtDate, fmtEur } from "../lib/data";
import { Badge } from "./ui";
import { EditEntryModal } from "./EditEntryModal";

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

export function EntryRow({
  entry, sign, colorClass, accentHex, showPaid, showCategory,
  showDate = true, showNotes = true, showName = true, readOnly, onUpdate, onDelete,
}: Props) {
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Swipe-to-reveal (touch only) ──────────────────────────────────────────
  const touchStartX  = useRef(0);
  const touchStartY  = useRef(0);
  const swipeDxRef   = useRef(0);
  const isSwipingRef = useRef(false);
  const isHorizRef   = useRef<boolean | null>(null);

  // Refs for direct DOM manipulation — avoids re-renders during drag
  const rowContentRef   = useRef<HTMLDivElement>(null);
  const deleteRevealRef = useRef<HTMLDivElement>(null);
  const editRevealRef   = useRef<HTMLDivElement>(null);

  function applySwipe(dx: number) {
    const clamped = Math.max(-120, Math.min(80, dx));
    swipeDxRef.current = clamped;
    if (rowContentRef.current) {
      rowContentRef.current.style.transform   = `translateX(${clamped}px)`;
      rowContentRef.current.style.transition  = "none";
    }
    if (deleteRevealRef.current) {
      deleteRevealRef.current.style.width     = `${Math.max(0, -clamped)}px`;
      deleteRevealRef.current.style.transition = "none";
    }
    if (editRevealRef.current) {
      editRevealRef.current.style.width       = `${Math.max(0, clamped)}px`;
      editRevealRef.current.style.transition  = "none";
    }
  }

  function snapBack() {
    const SPRING = "0.32s cubic-bezier(0.34,1.56,0.64,1)";
    const EASE   = "0.32s cubic-bezier(0.4,0,0.2,1)";
    if (rowContentRef.current) {
      rowContentRef.current.style.transform  = "translateX(0px)";
      rowContentRef.current.style.transition = `transform ${SPRING}`;
    }
    if (deleteRevealRef.current) {
      deleteRevealRef.current.style.width      = "0px";
      deleteRevealRef.current.style.transition = `width ${EASE}`;
    }
    if (editRevealRef.current) {
      editRevealRef.current.style.width      = "0px";
      editRevealRef.current.style.transition = `width ${EASE}`;
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    if (readOnly) return;
    e.stopPropagation();
    touchStartX.current  = e.touches[0].clientX;
    touchStartY.current  = e.touches[0].clientY;
    isHorizRef.current   = null;
    isSwipingRef.current = true;
    swipeDxRef.current   = 0;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isSwipingRef.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (isHorizRef.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizRef.current = Math.abs(dx) > Math.abs(dy);
    }

    if (isHorizRef.current === false) {
      isSwipingRef.current = false;
      snapBack();
      return;
    }

    if (isHorizRef.current) {
      e.stopPropagation();
      applySwipe(dx);
    }
  }

  function onTouchEnd() {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const dx = swipeDxRef.current;
    snapBack();

    if (dx < -80) {
      onDelete();
    } else if (dx > 60) {
      setShowEditModal(true);
    }
  }

  // B5: negative amount display
  const displaySign   = sign === "+" && entry.amount < 0 ? "−" : sign;
  const displayAmount = Math.abs(entry.amount);
  const displayColor  = sign === "+" && entry.amount < 0 ? "text-brand-red" : (accentHex ? "" : colorClass);

  return (
    <div>
      {showEditModal && !readOnly && (
        <EditEntryModal
          entry={entry}
          showCategory={showCategory}
          showPaid={showPaid}
          onSave={onUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Swipe container */}
      <div className="relative overflow-hidden">

        {/* Delete reveal (right side, shown on left-swipe) */}
        <div
          ref={deleteRevealRef}
          className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center overflow-hidden z-10"
          style={{ width: "0px" }}
        >
          <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
            <XIcon />
            <span className="text-[9px] font-semibold whitespace-nowrap">Eliminar</span>
          </div>
        </div>

        {/* Edit reveal (left side, shown on right-swipe) */}
        <div
          ref={editRevealRef}
          className="absolute inset-y-0 left-0 bg-brand-blue flex items-center justify-center overflow-hidden z-10"
          style={{ width: "0px" }}
        >
          <div className="flex flex-col items-center gap-0.5 text-white px-3 pointer-events-none">
            <PencilIcon />
            <span className="text-[9px] font-semibold whitespace-nowrap">Editar</span>
          </div>
        </div>

        {/* Sliding row content */}
        <div
          ref={rowContentRef}
          className="group flex items-start gap-2 px-4 py-3 text-sm
            border-b border-neutral-100/70 dark:border-neutral-800/50 last:border-0
            hover:bg-white dark:hover:bg-neutral-800/40 transition-colors relative z-20 bg-white dark:bg-neutral-900"
          style={{ touchAction: "pan-y" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
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
            <div className="flex items-center gap-1 pt-0.5">
              <button
                onClick={() => setShowEditModal(true)}
                title="Editar"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
                  text-neutral-400 hover:text-brand-blue hover:border-blue-300 dark:hover:border-blue-700
                  hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all active:scale-90"
              >
                <PencilIcon />
              </button>
              <button
                onClick={onDelete}
                title="Eliminar"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700
                  text-neutral-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-700
                  hover:bg-red-50 dark:hover:bg-red-950/40 transition-all active:scale-90"
              >
                <XIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PencilIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
