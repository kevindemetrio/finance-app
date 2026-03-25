"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_CATEGORIES, loadCategories } from "../lib/data";

interface CategoriesCtx {
  categories: string[];
  reloadCategories: () => void;
}

const Ctx = createContext<CategoriesCtx>({
  categories: DEFAULT_CATEGORIES,
  reloadCategories: () => {},
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  const reloadCategories = useCallback(() => {
    loadCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    reloadCategories();
  }, [reloadCategories]);

  return (
    <Ctx.Provider value={{ categories, reloadCategories }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCategories(): CategoriesCtx {
  return useContext(Ctx);
}
