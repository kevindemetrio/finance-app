"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
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
  const MAX = 40;

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
        position:absolute;
        top:-80px;
        left:${Math.random() * 90}%;
        width:${width}px;
        height:30px;
        border-radius:4px;
        background:${b.bg};
        color:${b.text};
        border:1px solid ${b.text}44;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:11px;
        font-weight:700;
        letter-spacing:.5px;
        opacity:${0.6 + Math.random() * 0.4};
        animation:billfall ${duration}s linear forwards;
        pointer-events:none;
      `;
      el.textContent = b.val;
      scene.appendChild(el);
      activeRef.current++;
      el.addEventListener("animationend", () => {
        el.remove();
        activeRef.current--;
      });
    }

    const interval = setInterval(drop, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes billfall {
          0%   { transform: translateY(0) rotate(0deg) rotateY(0deg); }
          100% { transform: translateY(110vh) rotate(720deg) rotateY(360deg); }
        }
      `}</style>
      <div
        ref={sceneRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      />
    </>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

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
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 overflow-hidden">
      <BillRain />

      <div className="relative z-10 w-full max-w-sm">
        <div
          className="rounded-2xl p-8 border"
          style={{
            background: "rgba(255,255,255,0.07)",
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-[#1D9E75] flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Finanzas</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Tu dinero, bajo control
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
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="tu@email.com"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => e.target.style.borderColor = "#1D9E75"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
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
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => e.target.style.borderColor = "#1D9E75"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#1D9E75" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#17896a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#1D9E75")}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>

          <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.3)" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/auth/signup" className="text-[#1D9E75] hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}