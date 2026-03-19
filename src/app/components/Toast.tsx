"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; message: string; type: ToastType; }
interface ConfirmOpts { title: string; message?: string; danger?: boolean; }

type ToastListener = (msg: string, type: ToastType) => void;
type ConfirmListener = (opts: ConfirmOpts, resolve: (ok: boolean) => void) => void;

let _toast: ToastListener | null = null;
let _confirm: ConfirmListener | null = null;

export function toast(message: string, type: ToastType = "success") {
  _toast?.(message, type);
}

export function confirm(opts: ConfirmOpts): Promise<boolean> {
  return new Promise(resolve => {
    if (!_confirm) { resolve(window.confirm(opts.title)); return; }
    _confirm(opts, resolve);
  });
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOpts | null>(null);
  const confirmResolve = useRef<((ok: boolean) => void) | null>(null);
  const nextId = useRef(0);

  useEffect(() => {
    _toast = (message, type) => {
      const id = ++nextId.current;
      setToasts(p => [...p, { id, message, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    };
    _confirm = (opts, resolve) => {
      setConfirmOpts(opts);
      confirmResolve.current = resolve;
    };
    return () => { _toast = null; _confirm = null; };
  }, []);

  const resolve = useCallback((ok: boolean) => {
    confirmResolve.current?.(ok);
    confirmResolve.current = null;
    setConfirmOpts(null);
  }, []);

  const ICONS = { success: "✓", error: "✕", info: "·" };
  const COLORS = {
    success: "bg-brand-green text-white",
    error: "bg-brand-red text-white",
    info: "bg-neutral-700 dark:bg-neutral-600 text-white",
  };

  return (
    <>
      <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${COLORS[t.type]}`}
            style={{ animation: "slideup 0.2s ease-out" }}>
            <span>{ICONS[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {confirmOpts && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <p className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">{confirmOpts.title}</p>
            {confirmOpts.message && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{confirmOpts.message}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => resolve(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800
                  text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => resolve(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors
                  ${confirmOpts.danger ? "bg-brand-red hover:opacity-90" : "bg-brand-green hover:opacity-90"}`}>
                {confirmOpts.danger ? "Eliminar" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideup { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  );
}
