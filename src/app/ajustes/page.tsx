"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { createCategory, deleteCategory, loadCategories, loadGoals, Goal } from "../lib/data";
import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { ThemeToggle } from "../components/ThemeProvider";
import { TemplateManager } from "../components/TemplateManager";
import { toast, confirm } from "../components/Toast";
import { GhostButton, PrimaryButton, SaveButton, TextInput } from "../components/ui";
import { useCategories } from "../components/CategoriesProvider";
import { TOUR_KEY } from "../components/AppTour";
import {
  useUserSettings, SectionKey, SectionPrefs,
  SECTION_LABELS as SECTION_LABELS_MAP, SECTION_AVAILABLE_FIELDS,
} from "../lib/userSettings";

const GOAL_COLORS = ["#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30"];
const SECTION_COLOR_PRESETS = ["#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30","#5F5E5A"];
const GOALS_ORDER_KEY = "finanzas_goals_order";
const INV_ORDER_KEY = "finanzas_inv_order";

const SECTION_LABELS: Record<string, string> = {
  incomes: "Ingresos",
  savings: "Ahorros",
  fixedExpenses: "Gastos fijos",
  varExpenses: "Gastos variables",
};
const SECTION_KEYS = ["incomes", "savings", "fixedExpenses", "varExpenses"];

const ALL_FIELD_LABELS: { key: keyof SectionPrefs; label: string }[] = [
  { key: "showName",     label: "Descripción" },
  { key: "showDate",     label: "Fecha" },
  { key: "showCategory", label: "Categoría" },
  { key: "showNotes",    label: "Notas" },
  { key: "showPaid",     label: "Estado de pago" },
];

const INV_CATS_META = [
  { key: "emergency", label: "Fondo de emergencia", color: "#378ADD",
    desc: "Capital líquido para imprevistos. Cuentas de ahorro o depósitos de alta liquidez. Objetivo habitual: 3-6 meses de gastos." },
  { key: "variable",  label: "Renta variable",       color: "#1D9E75",
    desc: "ETFs, fondos indexados, acciones individuales. Mayor rentabilidad esperada a largo plazo con mayor volatilidad." },
  { key: "fixed",     label: "Renta fija",            color: "#BA7517",
    desc: "Bonos, letras del Tesoro, depósitos a plazo. Menor riesgo y rendimiento predecible." },
  { key: "stock",     label: "Acciones directas",     color: "#E24B4A",
    desc: "Participación directa en empresas cotizadas. Requiere seguimiento activo y mayor tolerancia al riesgo." },
];

export default function AjustesPage() {
  const router = useRouter();

  // ── CUENTA ──────────────────────────────────────────────────────────────
  const [userEmail, setUserEmail] = useState("");
  const [showPwForm, setShowPwForm] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // ── FINANZAS — categories ───────────────────────────────────────────────
  const { reloadCategories: reloadCtx } = useCategories();
  const [categories, setCategories] = useState<string[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  // ── FINANZAS — section colors ───────────────────────────────────────────
  const [sectionColors, setSectionColors] = useState<Record<string, string>>({});

  // ── METAS ───────────────────────────────────────────────────────────────
  const [defaultGoalColor, setDefaultGoalColor] = useState(GOAL_COLORS[0]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalOrder, setGoalOrder] = useState<string[]>([]);

  // ── INVERSIONES ─────────────────────────────────────────────────────────
  const [invOrder, setInvOrder] = useState<string[]>(INV_CATS_META.map(c => c.key));
  const [invOpen, setInvOpen] = useState<string | null>(null);

  // ── FINANZAS — section order + fields ──────────────────────────────────
  const { settings, update: updateSettings } = useUserSettings();
  const [activeFieldSection, setActiveFieldSection] = useState<SectionKey | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
    loadCategories().then(cats => { setCategories(cats); setCatsLoading(false); });

    // Section colors
    const colors: Record<string, string> = {};
    for (const k of SECTION_KEYS) {
      const c = localStorage.getItem(`section_color_${k}`);
      if (c) colors[k] = c;
    }
    setSectionColors(colors);

    // Default goal color
    const dgc = localStorage.getItem("default_goal_color");
    if (dgc) setDefaultGoalColor(dgc);

    // Goals
    loadGoals().then(g => {
      setGoals(g);
      const savedOrder = localStorage.getItem(GOALS_ORDER_KEY);
      if (savedOrder) {
        try {
          const parsed: string[] = JSON.parse(savedOrder);
          const withNew = [...parsed.filter(id => g.some(x => x.id === id)), ...g.map(x => x.id).filter(id => !parsed.includes(id))];
          setGoalOrder(withNew);
        } catch { setGoalOrder(g.map(x => x.id)); }
      } else {
        setGoalOrder(g.map(x => x.id));
      }
    });

    // Inv order
    const savedInv = localStorage.getItem(INV_ORDER_KEY);
    if (savedInv) { try { setInvOrder(JSON.parse(savedInv)); } catch {} }
  }, []);

  // ── CUENTA handlers ──────────────────────────────────────────────────────
  async function handleLogout() {
    const ok = await confirm({ title: "¿Cerrar sesión?", message: "Se cerrará tu sesión en este dispositivo.", danger: true });
    if (!ok) return;
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  async function handleChangePassword() {
    if (!newPw || newPw.length < 6) { toast("Mínimo 6 caracteres", "error"); return; }
    if (newPw !== confirmPw) { toast("Las contraseñas no coinciden", "error"); return; }
    setSavingPw(true);
    const { error } = await createClient().auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) { toast(error.message, "error"); return; }
    toast("Contraseña actualizada");
    setNewPw(""); setConfirmPw(""); setShowPwForm(false);
  }

  // ── FINANZAS — section order + fields ────────────────────────────────────
  function moveSection(key: SectionKey, dir: -1 | 1) {
    updateSettings(prev => {
      const order = [...prev.sectionOrder];
      const i = order.indexOf(key);
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...prev, sectionOrder: order };
    });
  }

  function toggleField(section: SectionKey, field: keyof SectionPrefs) {
    updateSettings(prev => ({
      ...prev,
      sectionPrefs: {
        ...prev.sectionPrefs,
        [section]: { ...prev.sectionPrefs[section], [field]: !prev.sectionPrefs[section][field] },
      },
    }));
  }

  // ── FINANZAS — category handlers ─────────────────────────────────────────
  async function handleAddCat() {
    const name = newCatName.trim();
    if (!name) return;
    if (name.length > 30) { toast("Máximo 30 caracteres", "error"); return; }
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      toast("Esa categoría ya existe", "error"); return;
    }
    setAddingCat(true);
    await createCategory(name);
    const updated = await loadCategories();
    setCategories(updated); reloadCtx(); setNewCatName(""); setAddingCat(false);
    toast("Categoría añadida");
  }

  async function handleDeleteCat(name: string) {
    if (categories.length <= 1) { toast("Debe haber al menos una categoría", "error"); return; }
    const ok = await confirm({ title: `¿Eliminar "${name}"?`, message: "Los movimientos asociados quedarán sin categoría.", danger: true });
    if (!ok) return;
    await deleteCategory(name);
    const updated = await loadCategories();
    setCategories(updated); reloadCtx();
    toast("Categoría eliminada", "info");
  }

  // ── FINANZAS — section color handlers ────────────────────────────────────
  function handleSectionColor(key: string, color: string | null) {
    const next = { ...sectionColors };
    if (color) next[key] = color;
    else delete next[key];
    setSectionColors(next);
    if (color) localStorage.setItem(`section_color_${key}`, color);
    else localStorage.removeItem(`section_color_${key}`);
    window.dispatchEvent(new Event("section-colors-updated"));
  }

  // ── METAS — default color ─────────────────────────────────────────────────
  function handleDefaultGoalColor(color: string) {
    setDefaultGoalColor(color);
    localStorage.setItem("default_goal_color", color);
  }

  // ── METAS — goal ordering ─────────────────────────────────────────────────
  function moveGoal(id: string, dir: -1 | 1) {
    setGoalOrder(prev => {
      const order = [...prev];
      const i = order.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      try { localStorage.setItem(GOALS_ORDER_KEY, JSON.stringify(order)); } catch {}
      return order;
    });
  }

  // ── INVERSIONES — category ordering ──────────────────────────────────────
  function moveInvCat(key: string, dir: -1 | 1) {
    setInvOrder(prev => {
      const order = [...prev];
      const i = order.indexOf(key);
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      try { localStorage.setItem(INV_ORDER_KEY, JSON.stringify(order)); } catch {}
      return order;
    });
  }

  // ── TOUR ──────────────────────────────────────────────────────────────────
  function handleRestartTour() {
    localStorage.removeItem(TOUR_KEY);
    router.push("/");
  }

  const sortedGoals = [...goals].sort((a, b) => {
    const ai = goalOrder.indexOf(a.id);
    const bi = goalOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const sortedInvCats = invOrder
    .map(key => INV_CATS_META.find(c => c.key === key))
    .filter(Boolean) as typeof INV_CATS_META;

  return (
    <SeasonWrapper>
      <Navbar />
      {showTemplate && <TemplateManager onClose={() => setShowTemplate(false)} />}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Ajustes</h1>
          <ThemeToggle />
        </div>

        <div className="space-y-4">

          {/* ── CUENTA ──────────────────────────────────────────────────── */}
          <SettingsCard label="CUENTA" dot="bg-brand-blue">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-0.5">Correo</p>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{userEmail || "—"}</p>
              </div>
              <button
                onClick={() => setShowPwForm(v => !v)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                  bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400
                  hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <AjKeyIcon /> Cambiar contraseña
              </button>
            </div>

            {showPwForm && (
              <div className="px-4 pb-3 pt-1 space-y-2 border-t border-neutral-100 dark:border-neutral-800">
                <TextInput
                  type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Nueva contraseña (mín. 6 chars)" className="w-full"
                />
                <TextInput
                  type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Confirmar contraseña" className="w-full"
                  onKeyDown={e => e.key === "Enter" && handleChangePassword()}
                />
                <div className="flex gap-2 justify-end">
                  <GhostButton onClick={() => { setShowPwForm(false); setNewPw(""); setConfirmPw(""); }}>
                    Cancelar
                  </GhostButton>
                  <SaveButton onClick={handleChangePassword} disabled={savingPw}>
                    {savingPw ? "Guardando..." : "Guardar"}
                  </SaveButton>
                </div>
              </div>
            )}

            <div className="px-4 pb-3 border-t border-neutral-100 dark:border-neutral-800 pt-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-brand-red hover:text-red-700 transition-colors"
              >
                <LogoutIcon /> Cerrar sesión
              </button>
            </div>
          </SettingsCard>

          {/* ── APARIENCIA ──────────────────────────────────────────────── */}
          <SettingsCard label="APARIENCIA" dot="bg-brand-amber">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tema</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Claro, oscuro o estacional</p>
              </div>
              <ThemeToggle />
            </div>
          </SettingsCard>

          {/* ── FINANZAS ────────────────────────────────────────────────── */}
          <SettingsCard label="FINANZAS" dot="bg-brand-green">

            {/* Orden de secciones */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Orden de secciones</p>
              <div className="space-y-0.5">
                {settings.sectionOrder.map((key, i) => (
                  <div key={key} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <span className="w-4 text-center text-[11px] font-bold text-neutral-300 dark:text-neutral-700 select-none tabular-nums">{i + 1}</span>
                    <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{SECTION_LABELS_MAP[key]}</span>
                    <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveSection(key, -1)} disabled={i === 0}
                        className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all">
                        <ChevUpIcon />
                      </button>
                      <button onClick={() => moveSection(key, 1)} disabled={i === settings.sectionOrder.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all">
                        <ChevDownIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campos visibles por sección */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Campos visibles</p>
              <div className="space-y-0.5">
                {settings.sectionOrder.map(key => {
                  const available = SECTION_AVAILABLE_FIELDS[key];
                  const fields = ALL_FIELD_LABELS.filter(f => available.includes(f.key));
                  const onCount = fields.filter(f => settings.sectionPrefs[key][f.key]).length;
                  const isOpen = activeFieldSection === key;
                  return (
                    <div key={key}>
                      <button
                        onClick={() => setActiveFieldSection(isOpen ? null : key)}
                        className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium transition-colors
                          ${isOpen
                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-100"}`}
                      >
                        <span>{SECTION_LABELS_MAP[key]}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                            ${isOpen ? "bg-brand-blue text-white" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"}`}>
                            {onCount}/{fields.length}
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
                          {fields.map(({ key: field, label }, fi) => {
                            const on = settings.sectionPrefs[key][field];
                            return (
                              <button
                                key={field}
                                onClick={() => toggleField(key, field)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left
                                  hover:bg-white dark:hover:bg-neutral-700/60
                                  ${fi < fields.length - 1 ? "border-b border-neutral-100 dark:border-neutral-700/50" : ""}`}
                              >
                                <div className={`relative w-8 h-[18px] rounded-full transition-all shrink-0 ${on ? "bg-brand-blue" : "bg-neutral-200 dark:bg-neutral-700"}`}>
                                  <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all ${on ? "left-[18px]" : "left-[2px]"}`} />
                                </div>
                                <span className={on ? "text-neutral-800 dark:text-neutral-200 font-medium" : "text-neutral-400 dark:text-neutral-600"}>
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

            {/* Template manager */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Plantilla de gastos fijos</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Define tus recurrentes para importarlos cada mes</p>
              </div>
              <button
                onClick={() => setShowTemplate(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 ml-4
                  bg-brand-amber-light dark:bg-amber-950/50 text-brand-amber
                  hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <AjGridIcon /> Gestionar
              </button>
            </div>

            {/* Section colors */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Colores de secciones</p>
              <div className="space-y-3">
                {settings.sectionOrder.map(key => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 w-32 shrink-0">{SECTION_LABELS_MAP[key]}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {SECTION_COLOR_PRESETS.map(c => (
                        <button key={c} onClick={() => handleSectionColor(key, c)}
                          className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                          style={{ background: c, outline: sectionColors[key] === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                        />
                      ))}
                      {sectionColors[key] && (
                        <button onClick={() => handleSectionColor(key, null)}
                          className="text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded px-1.5 py-0.5 hover:text-neutral-600">
                          reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex-1">Categorías de gastos</p>
                {!catsLoading && (
                  <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600
                    bg-neutral-100 dark:bg-neutral-800 rounded-full px-1.5 py-0.5 leading-none">
                    {categories.length}
                  </span>
                )}
              </div>
              <div className="bg-neutral-50/30 dark:bg-neutral-800/10">
                {catsLoading ? (
                  <div className="divide-y divide-neutral-100/70 dark:divide-neutral-800/50">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100/70 dark:divide-neutral-800/50">
                    {categories.map(cat => (
                      <div key={cat} className="group flex items-center gap-3 px-4 py-2.5
                        hover:bg-white dark:hover:bg-neutral-800/40 transition-colors">
                        <CategoryDot name={cat} />
                        <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{cat}</span>
                        <button
                          onClick={() => handleDeleteCat(cat)}
                          disabled={categories.length <= 1}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg
                            text-neutral-300 dark:text-neutral-700
                            hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-brand-red
                            disabled:cursor-not-allowed disabled:opacity-20 transition-all"
                        >
                          <XIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
                <TextInput
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value.slice(0, 30))}
                  placeholder="Nueva categoría..."
                  className="flex-1"
                  onKeyDown={e => e.key === "Enter" && handleAddCat()}
                />
                <PrimaryButton onClick={handleAddCat} disabled={addingCat || !newCatName.trim()}>
                  {addingCat ? "..." : "Añadir"}
                </PrimaryButton>
              </div>
            </div>
          </SettingsCard>

          {/* ── METAS ───────────────────────────────────────────────────── */}
          <SettingsCard label="METAS" dot="bg-brand-red">

            {/* Default goal color */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Color por defecto para nuevas metas
              </p>
              <div className="flex gap-2">
                {GOAL_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => handleDefaultGoalColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline: defaultGoalColor === c ? `2px solid ${c}` : "none",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Goal ordering */}
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Orden de metas</p>
              {sortedGoals.length === 0 ? (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">Sin metas todavía</p>
              ) : (
                <div className="space-y-0.5">
                  {sortedGoals.map((goal, i) => (
                    <div key={goal.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: goal.color ?? "#1D9E75" }} />
                      <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">{goal.name}</span>
                      <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveGoal(goal.id, -1)} disabled={i === 0}
                          className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all">
                          <ChevUpIcon />
                        </button>
                        <button onClick={() => moveGoal(goal.id, 1)} disabled={i === sortedGoals.length - 1}
                          className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all">
                          <ChevDownIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SettingsCard>

          {/* ── INVERSIONES ─────────────────────────────────────────────── */}
          <SettingsCard label="INVERSIONES" dot="bg-[#7F77DD]">

            {/* Category ordering */}
            <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Orden de categorías</p>
              <div className="space-y-0.5">
                {sortedInvCats.map((cat, i) => (
                  <div key={cat.key} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{cat.label}</span>
                    <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveInvCat(cat.key, -1)} disabled={i === 0}
                        className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all">
                        <ChevUpIcon />
                      </button>
                      <button onClick={() => moveInvCat(cat.key, 1)} disabled={i === sortedInvCats.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-20 transition-all">
                        <ChevDownIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category descriptions accordion */}
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sortedInvCats.map(cat => (
                <div key={cat.key}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                    onClick={() => setInvOpen(v => v === cat.key ? null : cat.key)}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="flex-1 text-sm font-medium text-neutral-700 dark:text-neutral-300">{cat.label}</span>
                    <svg
                      className={`w-4 h-4 text-neutral-300 dark:text-neutral-600 transition-transform ${invOpen === cat.key ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {invOpen === cat.key && (
                    <p className="px-4 pb-3 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {cat.desc}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* ── TOUR DE BIENVENIDA ───────────────────────────────────────── */}
          <SettingsCard label="TOUR DE BIENVENIDA" dot="bg-brand-blue">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Recorrido por la app</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Vuelve a ver el tour interactivo de bienvenida</p>
              </div>
              <button
                onClick={handleRestartTour}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                  bg-brand-blue-light dark:bg-blue-950/60 text-brand-blue
                  hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
              >
                <AjTourIcon /> Volver a ver
              </button>
            </div>
          </SettingsCard>

          {/* ── AYUDA ───────────────────────────────────────────────────── */}
          <SettingsCard label="AYUDA" dot="bg-neutral-400">
            <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Versión</span>
              <span className="text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-full px-2.5 py-1">
                1.0.0
              </span>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                Tus datos se almacenan de forma segura en Supabase. No compartimos información personal con terceros.
                Puedes exportar o eliminar tu cuenta desde la sección Cuenta.
              </p>
            </div>
          </SettingsCard>

        </div>
      </div>
    </SeasonWrapper>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SettingsCard({ label, dot, children }: { label: string; dot: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2.5 bg-neutral-50/50 dark:bg-neutral-800/20">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 dark:text-neutral-500">{label}</span>
      </div>
      {children}
    </div>
  );
}

function CategoryDot({ name }: { name: string }) {
  const PALETTE = ["#1D9E75","#378ADD","#BA7517","#E24B4A","#7F77DD","#D85A30","#993556","#3B6D11"];
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[idx] }} />;
}

function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function ChevUpIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>;
}
function ChevDownIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>;
}
function AjKeyIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>;
}
function AjGridIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function AjTourIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
}
