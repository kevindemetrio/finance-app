"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";
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
  const MAX = 30;

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
        position:absolute;
        top:-60px;
        left:${Math.random() * 92}%;
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${c.bg};
        border:2px solid ${c.border};
        color:${c.text};
        font-size:${Math.round(size * 0.45)}px;
        font-weight:800;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:inset 0 2px 3px rgba(255,255,255,0.3);
        opacity:${0.7 + Math.random() * 0.3};
        animation:coindrop ${dur}s linear forwards;
        pointer-events:none;
      `;
      el.textContent = c.char;
      scene.appendChild(el);
      activeRef.current++;
      el.addEventListener("animationend", () => {
        el.remove();
        activeRef.current--;
      });
    }

    const interval = setInterval(drop, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes coindrop {
          0%   { transform: translateY(0) rotateY(0deg) rotate(0deg); }
          100% { transform: translateY(110vh) rotateY(1080deg) rotate(360deg); }
        }
      `}</style>
      <div
        ref={sceneRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      />
    </>
  );
}

export default function SignupPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

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
      <div className="relative min-h-screen bg-[#0d0a00] flex items-center justify-center px-4 overflow-hidden">
        <CoinRain />
        <div className="relative z-10 w-full max-w-sm text-center">
          <div
            className="rounded-2xl p-8 border"
            style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-lg font-semibold text-white mb-2">Revisa tu email</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              Te hemos enviado un enlace de confirmación a{" "}
              <span className="text-[#BA7517]">{email}</span>.
              Haz clic en el enlace para activar tu cuenta.
            </p>
            <Link
              href="/auth/login"
              className="text-sm text-[#BA7517] hover:underline"
            >
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0d0a00] flex items-center justify-center px-4 overflow-hidden">
      <CoinRain />

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="rounded-2xl p-8 border"
          style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#BA7517] flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Finanzas</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Crea tu cuenta gratis
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                placeholder="tu@email.com"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => e.target.style.borderColor = "#BA7517"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => e.target.style.borderColor = "#BA7517"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#BA7517" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#9a6012")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#BA7517")}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.3)" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="text-[#BA7517] hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}