import { useState, useEffect } from "react";

export type SectionKey = "incomes" | "savings" | "fixedExpenses" | "varExpenses";

export interface SectionPrefs {
  showName: boolean;
  showDate: boolean;
  showCategory: boolean;
  showNotes: boolean;
  showPaid: boolean;
}

export interface UserSettings {
  sectionOrder: SectionKey[];
  sectionPrefs: Record<SectionKey, SectionPrefs>;
}

// Fields configurable per section — showPaid not available for incomes/savings
export const SECTION_AVAILABLE_FIELDS: Record<SectionKey, (keyof SectionPrefs)[]> = {
  incomes:       ["showName", "showDate", "showCategory", "showNotes"],
  savings:       ["showName", "showDate", "showCategory", "showNotes"],
  fixedExpenses: ["showName", "showDate", "showCategory", "showNotes", "showPaid"],
  varExpenses:   ["showName", "showDate", "showCategory", "showNotes", "showPaid"],
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  incomes:       "Ingresos",
  savings:       "Ahorros",
  fixedExpenses: "Gastos fijos",
  varExpenses:   "Gastos variables",
};

export const DEFAULT_PREFS: Record<SectionKey, SectionPrefs> = {
  incomes:       { showName: true, showDate: true, showCategory: false, showNotes: true, showPaid: false },
  savings:       { showName: true, showDate: true, showCategory: false, showNotes: true, showPaid: false },
  fixedExpenses: { showName: true, showDate: true, showCategory: true,  showNotes: true, showPaid: true  },
  varExpenses:   { showName: true, showDate: true, showCategory: true,  showNotes: true, showPaid: false },
};

export const DEFAULT_ORDER: SectionKey[] = ["incomes", "savings", "fixedExpenses", "varExpenses"];

const LS_KEY = "finance_user_settings_v1";

function loadFromStorage(): UserSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        sectionOrder: p.sectionOrder ?? [...DEFAULT_ORDER],
        sectionPrefs: {
          incomes:       { ...DEFAULT_PREFS.incomes,       ...p.sectionPrefs?.incomes },
          savings:       { ...DEFAULT_PREFS.savings,       ...p.sectionPrefs?.savings },
          fixedExpenses: { ...DEFAULT_PREFS.fixedExpenses, ...p.sectionPrefs?.fixedExpenses },
          varExpenses:   { ...DEFAULT_PREFS.varExpenses,   ...p.sectionPrefs?.varExpenses },
        },
      };
    }
  } catch {}
  return { sectionOrder: [...DEFAULT_ORDER], sectionPrefs: { ...DEFAULT_PREFS } };
}

function saveToStorage(s: UserSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    sectionOrder: [...DEFAULT_ORDER],
    sectionPrefs: {
      incomes:       { ...DEFAULT_PREFS.incomes },
      savings:       { ...DEFAULT_PREFS.savings },
      fixedExpenses: { ...DEFAULT_PREFS.fixedExpenses },
      varExpenses:   { ...DEFAULT_PREFS.varExpenses },
    },
  });

  useEffect(() => {
    setSettings(loadFromStorage());
  }, []);

  function update(fn: (prev: UserSettings) => UserSettings) {
    setSettings(prev => {
      const next = fn(prev);
      saveToStorage(next);
      return next;
    });
  }

  return { settings, update };
}
