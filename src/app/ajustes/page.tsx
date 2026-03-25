"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { createCategory, deleteCategory, loadCategories } from "../lib/data";
import { Navbar, DesktopTabs } from "../components/Navbar";
import { SeasonWrapper } from "../components/SeasonWrapper";
import { ThemeToggle } from "../components/ThemeProvider";
import { SettingsPanel } from "../components/SettingsPanel";
import { toast, confirm } from "../components/Toast";
import { PrimaryButton, TextInput } from "../components/ui";
import { useCategories } from "../components/CategoriesProvider";
import { useUserSettings } from "../lib/userSettings";

export default function AjustesPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { settings, update: updateSettings } = useUserSettings();

  // Local categories state for this page
  const { reloadCategories: reloadCtx } = useCategories();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
    loadCategories().then(cats => { setCategories(cats); setLoading(false); });
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (name.length > 30) { toast("Máximo 30 caracteres", "error"); return; }
    if (categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      toast("Esa categoría ya existe", "error");
      return;
    }
    setAdding(true);
    await createCategory(name);
    const updated = await loadCategories();
    setCategories(updated);
    reloadCtx();
    setNewName("");
    setAdding(false);
    toast("Categoría añadida");
  }

  async function handleDelete(name: string) {
    if (categories.length <= 1) {
      toast("Debe haber al menos una categoría", "error");
      return;
    }
    const ok = await confirm({
      title: `¿Eliminar "${name}"?`,
      message: "Los movimientos asociados no se borrarán, pero quedarán sin categoría.",
      danger: true,
    });
    if (!ok) return;
    await deleteCategory(name);
    const updated = await loadCategories();
    setCategories(updated);
    reloadCtx();
    toast("Categoría eliminada", "info");
  }

  return (
    <SeasonWrapper>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <DesktopTabs />
          <h1 className="text-lg font-medium lg:hidden">Ajustes</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="relative" onMouseDown={e => e.stopPropagation()}>
              <button
                onClick={() => setShowSettings(v => !v)}
                title="Ajustes"
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors
                  ${showSettings
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                    : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
              >
                <GearIcon />
              </button>
              {showSettings && (
                <SettingsPanel
                  userEmail={userEmail}
                  settings={settings}
                  onUpdate={updateSettings}
                  onLogout={handleLogout}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Categorías */}
        <div className="card">
          <div className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-amber" />
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              Categorías de gastos
            </h2>
            {!loading && (
              <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600
                bg-neutral-100 dark:bg-neutral-800 rounded-full px-1.5 py-0.5 leading-none">
                {categories.length}
              </span>
            )}
          </div>

          {/* Lista */}
          <div className="bg-neutral-50/30 dark:bg-neutral-800/10">
            {loading ? (
              <div className="divide-y divide-neutral-100/70 dark:divide-neutral-800/50">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    <div className="w-6 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-neutral-100/70 dark:divide-neutral-800/50">
                {categories.map(cat => (
                  <div key={cat} className="group flex items-center gap-3 px-4 py-3
                    hover:bg-white dark:hover:bg-neutral-800/40 transition-colors">
                    <CategoryDot name={cat} />
                    <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{cat}</span>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={categories.length <= 1}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg
                        text-neutral-300 dark:text-neutral-700
                        hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-brand-red
                        disabled:cursor-not-allowed disabled:opacity-20
                        transition-all"
                      title="Eliminar categoría"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Añadir nueva categoría */}
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
            <TextInput
              value={newName}
              onChange={e => setNewName(e.target.value.slice(0, 30))}
              placeholder="Nueva categoría..."
              className="flex-1"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <PrimaryButton onClick={handleAdd} disabled={adding || !newName.trim()}>
              {adding ? "..." : "Añadir"}
            </PrimaryButton>
          </div>
        </div>

      </div>
    </SeasonWrapper>
  );
}

// Genera un color de dot determinista a partir del nombre
function CategoryDot({ name }: { name: string }) {
  const PALETTE = [
    "#1D9E75", "#378ADD", "#BA7517", "#E24B4A",
    "#7F77DD", "#D85A30", "#993556", "#3B6D11",
  ];
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return (
    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE[idx] }} />
  );
}

function GearIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function XIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
