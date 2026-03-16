"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">Finanzas</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="tu@email.com"
              className="input-base w-full"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              className="input-base w-full"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-brand-red bg-brand-red-light dark:bg-red-950 dark:text-red-400 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900
              rounded-xl py-2.5 text-sm font-medium
              hover:bg-neutral-700 dark:hover:bg-neutral-300
              disabled:opacity-50 transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-4">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/signup" className="text-brand-blue hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
