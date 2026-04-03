"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useTheme, SEASON_CONFIG, getSeason } from "../../components/ThemeProvider";
import Link from "next/link";

const BILLS = [
  { val: "10€",  bg: "#2d6a2d", text: "#7fff7f" },
  { val: "20€",  bg: "#1a4a7a", text: "#7fc8ff" },
  { val: "50€",  bg: "#7a4a00", text: "#ffd080" },
  { val: "100€", bg: "#4a1a1a", text: "#ff8080" },
  { val: "200€", bg: "#4a1a4a", text: "#ff80ff" },
  { val: "500€", bg: "#1a1a4a", text: "#8080ff" },
];

function BillRain() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const MAX = 0;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    function drop() {
      if (!scene || activeRef.current >= MAX) return;
      const b = BILLS[Math.floor(Math.random() * BILLS.length)];
      const el = document.createElement("div");
      const duration = 2.5 + Math.random() * 3;
      const width = 56 + Math.floor(Math.random() * 20);
      el.style.cssText = `
        position:absolute;top:-80px;left:${Math.random() * 90}%;
        width:${width}px;height:30px;border-radius:4px;
        background:${b.bg};color:${b.text};border:1px solid ${b.text}44;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;letter-spacing:.5px;
        opacity:${0.6 + Math.random() * 0.4};
        animation:billfall ${duration}s linear forwards;pointer-events:none;
      `;
      el.textContent = b.val;
      scene.appendChild(el);
      activeRef.current++;
      el.addEventListener("animationend", () => { el.remove(); activeRef.current--; });
    }

    const interval = setInterval(drop, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`@keyframes billfall{0%{transform:translateY(0) rotate(0deg)}100%{transform:translateY(110vh) rotate(720deg)}}`}</style>
      <div ref={sceneRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
    </>
  );
}

function ThemeToggleAuth() {
  const { theme, season, toggle } = useTheme();

  const icons = {
    light: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    dark:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    season: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a9 9 0 0 1 9 9c0 4.97-9 13-9 13S3 15.97 3 11a9 9 0 0 1 9-9z"/></svg>,
  };

  const labels = { light: "Claro", dark: "Oscuro", season: SEASON_CONFIG[season].label };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
      title={`Cambiar tema · ahora: ${labels[theme]}`}
    >
      {icons[theme]}
      <span>{labels[theme]}</span>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { theme, season } = useTheme();
  const isSeason = theme === "season";
  const cfg = isSeason ? SEASON_CONFIG[season] : null;

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const accentColor = cfg ? cfg.accentColor : "#1D9E75";
  const pageBg      = cfg ? cfg.bg : theme === "light" ? "#f5f5f5" : "#0a0a0a";
  const cardBg      = cfg ? cfg.cardBg : theme === "light" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.07)";
  const cardBorder  = cfg ? cfg.cardBorder : theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
  const textPrimary = cfg ? cfg.titleColor : theme === "light" ? "#111" : "#fff";
  const textMuted   = cfg ? cfg.accentColor + "99" : theme === "light" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.35)";
  const inputBg     = cfg ? "rgba(255,255,255,0.18)" : theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)";
  const inputBorder = cfg ? cfg.cardBorder : theme === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)";

  async function handleLogin() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/"); router.refresh(); }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden transition-colors duration-500"
      style={{ background: pageBg }}>
      {(theme === "dark" || (isSeason && (season === "autumn" || season === "winter"))) && <BillRain />}

      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleAuth />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl p-8 border transition-all" style={{ background: cardBg, borderColor: cardBorder, backdropFilter: "blur(12px)" }}>

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: accentColor }}>
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 21 L22 10 L18 23 Z" fill="white"/>
                <path d="M22 10 L18 23 L19.5 16.5 Z" fill="rgba(0,0,0,0.18)"/>
                <path d="M8 21 L19.5 16.5 L22 10 Z" fill="rgba(255,255,255,0.45)"/>
                <line x1="22.5" y1="9.5" x2="25.5" y2="6.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeDasharray="1.5,1.5" strokeLinecap="round"/>
                <circle cx="26.2" cy="5.8" r="1.2" fill="rgba(255,255,255,0.45)"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span style={{ color: textPrimary }}>spen</span><span style={{ color: accentColor }}>fly</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: textMuted }}>Tu dinero, bajo control</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: textMuted }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
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
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••" autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                onFocus={e => e.target.style.borderColor = accentColor}
                onBlur={e => e.target.style.borderColor = inputBorder}
              />
            </div>

            {error && <p className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-xl">{error}</p>}

            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: accentColor }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: textMuted }}>
            ¿No tienes cuenta?{" "}
            <Link href="/auth/signup" className="hover:underline" style={{ color: accentColor }}>Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
