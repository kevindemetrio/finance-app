"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useTheme } from "../../components/ThemeProvider";
import { GoogleAuthButton } from "../../components/GoogleAuthButton";
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
  const MAX = 0;

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
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark" || theme === "season";

  function handleToggle() {
    toggle();
    if (theme === "dark") toggle();
  }

  const btnStyle = isDark
    ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
    : { background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.1)" };

  const SunIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
      style={btnStyle}
      title={`Cambiar tema · ahora: ${isDark ? "Oscuro" : "Claro"}`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span>{isDark ? "Claro" : "Oscuro"}</span>
    </button>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const accentColor = "#1D9E75";
  const pageBg      = theme === "light" ? "#FDFBF7" : "#0a0a0a";
  const cardBg      = theme === "light" ? "#FFFFFF" : "rgba(255,255,255,0.07)";
  const cardBorder  = theme === "light" ? "#E8E2D8" : "rgba(255,255,255,0.12)";
  const textPrimary = theme === "light" ? "#2D2A26" : "#fff";
  const textMuted   = theme === "light" ? "#6B6560" : "rgba(255,255,255,0.35)";
  const inputBg     = theme === "light" ? "#F5F0E8" : "rgba(255,255,255,0.08)";
  const inputBorder = theme === "light" ? "#E8E2D8" : "rgba(255,255,255,0.12)";

  const passwordsMatch    = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  async function handleSignup() {
    setError("");
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    // Sign out immediately so the middleware doesn't redirect to / before email confirmation
    await supabase.auth.signOut();
    router.push("/auth/login?registered=1");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden transition-colors duration-500"
      style={{ background: pageBg }}>
      {theme === "dark" && <CoinRain />}

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggleAuth />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl p-8 border transition-all" style={{ background: cardBg, borderColor: cardBorder, backdropFilter: "blur(12px)" }}>

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 512 512" fill="none">
                <rect width="512" height="512" rx="88" fill="#1D9E75"/>
                <polygon points="96,340 416,190 326,406" fill="white"/>
                <polygon points="96,340 326,406 308,272" fill="black" opacity="0.20"/>
                <polygon points="96,340 416,190 308,272" fill="white" opacity="0.40"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span style={{ color: textPrimary }}>spen</span><span style={{ color: accentColor }}>fly</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: textMuted }}>Crea tu cuenta gratis</p>
          </div>

          {/* Google OAuth */}
          <div className="mb-5">
            <GoogleAuthButton mode="signup" inputBg={inputBg} inputBorder={inputBorder} textPrimary={textPrimary} />
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px" style={{ background: inputBorder }} />
              <span className="text-xs" style={{ color: textMuted }}>o con email</span>
              <div className="flex-1 h-px" style={{ background: inputBorder }} />
            </div>
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
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignup()}
                  placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-colors"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
                  onFocus={e => e.target.style.borderColor = accentColor}
                  onBlur={e => e.target.style.borderColor = inputBorder}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: textMuted }} tabIndex={-1}>
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5 flex items-center justify-between" style={{ color: textMuted }}>
                <span>Repite la contraseña</span>
                {passwordsMatch    && <span className="text-green-400 normal-case tracking-normal">✓ Coinciden</span>}
                {passwordsMismatch && <span className="text-red-400 normal-case tracking-normal">✗ No coinciden</span>}
              </label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignup()}
                  placeholder="••••••••" autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-colors"
                  style={{
                    background: inputBg,
                    border: `1px solid ${passwordsMatch ? "#1D9E75" : passwordsMismatch ? "#E24B4A" : inputBorder}`,
                    color: textPrimary,
                  }}
                  onFocus={e => { if (!passwordsMatch && !passwordsMismatch) e.target.style.borderColor = accentColor; }}
                  onBlur={e => { if (!passwordsMatch && !passwordsMismatch) e.target.style.borderColor = inputBorder; }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: textMuted }} tabIndex={-1}>
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
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

function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
