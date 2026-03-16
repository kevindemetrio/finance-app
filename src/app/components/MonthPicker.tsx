"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTHS_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export function MonthPicker({ year, month, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => { setPickerYear(year); }, [year]);

  function select(m: number) {
    onChange(pickerYear, m);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl
          hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
      >
        <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          {MONTHS_FULL[month]} {year}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform group-hover:text-neutral-600 dark:group-hover:text-neutral-300 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50
          bg-white dark:bg-neutral-900
          border border-neutral-200 dark:border-neutral-700
          rounded-2xl shadow-lg shadow-neutral-200/60 dark:shadow-black/40
          p-4 w-72 select-none">

          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setPickerYear(y => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                hover:bg-neutral-100 dark:hover:bg-neutral-800
                text-neutral-500 dark:text-neutral-400
                hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >‹</button>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{pickerYear}</span>
            <button
              onClick={() => setPickerYear(y => y + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                hover:bg-neutral-100 dark:hover:bg-neutral-800
                text-neutral-500 dark:text-neutral-400
                hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >›</button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {MONTHS_SHORT.map((name, idx) => {
              const isSelected = idx === month && pickerYear === year;
              const isToday    = idx === today.getMonth() && pickerYear === today.getFullYear();
              return (
                <button
                  key={idx}
                  onClick={() => select(idx)}
                  className={`py-2 rounded-xl text-sm font-medium transition-colors
                    ${isSelected
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : isToday
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 ring-1 ring-neutral-300 dark:ring-neutral-600"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
