"use client";

import { useEffect, useRef, useState } from "react";
import {
  SectionKey, SectionPrefs, UserSettings, SECTION_LABELS, SECTION_AVAILABLE_FIELDS,
} from "../lib/userSettings";
import { createClient } from "../lib/supabase/client";
import { toast } from "./Toast";

interface Props {
  userEmail: string;
  settings: UserSettings;
  onUpdate: (fn: (prev: UserSettings) => UserSettings) => void;
  onOpenTemplate?: () => void;
  onLogout: () => void;
  onClose: () => void;
}

const ALL_FIELD_LABELS: { key: keyof SectionPrefs; label: string }[] = [
  { key: "showName",     label: "Descripción" },
  { key: "showDate",     label: "Fecha" },
  { key: "showCategory", label: "Categoría" },
  { key: "showNotes",    label: "Notas" },
  { key: "showPaid",     label: "Estado de pago" },
];

export function SettingsPanel({ userEmail, settings, onUpdate, onOpenTemplate, onLogout, onClose }: Props) {
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

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-[22rem] rounded-2xl
        bg-white dark:bg-neutral-900
        border border-neutral-100 dark:border-neutral-800
        shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
        dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        z-50 overflow-hidden"
    >
      {/* ── User section ── */}
      <div className="px-4 py-3.5 flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-brand-blue-light dark:bg-blue-950/60
          flex items-center justify-center shrink-0 select-none">
          <span className="text-sm font-bold text-brand-blue">{initial}</span>
        </div>
        {/* Email */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">Cuenta</p>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{userEmail || "—"}</p>
        </div>
        {/* Logout */}
        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 dark:text-neutral-500
            hover:text-brand-red dark:hover:text-red-400 transition-colors shrink-0 py-1 px-1.5 rounded-lg
            hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <LogoutIcon />
          Salir
        </button>
      </div>

      {/* ── Account actions ── */}
      <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 space-y-0.5">
        <ActionRow icon={<KeyIcon />} label={sendingReset ? "Enviando…" : "Cambiar contraseña"}
          onClick={handlePasswordReset} disabled={sendingReset} />
        {onOpenTemplate && (
          <ActionRow icon={<GridIcon />} label="Plantilla de gastos fijos"
            onClick={() => { onOpenTemplate(); onClose(); }} />
        )}
      </div>

      {/* ── Section order ── */}
      <div className="px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <SectionTitle>Orden de secciones</SectionTitle>
        <div className="space-y-0.5 mt-2">
          {settings.sectionOrder.map((key, i) => (
            <div key={key} className="flex items-center gap-2 py-1 group">
              <span className="w-4 text-center text-[11px] font-semibold text-neutral-300 dark:text-neutral-700 select-none tabular-nums">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{SECTION_LABELS[key]}</span>
              <div className="flex opacity-60 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveSection(key, -1)} disabled={i === 0}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400
                    hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800
                    disabled:opacity-20 transition-all">
                  <ChevronUpIcon />
                </button>
                <button onClick={() => moveSection(key, 1)} disabled={i === settings.sectionOrder.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400
                    hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800
                    disabled:opacity-20 transition-all">
                  <ChevronDownIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Field visibility per section ── */}
      <div className="px-4 pt-3 pb-3 max-h-60 overflow-y-auto">
        <SectionTitle>Campos visibles</SectionTitle>
        <div className="mt-2 space-y-1">
          {settings.sectionOrder.map(key => {
            const availableFields = SECTION_AVAILABLE_FIELDS[key];
            const fieldLabels = ALL_FIELD_LABELS.filter(f => availableFields.includes(f.key));
            return (
              <div key={key}>
                <button
                  onClick={() => setActiveSection(activeSection === key ? null : key)}
                  className="w-full flex items-center justify-between text-sm font-medium
                    text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100
                    transition-colors py-1.5 rounded-lg"
                >
                  <span className="flex items-center gap-2">
                    {SECTION_LABELS[key]}
                    {/* Mini preview of active fields */}
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-normal">
                      {fieldLabels.filter(f => settings.sectionPrefs[key][f.key]).length}/{fieldLabels.length}
                    </span>
                  </span>
                  <svg className={`w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 transition-transform duration-150 ${activeSection === key ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {activeSection === key && (
                  <div className="pl-3 pb-2 pt-0.5 space-y-2">
                    {fieldLabels.map(({ key: field, label }) => {
                      const on = settings.sectionPrefs[key][field];
                      return (
                        <label key={field} className="flex items-center gap-2.5 cursor-pointer select-none group/field">
                          {/* Custom checkbox */}
                          <span
                            onClick={() => toggleField(key, field)}
                            className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all shrink-0
                              ${on
                                ? "bg-brand-blue border-brand-blue shadow-[0_0_0_3px_rgba(55,138,221,0.12)]"
                                : "border-neutral-200 dark:border-neutral-700 group-hover/field:border-neutral-300 dark:group-hover/field:border-neutral-600"
                              }`}
                          >
                            {on && (
                              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                                <polyline points="2 6 5 9 10 3" />
                              </svg>
                            )}
                          </span>
                          <span
                            onClick={() => toggleField(key, field)}
                            className={`text-sm transition-colors ${on ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-600"}`}
                          >
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
      {children}
    </p>
  );
}

function ActionRow({ icon, label, onClick, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-sm
        text-neutral-600 dark:text-neutral-400
        hover:text-neutral-900 dark:hover:text-neutral-100
        hover:bg-neutral-50 dark:hover:bg-neutral-800
        transition-colors disabled:opacity-50"
    >
      <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
      {label}
    </button>
  );
}

function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function KeyIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>;
}
function GridIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function ChevronUpIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>;
}
function ChevronDownIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>;
}
