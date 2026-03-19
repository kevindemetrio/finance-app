"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useTheme, SEASON_CONFIG } from "../../components/ThemeProvider";
import Link from "next/link";

const COINS = [
  { char: "€", bg: "#c8960a", border: "#f5c842", text: "#fff8e0", size: 28 },
  { char: "€", bg: "#a07808", border: "#d4a830", text: "#fff0b0", size: 22 },
  { char: "€", bg: "#e0aa10", border: "#ffd84a", text: "#fff5c0", size: 36 },
  { char: "$", bg: "#5a8a3a", border: "#8aba60", text: "#e0ffcc", size: 26 },
  { char: "₿", bg: "#c05010", border: "#f08040", text: "#ffe8d0", size: 24 },
];

function CoinRain() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const MAX = 50;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    function drop() {
      if (!scene || activeRef.current >= MAX) return;
      const c = COINS[Math.floor(Math.random() * COINS.length)];
      const size = c.size + Math.floor(Math.random() * 10 - 5);
      const dur = 2 + Math.random() * 3;
      const el = document.createElement("div");
      el.style.cssText = `
        position:absolute;top:-60px;left:${Math.random() * 92}%;
        width:${size}px;height:${size}px;border-radius:50%;
        background:${c.bg};border:2px solid ${c.border};color:${c.text};
        font-size:${Math.round(size * 0.45)}px;font-weight:800;
        display:flex;align-items:center;justify-content:center;
        box-shadow:inset 0 2px 3px rgba(255,255,255,0.3);
        opacity:${0.7 + Math.random() * 0.3};
        animation:coindrop ${dur}s linear forwards;pointer-events:none;
      `;
      el.textContent = c.char;
      scene.appendChild(el);
      activeRef.current++;
      el.addEventListener("animationend", () => { el.remove(); activeRef.current--; });
    }

    const interval = setInterval(drop, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`@keyframes coindrop{0%{transform:translateY(0) rotateY(0deg)}100%{transform:translateY(110vh) rotateY(1080deg) rotate(360deg)}}`}</style>
      <div ref={sceneRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
    </>
  );
}

function ThemeToggleAuth() {
  const { theme, season, toggle } = useTheme();

  const icons = {
    light:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    dark:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    season: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a9 9 0 0 1 9 9c0 4.97-9 13-9 13S3 15.97 3 11a9 9 0 0 1 9-9z"/></svg>,
  };

  const labels = { light: "Claro", dark: "Oscuro", season: SEASON_CONFIG[season].label };

  return (
    <button onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
      title={`Cambiar tema · ahora: ${labels[theme]}`}
    >
      {icons[theme]}
      <span>{labels[theme]}</span>
    </button>
  );
}

export default function SignupPage() {
  const { theme, season } = useTheme();
  const isSeason = theme === "season";
  const cfg = isSeason ? SEASON_CONFIG[season] : null;

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);

  const accentColor = cfg ? cfg.accentColor : "#BA7517";
  const pageBg      = cfg ? cfg.bg : theme === "light" ? "#f5f5f5" : "#0d0a00";
  const cardBg      = cfg ? cfg.cardBg : theme === "light" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.06)";
  const cardBorder  = cfg ? cfg.cardBorder : theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
  const textPrimary = cfg ? cfg.titleColor : theme === "light" ? "#111" : "#fff";
  const textMuted   = cfg ? cfg.accentColor + "99" : theme === "light" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.35)";
  const inputBg     = cfg ? "rgba(255,255,255,0.18)" : theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.07)";
  const inputBorder = cfg ? cfg.cardBorder : theme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";

  // Password match indicator
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  async function handleSignup() {
    setError("");
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { setDone(true); }
  }

  if (done) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden transition-colors duration-500"
        style={{ background: pageBg }}>
        {(theme === "dark" || (isSeason && (season === "autumn" || season === "winter"))) && <CoinRain />}
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="rounded-2xl p-8 border" style={{ background: cardBg, borderColor: cardBorder, backdropFilter: "blur(12px)" }}>
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: textPrimary }}>Revisa tu email</h2>
            <p className="text-sm mb-6" style={{ color: textMuted }}>
              Te hemos enviado un enlace de confirmación a{" "}
              <span style={{ color: accentColor }}>{email}</span>.
            </p>
            <Link href="/auth/login" className="text-sm hover:underline" style={{ color: accentColor }}>
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden transition-colors duration-500"
      style={{ background: pageBg }}>
      {(theme === "dark" || (isSeason && (season === "autumn" || season === "winter"))) && <CoinRain />}

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleAuth />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl p-8 border transition-all" style={{ background: cardBg, borderColor: cardBorder, backdropFilter: "blur(12px)" }}>

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: accentColor }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>Finanzas</h1>
            <p className="text-sm mt-1" style={{ color: textMuted }}>Crea tu cuenta gratis</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: textMuted }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSignup()}
                placeholder="tu@email.com" autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                onFocus={e => e.target.style.borderColor = accentColor}
                onBlur={e => e.target.style.borderColor = inputBorder}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: textMuted }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSignup()}
                placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                onFocus={e => e.target.style.borderColor = accentColor}
                onBlur={e => e.target.style.borderColor = inputBorder}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5 flex items-center justify-between" style={{ color: textMuted }}>
                <span>Repite la contraseña</span>
                {passwordsMatch && <span className="text-green-400 normal-case tracking-normal">✓ Coinciden</span>}
                {passwordsMismatch && <span className="text-red-400 normal-case tracking-normal">✗ No coinciden</span>}
              </label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSignup()}
                placeholder="••••••••" autoComplete="new-password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: inputBg,
                  border: `1px solid ${passwordsMatch ? "#1D9E75" : passwordsMismatch ? "#E24B4A" : inputBorder}`,
                  color: textPrimary,
                }}
                onFocus={e => { if (!passwordsMatch && !passwordsMismatch) e.target.style.borderColor = accentColor; }}
                onBlur={e => { if (!passwordsMatch && !passwordsMismatch) e.target.style.borderColor = inputBorder; }}
              />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-xl">{error}</p>}

            <button onClick={handleSignup} disabled={loading || passwordsMismatch}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: accentColor }}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: textMuted }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="hover:underline" style={{ color: accentColor }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
