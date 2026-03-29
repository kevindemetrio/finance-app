"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SectionKey, SectionPrefs, UserSettings, SECTION_LABELS, SECTION_AVAILABLE_FIELDS,
} from "../lib/userSettings";
import { createClient } from "../lib/supabase/client";
import { toast } from "./Toast";

interface PageOrderItem { id: string; label: string; color?: string; }
interface PageOrderConfig { title: string; items: PageOrderItem[]; onMove: (id: string, dir: -1 | 1) => void; }

interface Props {
  userEmail: string;
  settings: UserSettings;
  onUpdate: (fn: (prev: UserSettings) => UserSettings) => void;
  onOpenTemplate?: () => void;
  pageOrder?: PageOrderConfig;
  hideFinanceSettings?: boolean;
  onClose: () => void;
}

const ALL_FIELD_LABELS: { key: keyof SectionPrefs; label: string }[] = [
  { key: "showName",     label: "Descripción" },
  { key: "showDate",     label: "Fecha" },
  { key: "showCategory", label: "Categoría" },
  { key: "showNotes",    label: "Notas" },
  { key: "showPaid",     label: "Estado de pago" },
];

export function SettingsPanel({ userEmail, settings, onUpdate, onOpenTemplate, pageOrder, hideFinanceSettings, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
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
      className="absolute right-0 top-full mt-2 w-[22rem] rounded-2xl
        bg-white dark:bg-[#141416]
        border border-neutral-200/70 dark:border-neutral-800
        shadow-[0_12px_40px_rgba(0,0,0,0.13),0_3px_10px_rgba(0,0,0,0.07)]
        dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
        z-50 overflow-hidden"
    >
      {/* ── Top bar: title + close ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Ajustes rápidos
        </span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg
            text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200
            hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          title="Cerrar"
        >
          <XIcon />
        </button>
      </div>

      {/* ── User section ────────────────────────────────────────────── */}
      <div className="mx-3 mb-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
        <div className="px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">Cuenta</p>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate leading-none">{userEmail || "—"}</p>
        </div>
        {/* Link to full settings */}
        <button
          onClick={() => { router.push("/ajustes"); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium
            text-neutral-500 dark:text-neutral-500
            hover:bg-neutral-100 dark:hover:bg-neutral-700/50
            hover:text-neutral-800 dark:hover:text-neutral-200
            border-t border-neutral-100 dark:border-neutral-700/50
            transition-colors"
        >
          <SettingsLinkIcon />
          Gestionar cuenta y ajustes
          <svg className="w-3 h-3 ml-auto text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* ── Account actions ─────────────────────────────────────────── */}
      <div className="px-3 mb-3 space-y-0.5">
        <ActionRow icon={<KeyIcon />} label={sendingReset ? "Enviando…" : "Cambiar contraseña"}
          onClick={handlePasswordReset} disabled={sendingReset} />
        {onOpenTemplate && (
          <ActionRow icon={<GridIcon />} label="Plantilla de gastos fijos"
            onClick={() => { onOpenTemplate(); onClose(); }} />
        )}
      </div>

      {/* ── Page-specific order (metas / inversiones) ───────────────── */}
      {pageOrder && (
        <>
          <div className="mx-3 h-px bg-neutral-100 dark:bg-neutral-800 mb-3" />
          <div className="px-4 mb-3">
            <PanelSectionTitle icon={<OrderIcon />}>{pageOrder.title}</PanelSectionTitle>
            <div className="space-y-0.5 mt-2">
              {pageOrder.items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-2 py-1 group rounded-lg px-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  {item.color
                    ? <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                    : <span className="w-4 text-center text-[11px] font-bold text-neutral-300 dark:text-neutral-700 select-none tabular-nums">{i + 1}</span>
                  }
                  <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">{item.label}</span>
                  <div className="flex opacity-40 group-hover:opacity-100 transition-opacity gap-0.5">
                    <button onClick={() => pageOrder.onMove(item.id, -1)} disabled={i === 0}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-500
                        hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700
                        disabled:opacity-25 transition-all">
                      <ChevronUpIcon />
                    </button>
                    <button onClick={() => pageOrder.onMove(item.id, 1)} disabled={i === pageOrder.items.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-500
                        hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700
                        disabled:opacity-25 transition-all">
                      <ChevronDownIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!hideFinanceSettings && (<>
      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="mx-3 h-px bg-neutral-100 dark:bg-neutral-800 mb-3" />

      {/* ── Section order ───────────────────────────────────────────── */}
      <div className="px-4 mb-3">
        <PanelSectionTitle icon={<OrderIcon />}>Orden de secciones</PanelSectionTitle>
        <div className="space-y-0.5 mt-2">
          {settings.sectionOrder.map((key, i) => (
            <div key={key} className="flex items-center gap-2 py-1 group rounded-lg px-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
              <span className="w-4 text-center text-[11px] font-bold text-neutral-300 dark:text-neutral-700 select-none tabular-nums">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{SECTION_LABELS[key]}</span>
              <div className="flex opacity-40 group-hover:opacity-100 transition-opacity gap-0.5">
                <button onClick={() => moveSection(key, -1)} disabled={i === 0}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-500
                    hover:text-neutral-800 dark:hover:text-neutral-200
                    hover:bg-neutral-200 dark:hover:bg-neutral-700
                    disabled:opacity-25 transition-all">
                  <ChevronUpIcon />
                </button>
                <button onClick={() => moveSection(key, 1)} disabled={i === settings.sectionOrder.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-500
                    hover:text-neutral-800 dark:hover:text-neutral-200
                    hover:bg-neutral-200 dark:hover:bg-neutral-700
                    disabled:opacity-25 transition-all">
                  <ChevronDownIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="mx-3 h-px bg-neutral-100 dark:bg-neutral-800 mb-3" />

      {/* ── Field visibility ────────────────────────────────────────── */}
      <div className="px-4 pb-4 max-h-56 overflow-y-auto">
        <PanelSectionTitle icon={<EyeIcon />}>Campos visibles</PanelSectionTitle>
        <div className="mt-2 space-y-0.5">
          {settings.sectionOrder.map(key => {
            const availableFields = SECTION_AVAILABLE_FIELDS[key];
            const fieldLabels = ALL_FIELD_LABELS.filter(f => availableFields.includes(f.key));
            const onCount = fieldLabels.filter(f => settings.sectionPrefs[key][f.key]).length;
            const isOpen = activeSection === key;
            return (
              <div key={key}>
                <button
                  onClick={() => setActiveSection(isOpen ? null : key)}
                  className={`w-full flex items-center justify-between text-sm font-medium
                    transition-colors rounded-lg px-2 py-1.5
                    ${isOpen
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100"
                    }`}
                >
                  <span>{SECTION_LABELS[key]}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                      ${isOpen
                        ? "bg-brand-blue text-white"
                        : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
                      }`}>
                      {onCount}/{fieldLabels.length}
                    </span>
                    <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="mx-2 mt-1 mb-1 rounded-xl bg-neutral-50 dark:bg-neutral-800/60
                    border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
                    {fieldLabels.map(({ key: field, label }, fi) => {
                      const on = settings.sectionPrefs[key][field];
                      return (
                        <button
                          key={field}
                          onClick={() => toggleField(key, field)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm
                            transition-colors text-left
                            ${fi < fieldLabels.length - 1 ? "border-b border-neutral-100 dark:border-neutral-700/50" : ""}
                            hover:bg-white dark:hover:bg-neutral-700/60`}
                        >
                          <div className={`relative w-8 h-[18px] rounded-full transition-all shrink-0
                            ${on ? "bg-brand-blue" : "bg-neutral-200 dark:bg-neutral-700"}`}
                          >
                            <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all
                              ${on ? "left-[18px]" : "left-[2px]"}`} />
                          </div>
                          <span className={`transition-colors ${on ? "text-neutral-800 dark:text-neutral-200 font-medium" : "text-neutral-400 dark:text-neutral-600"}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </>)}
    </div>
  );
}

function PanelSectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-neutral-400 dark:text-neutral-600">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        {children}
      </span>
    </div>
  );
}

function ActionRow({ icon, label, onClick, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm
        text-neutral-600 dark:text-neutral-400
        hover:text-neutral-900 dark:hover:text-neutral-100
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        transition-colors disabled:opacity-50"
    >
      <span className="text-neutral-400 dark:text-neutral-500 shrink-0">{icon}</span>
      {label}
    </button>
  );
}

function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function KeyIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>;
}
function GridIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function ChevronUpIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>;
}
function ChevronDownIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>;
}
function OrderIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function EyeIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function SettingsLinkIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
