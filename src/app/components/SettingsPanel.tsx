"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

const ALL_FIELD_LABELS: { key: keyof SectionPrefs; label: string; icon: string }[] = [
  { key: "showName",     label: "Descripción",     icon: "T" },
  { key: "showDate",     label: "Fecha",            icon: "📅" },
  { key: "showCategory", label: "Categoría",        icon: "#" },
  { key: "showNotes",    label: "Notas",            icon: "✎" },
  { key: "showPaid",     label: "Estado de pago",   icon: "✓" },
];

export function SettingsPanel({ userEmail, settings, onUpdate, onOpenTemplate, pageOrder, hideFinanceSettings, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [sendingReset, setSendingReset] = useState(false);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50"
        style={{ backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on sm+ */}
      <div
        ref={ref}
        className="fixed z-50 left-1/2 -translate-x-1/2
          bottom-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
          w-[calc(100%-1.5rem)] max-w-[22rem]
          max-h-[88vh] overflow-y-auto
          rounded-2xl
          bg-white dark:bg-[#141416]
          border border-neutral-200/80 dark:border-neutral-800
          shadow-[0_24px_64px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.08)]
          dark:shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 pt-4 pb-3
          bg-white dark:bg-[#141416] border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
              <GearSmIcon />
            </div>
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Ajustes rápidos
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg
              text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200
              hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            title="Cerrar"
          >
            <XIcon />
          </button>
        </div>

        {/* ── User section ─────────────────────────────────────────────── */}
        <div className="mx-3 mt-3 mb-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60
          border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0 text-xs font-bold">
              {userEmail ? userEmail[0].toUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Cuenta</p>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate leading-tight">{userEmail || "—"}</p>
            </div>
          </div>
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

        {/* ── Account actions ──────────────────────────────────────────── */}
        <div className="px-3 mb-2 space-y-0.5">
          <ActionRow icon={<KeyIcon />} label={sendingReset ? "Enviando…" : "Cambiar contraseña"}
            onClick={handlePasswordReset} disabled={sendingReset} />
          {onOpenTemplate && (
            <ActionRow icon={<GridIcon />} label="Plantilla de gastos fijos"
              onClick={() => { onOpenTemplate(); onClose(); }} />
          )}
        </div>

        {/* ── Page-specific order (metas / inversiones) ────────────────── */}
        {pageOrder && (
          <>
            <Divider />
            <div className="px-3 mb-2">
              <PanelSectionTitle icon={<OrderIcon />}>{pageOrder.title}</PanelSectionTitle>
              <div className="mt-1.5 rounded-xl border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
                {pageOrder.items.map((item, i) => (
                  <div key={item.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-800/30
                      hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors
                      ${i < pageOrder.items.length - 1 ? "border-b border-neutral-100 dark:border-neutral-700/50" : ""}`}
                  >
                    {item.color
                      ? <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                      : <span className="w-5 text-center text-[11px] font-bold text-neutral-300 dark:text-neutral-700 select-none tabular-nums">{i + 1}</span>
                    }
                    <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">{item.label}</span>
                    <div className="flex gap-0.5">
                      <MoveButton onClick={() => pageOrder.onMove(item.id, -1)} disabled={i === 0} up />
                      <MoveButton onClick={() => pageOrder.onMove(item.id, 1)} disabled={i === pageOrder.items.length - 1} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!hideFinanceSettings && (
          <>
            <Divider />

            {/* ── Section order ─────────────────────────────────────────── */}
            <div className="px-3 mb-2">
              <PanelSectionTitle icon={<OrderIcon />}>Orden de secciones</PanelSectionTitle>
              <div className="mt-1.5 rounded-xl border border-neutral-100 dark:border-neutral-700/50 overflow-hidden">
                {settings.sectionOrder.map((key, i) => (
                  <div key={key}
                    className={`flex items-center gap-2.5 px-3 py-2.5 bg-white dark:bg-neutral-800/30
                      hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors
                      ${i < settings.sectionOrder.length - 1 ? "border-b border-neutral-100 dark:border-neutral-700/50" : ""}`}
                  >
                    <span className="w-5 text-center text-[11px] font-bold text-neutral-300 dark:text-neutral-600 select-none tabular-nums">{i + 1}</span>
                    <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{SECTION_LABELS[key]}</span>
                    <div className="flex gap-0.5">
                      <MoveButton onClick={() => moveSection(key, -1)} disabled={i === 0} up />
                      <MoveButton onClick={() => moveSection(key, 1)} disabled={i === settings.sectionOrder.length - 1} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* ── Field visibility ──────────────────────────────────────── */}
            <div className="px-3 pb-4">
              <PanelSectionTitle icon={<EyeIcon />}>Columnas visibles</PanelSectionTitle>
              <div className="mt-1.5 space-y-1">
                {settings.sectionOrder.map(key => {
                  const availableFields = SECTION_AVAILABLE_FIELDS[key];
                  const fieldLabels = ALL_FIELD_LABELS.filter(f => availableFields.includes(f.key));
                  const onCount = fieldLabels.filter(f => settings.sectionPrefs[key][f.key]).length;
                  const isOpen = activeSection === key;
                  return (
                    <FieldGroup
                      key={key}
                      label={SECTION_LABELS[key]}
                      isOpen={isOpen}
                      onCount={onCount}
                      total={fieldLabels.length}
                      onToggle={() => setActiveSection(isOpen ? null : key)}
                    >
                      {fieldLabels.map(({ key: field, label }, fi) => {
                        const on = settings.sectionPrefs[key][field];
                        return (
                          <button
                            key={field}
                            onClick={() => toggleField(key, field)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left
                              ${fi < fieldLabels.length - 1 ? "border-b border-neutral-100 dark:border-neutral-700/40" : ""}
                              hover:bg-neutral-50 dark:hover:bg-neutral-800/40`}
                          >
                            <div className={`relative w-9 h-[20px] rounded-full transition-all shrink-0
                              ${on ? "bg-brand-blue" : "bg-neutral-200 dark:bg-neutral-700"}`}>
                              <div className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all
                                ${on ? "left-[20px]" : "left-[3px]"}`} />
                            </div>
                            <span className={`transition-colors ${on
                              ? "text-neutral-800 dark:text-neutral-200 font-medium"
                              : "text-neutral-400 dark:text-neutral-600"}`}>
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </FieldGroup>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── FieldGroup — animated collapsible section ─────────────────────────────────

function FieldGroup({ label, isOpen, onCount, total, onToggle, children }: {
  label: string;
  isOpen: boolean;
  onCount: number;
  total: number;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    setHeight(el.scrollHeight);
    setMeasured(true);
    const ro = new ResizeObserver(() => setHeight(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-measure when children change (toggles affect height)
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (el) setHeight(el.scrollHeight);
  });

  const collapseH = measured ? (isOpen ? height + "px" : "0px") : (isOpen ? "auto" : "0px");

  return (
    <div className="rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700/50">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors
          ${isOpen
            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            : "bg-white dark:bg-neutral-800/30 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
          }`}
      >
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
            ${isOpen ? "bg-brand-blue text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"}`}>
            {onCount}/{total}
          </span>
          <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      <div
        style={{
          height: collapseH,
          overflow: "hidden",
          transition: "height 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div ref={innerRef} className="border-t border-neutral-100 dark:border-neutral-700/50">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────────────────────

function Divider() {
  return <div className="mx-3 h-px bg-neutral-100 dark:bg-neutral-800 my-2" />;
}

function PanelSectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
        {children}
      </span>
    </div>
  );
}

function MoveButton({ onClick, disabled, up }: { onClick: () => void; disabled?: boolean; up?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 flex items-center justify-center rounded-lg
        text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200
        hover:bg-neutral-100 dark:hover:bg-neutral-700
        disabled:opacity-20 transition-all active:scale-90"
    >
      {up ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </button>
  );
}

function ActionRow({ icon, label, onClick, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
        text-neutral-600 dark:text-neutral-400
        hover:text-neutral-900 dark:hover:text-neutral-100
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        transition-colors disabled:opacity-50 active:scale-[0.98]"
    >
      <span className="text-neutral-400 dark:text-neutral-500 shrink-0">{icon}</span>
      {label}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function GearSmIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
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
