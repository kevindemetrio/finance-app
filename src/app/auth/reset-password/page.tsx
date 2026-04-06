"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useTheme } from "../../components/ThemeProvider";
import Link from "next/link";

function ThemeToggleAuth() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark" || theme === "season";

  const btnStyle = isDark
    ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
    : { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.1)" };

  const SunIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
      style={btnStyle}
      title={`Cambiar tema · ahora: ${isDark ? "Oscuro" : "Claro"}`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span>{isDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking]     = useState(true);

  const accentColor = "#1D9E75";
  const pageBg      = theme === "light" ? "#FDFBF7" : "#0a0a0a";
  const cardBg      = theme === "light" ? "#FFFFFF" : "rgba(255,255,255,0.07)";
  const cardBorder  = theme === "light" ? "#E8E2D8" : "rgba(255,255,255,0.12)";
  const textPrimary = theme === "light" ? "#2D2A26" : "#fff";
  const textMuted   = theme === "light" ? "#6B6560" : "rgba(255,255,255,0.35)";
  const inputBg     = theme === "light" ? "#F5F0E8" : "rgba(255,255,255,0.08)";
  const inputBorder = theme === "light" ? "#E8E2D8" : "rgba(255,255,255,0.12)";

  useEffect(() => {
    // Supabase maneja el token del hash automáticamente al inicializar el cliente.
    // Escuchamos el evento PASSWORD_RECOVERY para confirmar la sesión de reset.
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
      }
      setChecking(false);
    });

    // Si no recibimos ningún evento en 3 s, el enlace es inválido o ya fue usado.
    const timeout = setTimeout(() => setChecking(false), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleReset() {
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden transition-colors duration-500"
      style={{ background: pageBg }}
    >
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleAuth />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="rounded-2xl p-8 border transition-all"
          style={{ background: cardBg, borderColor: cardBorder, backdropFilter: "blur(12px)" }}
        >
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 512 512" fill="none">
                <rect width="512" height="512" rx="88" fill="#1D9E75"/>
                <polygon points="96,340 416,190 326,406" fill="white"/>
                <polygon points="96,340 326,406 308,272" fill="black" opacity="0.20"/>
                <polygon points="96,340 416,190 308,272" fill="white" opacity="0.40"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span style={{ color: textPrimary }}>spen</span>
              <span style={{ color: accentColor }}>fly</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: textMuted }}>Nueva contraseña</p>
          </div>

          {/* Estado: verificando enlace */}
          {checking && (
            <p className="text-sm text-center py-4" style={{ color: textMuted }}>
              Verificando enlace…
            </p>
          )}

          {/* Estado: enlace inválido */}
          {!checking && !validSession && (
            <div className="text-center space-y-4">
              <p className="text-sm" style={{ color: textMuted }}>
                El enlace de recuperación no es válido o ya ha sido utilizado.
              </p>
              <Link
                href="/auth/login"
                className="inline-block text-sm font-medium hover:underline"
                style={{ color: accentColor }}
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}

          {/* Estado: éxito */}
          {done && (
            <div className="text-center space-y-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ background: `${accentColor}20` }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: textPrimary }}>
                Contraseña actualizada
              </p>
              <p className="text-xs" style={{ color: textMuted }}>
                Redirigiendo a la app…
              </p>
            </div>
          )}

          {/* Estado: formulario */}
          {!checking && validSession && !done && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs uppercase tracking-widest mb-1.5"
                  style={{ color: textMuted }}
                >
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                  onFocus={e => (e.target.style.borderColor = accentColor)}
                  onBlur={e => (e.target.style.borderColor = inputBorder)}
                />
              </div>

              <div>
                <label
                  className="block text-xs uppercase tracking-widest mb-1.5"
                  style={{ color: textMuted }}
                >
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleReset()}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                  onFocus={e => (e.target.style.borderColor = accentColor)}
                  onBlur={e => (e.target.style.borderColor = inputBorder)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}

              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: accentColor }}
              >
                {loading ? "Guardando…" : "Guardar contraseña"}
              </button>

              <p className="text-center text-sm mt-2" style={{ color: textMuted }}>
                <Link href="/auth/login" className="hover:underline" style={{ color: accentColor }}>
                  Volver al inicio de sesión
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
