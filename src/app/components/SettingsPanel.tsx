"use client";

import { useEffect, useRef, useState } from "react";
import {
  SectionKey, SectionPrefs, UserSettings, SECTION_LABELS,
} from "../lib/userSettings";
import { createClient } from "../lib/supabase/client";
import { toast } from "./Toast";

interface Props {
  userEmail: string;
  settings: UserSettings;
  onUpdate: (fn: (prev: UserSettings) => UserSettings) => void;
  onOpenTemplate?: () => void;
  onClose: () => void;
}

const FIELD_LABELS: { key: keyof SectionPrefs; label: string }[] = [
  { key: "showName",     label: "Descripción" },
  { key: "showDate",     label: "Fecha" },
  { key: "showCategory", label: "Categoría" },
  { key: "showNotes",    label: "Notas" },
  { key: "showPaid",     label: "Estado de pago" },
];

export function SettingsPanel({ userEmail, settings, onUpdate, onOpenTemplate, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function handlePasswordReset() {
    if (sendingReset) return;
    setSendingReset(true);
    const { error } = await createClient().auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) {
      toast("Error al enviar el email", "error");
    } else {
      toast("Email de cambio de contraseña enviado", "info");
    }
    setSendingReset(false);
  }

  function moveSection(key: SectionKey, dir: -1 | 1) {
    onUpdate(prev => {
      const order = [...prev.sectionOrder];
      const i = order.indexOf(key);
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...prev, sectionOrder: order };
    });
  }

  function toggleField(section: SectionKey, field: keyof SectionPrefs) {
    onUpdate(prev => ({
      ...prev,
      sectionPrefs: {
        ...prev.sectionPrefs,
        [section]: {
          ...prev.sectionPrefs[section],
          [field]: !prev.sectionPrefs[section][field],
        },
      },
    }));
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-neutral-900
        border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 overflow-hidden"
    >
      {/* User info */}
      <div className="px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
        <p className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-0.5">Cuenta</p>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{userEmail || "—"}</p>
      </div>

      {/* Change password */}
      <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={handlePasswordReset}
          disabled={sendingReset}
          className="w-full flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400
            hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors py-1 disabled:opacity-50"
        >
          <KeyIcon />
          {sendingReset ? "Enviando..." : "Cambiar contraseña"}
        </button>
      </div>

      {/* Template shortcut (only in finance page) */}
      {onOpenTemplate && (
        <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => { onOpenTemplate(); onClose(); }}
            className="w-full flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-400
              hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors py-1"
          >
            <GridIcon />
            Plantilla de gastos fijos
          </button>
        </div>
      )}

      {/* Section order */}
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <p className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
          Orden de secciones
        </p>
        <div className="space-y-1">
          {settings.sectionOrder.map((key, i) => (
            <div key={key} className="flex items-center gap-1">
              <span className="text-neutral-300 dark:text-neutral-600 text-xs w-4 text-center select-none">{i + 1}</span>
              <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{SECTION_LABELS[key]}</span>
              <button
                onClick={() => moveSection(key, -1)}
                disabled={i === 0}
                title="Subir"
                className="w-6 h-6 flex items-center justify-center rounded text-neutral-400
                  hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 transition-colors"
              >
                <ChevronUpIcon />
              </button>
              <button
                onClick={() => moveSection(key, 1)}
                disabled={i === settings.sectionOrder.length - 1}
                title="Bajar"
                className="w-6 h-6 flex items-center justify-center rounded text-neutral-400
                  hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20 transition-colors"
              >
                <ChevronDownIcon />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Per-section field visibility */}
      <div className="px-4 py-3 max-h-64 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-2">
          Campos visibles por sección
        </p>
        <div className="space-y-1">
          {settings.sectionOrder.map(key => (
            <div key={key}>
              <button
                onClick={() => setActiveSection(activeSection === key ? null : key)}
                className="w-full flex items-center justify-between text-sm font-medium
                  text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100
                  transition-colors py-1.5"
              >
                {SECTION_LABELS[key]}
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${activeSection === key ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {activeSection === key && (
                <div className="pl-3 pb-1.5 space-y-2">
                  {FIELD_LABELS.map(({ key: field, label }) => (
                    <label key={field} className="flex items-center gap-2.5 cursor-pointer select-none">
                      <span
                        onClick={() => toggleField(key, field)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0
                          ${settings.sectionPrefs[key][field]
                            ? "bg-brand-blue border-brand-blue"
                            : "border-neutral-300 dark:border-neutral-600"
                          }`}
                      >
                        {settings.sectionPrefs[key][field] && (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        )}
                      </span>
                      <span
                        onClick={() => toggleField(key, field)}
                        className="text-sm text-neutral-600 dark:text-neutral-400"
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KeyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function ChevronUpIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>;
}
function ChevronDownIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>;
}
