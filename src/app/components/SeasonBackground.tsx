"use client";

import { useEffect, useRef } from "react";
import { Season } from "./ThemeProvider";

interface Props {
  season: Season;
}

// ─── SVG scenes ───────────────────────────────────────────────────────────────

const SPRING_SVG = `
<rect width="100%" height="100%" fill="#e8f5e0"/>
<ellipse cx="8%" cy="12%" rx="12%" ry="5%" fill="white" opacity="0.45"/>
<ellipse cx="20%" cy="10%" rx="9%" ry="4%" fill="white" opacity="0.45"/>
<ellipse cx="70%" cy="8%" rx="14%" ry="5%" fill="white" opacity="0.4"/>
<ellipse cx="85%" cy="6%" rx="10%" ry="4%" fill="white" opacity="0.4"/>
<circle cx="92%" cy="10%" r="6%" fill="#fff176" opacity="0.65"/>
<circle cx="92%" cy="10%" r="4%" fill="#ffee58" opacity="0.7"/>
<ellipse cx="25%" cy="80%" rx="35%" ry="12%" fill="#b8e096" opacity="0.5"/>
<ellipse cx="80%" cy="82%" rx="38%" ry="11%" fill="#a5d880" opacity="0.45"/>
<rect y="86%" width="100%" height="14%" fill="#7dc954"/>
<rect y="86%" width="100%" height="4%" fill="#95d96a" opacity="0.8"/>
<line x1="5%" y1="86%" x2="4.5%" y2="82%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="4.5%" cy="81%" r="1.2%" fill="#f48fb1"/>
<line x1="14%" y1="86%" x2="14.5%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="14.5%" cy="80%" r="1.2%" fill="#fff176"/>
<line x1="25%" y1="86%" x2="24.5%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="24.5%" cy="80%" r="1.2%" fill="#f06292"/>
<line x1="36%" y1="86%" x2="36%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="36%" cy="80%" r="1.2%" fill="#fff176"/>
<line x1="48%" y1="86%" x2="48.5%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="48.5%" cy="80%" r="1.2%" fill="#f48fb1"/>
<line x1="60%" y1="86%" x2="59.5%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="59.5%" cy="80%" r="1.2%" fill="#fff176"/>
<line x1="72%" y1="86%" x2="72%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="72%" cy="80%" r="1.2%" fill="#f06292"/>
<line x1="83%" y1="86%" x2="83.5%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="83.5%" cy="80%" r="1.2%" fill="#f48fb1"/>
<line x1="94%" y1="86%" x2="93.5%" y2="81%" stroke="#4a9a2a" stroke-width="1.5"/>
<circle cx="93.5%" cy="80%" r="1.2%" fill="#fff176"/>
<path d="M32% 55% Q35% 50% 38% 55% Q41% 50% 44% 55% Q41% 60% 38% 57% Q35% 60% 32% 55%Z" fill="#f48fb1" opacity="0.5"/>
<path d="M62% 42% Q65% 37% 68% 42% Q71% 37% 74% 42% Q71% 47% 68% 44% Q65% 47% 62% 42%Z" fill="#ce93d8" opacity="0.45"/>
`;

const SUMMER_SVG = `
<rect width="100%" height="100%" fill="#fff8e1"/>
<rect width="100%" height="60%" fill="#fed7aa" opacity="0.3"/>
<circle cx="50%" cy="18%" r="14%" fill="#fbbf24" opacity="0.5"/>
<circle cx="50%" cy="18%" r="10%" fill="#f59e0b" opacity="0.65"/>
<line x1="50%" y1="2%" x2="50%" y2="5%" stroke="#f59e0b" stroke-width="2.5" opacity="0.5"/>
<line x1="50%" y1="31%" x2="50%" y2="34%" stroke="#f59e0b" stroke-width="2.5" opacity="0.5"/>
<line x1="34%" y1="18%" x2="37%" y2="18%" stroke="#f59e0b" stroke-width="2.5" opacity="0.5"/>
<line x1="63%" y1="18%" x2="66%" y2="18%" stroke="#f59e0b" stroke-width="2.5" opacity="0.5"/>
<line x1="38%" y1="6%" x2="40%" y2="9%" stroke="#f59e0b" stroke-width="2" opacity="0.5"/>
<line x1="60%" y1="27%" x2="62%" y2="30%" stroke="#f59e0b" stroke-width="2" opacity="0.5"/>
<line x1="62%" y1="6%" x2="60%" y2="9%" stroke="#f59e0b" stroke-width="2" opacity="0.5"/>
<line x1="40%" y1="27%" x2="38%" y2="30%" stroke="#f59e0b" stroke-width="2" opacity="0.5"/>
<rect y="76%" width="100%" height="24%" fill="#38bdf8" opacity="0.5"/>
<rect y="76%" width="100%" height="5%" fill="#7dd3fc" opacity="0.4"/>
<path d="M0 79% Q10% 77% 20% 79% Q30% 81% 40% 79% Q50% 77% 60% 79% Q70% 81% 80% 79% Q90% 77% 100% 79%" fill="none" stroke="white" stroke-width="1.5" opacity="0.4"/>
<rect y="73%" width="100%" height="4%" fill="#fde68a"/>
<line x1="15%" y1="73%" x2="15%" y2="66%" stroke="#dc2626" stroke-width="1.5"/>
<path d="M9% 68% Q15% 65% 21% 68%" fill="#ef4444" opacity="0.75"/>
<line x1="75%" y1="73%" x2="75%" y2="65%" stroke="#1d4ed8" stroke-width="1.5"/>
<path d="M69% 67% Q75% 64% 81% 67%" fill="#3b82f6" opacity="0.75"/>
<ellipse cx="25%" cy="52%" rx="10%" ry="3.5%" fill="white" opacity="0.35"/>
<ellipse cx="82%" cy="45%" rx="12%" ry="3.5%" fill="white" opacity="0.3"/>
`;

const AUTUMN_SVG = `
<rect width="100%" height="100%" fill="#fff7ed"/>
<rect width="100%" height="65%" fill="#fed7aa" opacity="0.25"/>
<circle cx="85%" cy="26%" r="9%" fill="#fb923c" opacity="0.45"/>
<rect y="75%" width="100%" height="25%" fill="#92400e" opacity="0.3"/>
<ellipse cx="10%" cy="75%" rx="15%" ry="5%" fill="#d97706" opacity="0.5"/>
<ellipse cx="38%" cy="75%" rx="18%" ry="4.5%" fill="#ea580c" opacity="0.45"/>
<ellipse cx="72%" cy="75%" rx="20%" ry="5.5%" fill="#c2440a" opacity="0.4"/>
<rect x="4%" y="55%" width="1.8%" height="20%" fill="#44190a"/>
<ellipse cx="4.9%" cy="52%" rx="5.5%" ry="4.5%" fill="#c2440a"/>
<ellipse cx="4.9%" cy="50%" rx="4%" ry="3%" fill="#ea580c"/>
<rect x="16%" y="58%" width="1.5%" height="17%" fill="#44190a"/>
<ellipse cx="16.75%" cy="55%" rx="4.5%" ry="3.8%" fill="#d97706"/>
<ellipse cx="16.75%" cy="53%" rx="3.2%" ry="2.5%" fill="#f97316"/>
<rect x="28%" y="52%" width="2%" height="23%" fill="#44190a"/>
<ellipse cx="29%" cy="49%" rx="6%" ry="5%" fill="#b45309"/>
<ellipse cx="29%" cy="47%" rx="4.5%" ry="3.5%" fill="#d97706"/>
<rect x="46%" y="56%" width="1.8%" height="19%" fill="#44190a"/>
<ellipse cx="46.9%" cy="53%" rx="5%" ry="4%" fill="#ea580c"/>
<ellipse cx="46.9%" cy="51%" rx="3.5%" ry="2.8%" fill="#f97316"/>
<rect x="61%" y="54%" width="2%" height="21%" fill="#44190a"/>
<ellipse cx="62%" cy="51%" rx="6%" ry="4.8%" fill="#c2440a"/>
<ellipse cx="62%" cy="49%" rx="4.2%" ry="3.2%" fill="#d97706"/>
<rect x="77%" y="57%" width="1.8%" height="18%" fill="#44190a"/>
<ellipse cx="77.9%" cy="54%" rx="4.8%" ry="3.8%" fill="#b45309"/>
<ellipse cx="77.9%" cy="52%" rx="3.3%" ry="2.5%" fill="#ea580c"/>
<rect x="90%" y="55%" width="1.5%" height="20%" fill="#44190a"/>
<ellipse cx="90.75%" cy="52%" rx="5%" ry="4%" fill="#d97706"/>
<ellipse cx="90.75%" cy="50%" rx="3.5%" ry="2.8%" fill="#f97316"/>
`;

const WINTER_SVG = `
<rect width="100%" height="100%" fill="#dbeafe"/>
<rect width="100%" height="65%" fill="#1e3a5f" opacity="0.38"/>
<circle cx="75%" cy="13%" r="7%" fill="#e0e7ff" opacity="0.9"/>
<circle cx="77%" cy="11%" r="5.5%" fill="#1e3a5f" opacity="0.55"/>
<circle cx="10%" cy="5%" r="0.4%" fill="white" opacity="0.8"/>
<circle cx="22%" cy="2.5%" r="0.3%" fill="white" opacity="0.7"/>
<circle cx="35%" cy="6%" r="0.4%" fill="white" opacity="0.8"/>
<circle cx="48%" cy="3%" r="0.3%" fill="white" opacity="0.7"/>
<circle cx="16%" cy="10%" r="0.3%" fill="white" opacity="0.5"/>
<circle cx="42%" cy="11%" r="0.4%" fill="white" opacity="0.7"/>
<circle cx="58%" cy="4.5%" r="0.3%" fill="white" opacity="0.6"/>
<circle cx="65%" cy="9%" r="0.4%" fill="white" opacity="0.7"/>
<rect y="75%" width="100%" height="25%" fill="#bfdbfe"/>
<ellipse cx="15%" cy="75%" rx="18%" ry="5.5%" fill="white" opacity="0.75"/>
<ellipse cx="50%" cy="74.5%" rx="22%" ry="6%" fill="white" opacity="0.8"/>
<ellipse cx="88%" cy="75%" rx="19%" ry="5.5%" fill="white" opacity="0.75"/>
<polygon points="7%,75% 10%,65% 13%,75%" fill="#166534" opacity="0.8"/>
<polygon points="7.5%,71% 10%,62% 12.5%,71%" fill="#16a34a" opacity="0.7"/>
<polygon points="22%,75% 25.5%,64% 29%,75%" fill="#166534" opacity="0.8"/>
<polygon points="22.5%,70% 25.5%,61% 28.5%,70%" fill="#16a34a" opacity="0.7"/>
<polygon points="77%,75% 80%,65% 83%,75%" fill="#166534" opacity="0.8"/>
<polygon points="77.5%,71% 80%,62% 82.5%,71%" fill="#16a34a" opacity="0.7"/>
<polygon points="90%,75% 93%,66% 96%,75%" fill="#166534" opacity="0.75"/>
<polygon points="90.5%,71% 93%,63% 95.5%,71%" fill="#16a34a" opacity="0.65"/>
<ellipse cx="10%" cy="50%" rx="11%" ry="3.5%" fill="white" opacity="0.3"/>
<ellipse cx="45%" cy="42%" rx="13%" ry="3.5%" fill="white" opacity="0.28"/>
<ellipse cx="85%" cy="47%" rx="12%" ry="3.5%" fill="white" opacity="0.3"/>
`;

const SCENE_SVG: Record<Season, string> = {
  spring: SPRING_SVG,
  summer: SUMMER_SVG,
  autumn: AUTUMN_SVG,
  winter: WINTER_SVG,
};

// ─── Particle generators ──────────────────────────────────────────────────────

function makeParticle(season: Season): string {
  const r = () => Math.random();
  if (season === "spring") {
    const colors = ["#6ab04c", "#7ec850", "#55a630", "#a8e063"];
    const c = colors[Math.floor(r() * colors.length)];
    const rot = Math.round(r() * 60 - 30);
    return `<svg width="13" height="13" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="8" ry="4" fill="${c}" opacity="${(0.6 + r() * 0.35).toFixed(2)}" transform="rotate(${rot} 10 10)"/></svg>`;
  }
  if (season === "summer") {
    const s = Math.round(5 + r() * 6);
    return `<svg width="${s}" height="${s}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#fbbf24" opacity="${(0.3 + r() * 0.4).toFixed(2)}"/></svg>`;
  }
  if (season === "autumn") {
    const colors = ["#ea580c", "#d97706", "#c2440a", "#f97316", "#b45309"];
    const c = colors[Math.floor(r() * colors.length)];
    const rot = Math.round(r() * 60 - 30);
    return `<svg width="14" height="11" viewBox="0 0 20 16"><ellipse cx="10" cy="8" rx="8" ry="4" fill="${c}" opacity="${(0.7 + r() * 0.3).toFixed(2)}" transform="rotate(${rot} 10 8)"/><line x1="10" y1="4" x2="10" y2="12" stroke="${c}" stroke-width="0.8" opacity="0.5"/></svg>`;
  }
  // winter — snowflake
  const s = Math.round(7 + r() * 8);
  return `<svg width="${s}" height="${s}" viewBox="0 0 10 10"><g stroke="white" stroke-width="1.2" opacity="${(0.5 + r() * 0.5).toFixed(2)}"><line x1="5" y1="0" x2="5" y2="10"/><line x1="0" y1="5" x2="10" y2="5"/><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></g></svg>`;
}

const PARTICLE_CONFIG: Record<Season, { max: number; interval: number; duration: [number, number] }> = {
  spring: { max: 10, interval: 500, duration: [4, 8] },
  summer: { max: 8,  interval: 700, duration: [5, 9] },
  autumn: { max: 14, interval: 320, duration: [3.5, 7] },
  winter: { max: 18, interval: 240, duration: [4, 8] },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SeasonBackground({ season }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cfg = PARTICLE_CONFIG[season];
    activeRef.current = 0;

    function spawn() {
      if (!container || activeRef.current >= cfg.max) return;
      const el = document.createElement("div");
      const dur = cfg.duration[0] + Math.random() * (cfg.duration[1] - cfg.duration[0]);
      el.style.cssText = `
        position:absolute;
        top:-20px;
        left:${Math.random() * 96}%;
        pointer-events:none;
        z-index:1;
        animation:seasonfall ${dur.toFixed(1)}s linear forwards;
        animation-delay:${(Math.random() * 1.5).toFixed(1)}s;
      `;
      el.innerHTML = makeParticle(season);
      container.appendChild(el);
      activeRef.current++;
      el.addEventListener("animationend", () => {
        el.remove();
        activeRef.current--;
      });
    }

    intervalRef.current = setInterval(spawn, cfg.interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      container.querySelectorAll("div").forEach(el => el.remove());
      activeRef.current = 0;
    };
  }, [season]);

  return (
    <>
      <style>{`
        @keyframes seasonfall {
          0%   { transform: translateY(0)    rotate(0deg)   translateX(0); }
          25%  { transform: translateY(25vh) rotate(90deg)  translateX(14px); }
          50%  { transform: translateY(50vh) rotate(180deg) translateX(-10px); }
          75%  { transform: translateY(75vh) rotate(270deg) translateX(12px); }
          100% { transform: translateY(105vh) rotate(360deg) translateX(0); }
        }
      `}</style>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: SCENE_SVG[season] }}
        />
      </div>
    </>
  );
}
