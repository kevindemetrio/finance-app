"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSignup() {
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">Revisa tu email</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Te hemos enviado un enlace de confirmación a <strong>{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <Link
            href="/auth/login"
            className="text-sm text-brand-blue hover:underline"
          >
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">Crear cuenta</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Gratis, sin tarjeta</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
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
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              placeholder="Mínimo 6 caracteres"
              className="input-base w-full"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-brand-red bg-brand-red-light dark:bg-red-950 dark:text-red-400 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900
              rounded-xl py-2.5 text-sm font-medium
              hover:bg-neutral-700 dark:hover:bg-neutral-300
              disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </div>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-4">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-brand-blue hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
