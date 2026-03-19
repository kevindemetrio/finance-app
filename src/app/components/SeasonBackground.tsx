"use client";

import { useEffect, useRef } from "react";
import { Season } from "./ThemeProvider";

interface Props { season: Season; }

// ─── SVG scenes — viewBox 400×320, preserveAspectRatio xMidYMid slice ────────

const SPRING_SVG = `
  <rect width="400" height="320" fill="#f0f7ea"/>
  <circle cx="340" cy="-20" r="110" fill="#e8f5d0" opacity="0.9"/>
  <circle cx="340" cy="-20" r="75" fill="#d4eda8" opacity="0.7"/>
  <rect y="230" width="400" height="90" fill="#c8e8a0" opacity="0.5"/>
  <rect y="252" width="400" height="68" fill="#b8df88" opacity="0.55"/>
  <circle cx="28" cy="248" r="7" fill="#f9a8d4" opacity="0.85"/>
  <circle cx="28" cy="248" r="3" fill="#fce4ec" opacity="0.9"/>
  <circle cx="68" cy="242" r="7" fill="#fbcfe8" opacity="0.85"/>
  <circle cx="68" cy="242" r="3" fill="#fff" opacity="0.8"/>
  <circle cx="110" cy="250" r="7" fill="#f9a8d4" opacity="0.85"/>
  <circle cx="110" cy="250" r="3" fill="#fce4ec" opacity="0.9"/>
  <circle cx="152" cy="243" r="7" fill="#ddd6fe" opacity="0.85"/>
  <circle cx="152" cy="243" r="3" fill="#ede9fe" opacity="0.9"/>
  <circle cx="195" cy="249" r="7" fill="#f9a8d4" opacity="0.85"/>
  <circle cx="195" cy="249" r="3" fill="#fce4ec" opacity="0.9"/>
  <circle cx="238" cy="241" r="7" fill="#bbf7d0" opacity="0.85"/>
  <circle cx="238" cy="241" r="3" fill="#fff" opacity="0.8"/>
  <circle cx="280" cy="248" r="7" fill="#fbcfe8" opacity="0.85"/>
  <circle cx="280" cy="248" r="3" fill="#fff" opacity="0.8"/>
  <circle cx="322" cy="243" r="7" fill="#f9a8d4" opacity="0.85"/>
  <circle cx="322" cy="243" r="3" fill="#fce4ec" opacity="0.9"/>
  <circle cx="364" cy="248" r="7" fill="#ddd6fe" opacity="0.85"/>
  <circle cx="364" cy="248" r="3" fill="#ede9fe" opacity="0.9"/>
  <line x1="28" y1="255" x2="28" y2="275" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="68" y1="249" x2="68" y2="270" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="110" y1="257" x2="110" y2="276" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="152" y1="250" x2="152" y2="271" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="195" y1="256" x2="195" y2="274" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="238" y1="248" x2="238" y2="268" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="280" y1="255" x2="280" y2="274" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="322" y1="250" x2="322" y2="270" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <line x1="364" y1="255" x2="364" y2="274" stroke="#86c44a" stroke-width="1.5" opacity="0.7"/>
  <ellipse cx="80" cy="140" rx="6" ry="3" fill="#f9a8d4" opacity="0.5" transform="rotate(-25 80 140)"/>
  <ellipse cx="180" cy="100" rx="5" ry="2.5" fill="#fbcfe8" opacity="0.45" transform="rotate(15 180 100)"/>
  <ellipse cx="290" cy="155" rx="6" ry="3" fill="#f9a8d4" opacity="0.5" transform="rotate(35 290 155)"/>
  <ellipse cx="130" cy="190" rx="5" ry="2.5" fill="#ddd6fe" opacity="0.4" transform="rotate(-15 130 190)"/>
  <ellipse cx="350" cy="120" rx="6" ry="3" fill="#fbcfe8" opacity="0.45" transform="rotate(20 350 120)"/>
  <ellipse cx="55" cy="175" rx="5" ry="2.5" fill="#f9a8d4" opacity="0.4" transform="rotate(-40 55 175)"/>
  <ellipse cx="240" cy="80" rx="5" ry="2.5" fill="#ddd6fe" opacity="0.45" transform="rotate(10 240 80)"/>
`;

const SUMMER_SVG = `
  <rect width="400" height="320" fill="#e0f2fe"/>
  <rect width="400" height="200" fill="#bae6fd" opacity="0.5"/>
  <rect width="400" height="120" fill="#7dd3fc" opacity="0.35"/>
  <circle cx="200" cy="88" r="70" fill="#fde68a" opacity="0.25"/>
  <circle cx="200" cy="88" r="48" fill="#fde68a" opacity="0.4"/>
  <circle cx="200" cy="88" r="30" fill="#fcd34d" opacity="0.75"/>
  <circle cx="200" cy="88" r="16" fill="#fbbf24" opacity="0.95"/>
  <rect y="210" width="400" height="110" fill="#0369a1" opacity="0.55"/>
  <rect y="210" width="400" height="40" fill="#0ea5e9" opacity="0.6"/>
  <rect y="210" width="400" height="16" fill="#38bdf8" opacity="0.65"/>
  <path d="M0 222 Q50 217 100 222 Q150 227 200 222 Q250 217 300 222 Q350 227 400 222" fill="none" stroke="white" stroke-width="1.2" opacity="0.35"/>
  <path d="M0 234 Q60 229 120 234 Q180 239 240 234 Q300 229 360 234 Q380 237 400 234" fill="none" stroke="white" stroke-width="0.8" opacity="0.25"/>
  <rect y="196" width="400" height="18" fill="#fde68a" opacity="0.8"/>
  <ellipse cx="80" cy="255" rx="18" ry="8" fill="#f97316" opacity="0.55"/>
  <path d="M62 255 L50 248 L50 262 Z" fill="#f97316" opacity="0.55"/>
  <circle cx="90" cy="251" r="2.5" fill="#fff" opacity="0.8"/>
  <g transform="translate(310 15)">
    <ellipse cx="0" cy="255" rx="14" ry="6" fill="#06b6d4" opacity="0.45"/>
    <path d="M-18 255 L-28 250 L-28 260 Z" fill="#06b6d4" opacity="0.45"/>
    <circle cx="8" cy="252" r="2" fill="#fff" opacity="0.8"/>
  </g>
  <ellipse cx="300" cy="262" rx="16" ry="7" fill="#a855f7" opacity="0.4"/>
  <path d="M284 262 L273 256 L273 268 Z" fill="#a855f7" opacity="0.4"/>
  <circle cx="309" cy="259" r="2" fill="#fff" opacity="0.8"/>
  <g stroke="#fbbf24" stroke-width="1" opacity="0.3">
    <line x1="200" y1="20" x2="200" y2="50"/>
    <line x1="240" y1="30" x2="228" y2="52"/>
    <line x1="270" y1="58" x2="248" y2="66"/>
    <line x1="160" y1="30" x2="172" y2="52"/>
    <line x1="130" y1="58" x2="152" y2="66"/>
  </g>
`;

const AUTUMN_SVG = `
  <rect width="400" height="320" fill="#fef3c7"/>
  <rect width="400" height="200" fill="#fed7aa" opacity="0.4"/>
  <rect width="400" height="100" fill="#fdba74" opacity="0.2"/>
  <circle cx="320" cy="170" r="80" fill="#fde68a" opacity="0.18"/>
  <circle cx="320" cy="170" r="52" fill="#fcd34d" opacity="0.22"/>
  <circle cx="320" cy="170" r="30" fill="#f59e0b" opacity="0.35"/>
  <rect y="240" width="400" height="80" fill="#92400e" opacity="0.18"/>
  <ellipse cx="50" cy="265" rx="40" ry="14" fill="#d97706" opacity="0.5"/>
  <ellipse cx="130" cy="260" rx="55" ry="16" fill="#ea580c" opacity="0.45"/>
  <ellipse cx="240" cy="268" rx="62" ry="14" fill="#c2440a" opacity="0.4"/>
  <ellipse cx="360" cy="262" rx="48" ry="15" fill="#d97706" opacity="0.45"/>
  <rect x="22" y="160" width="7" height="80" fill="#78350f" opacity="0.6"/>
  <ellipse cx="25" cy="148" rx="22" ry="20" fill="#d97706" opacity="0.7"/>
  <ellipse cx="14" cy="158" rx="14" ry="13" fill="#ea580c" opacity="0.55"/>
  <ellipse cx="36" cy="155" rx="16" ry="14" fill="#f97316" opacity="0.5"/>
  <rect x="90" y="175" width="6" height="65" fill="#78350f" opacity="0.6"/>
  <ellipse cx="93" cy="163" rx="20" ry="18" fill="#f97316" opacity="0.65"/>
  <ellipse cx="83" cy="172" rx="13" ry="12" fill="#d97706" opacity="0.5"/>
  <rect x="165" y="155" width="8" height="85" fill="#78350f" opacity="0.6"/>
  <ellipse cx="169" cy="140" rx="28" ry="24" fill="#b45309" opacity="0.65"/>
  <ellipse cx="155" cy="152" rx="18" ry="16" fill="#d97706" opacity="0.55"/>
  <ellipse cx="183" cy="148" rx="20" ry="17" fill="#ea580c" opacity="0.5"/>
  <ellipse cx="70" cy="110" rx="6" ry="3.5" fill="#ea580c" opacity="0.7" transform="rotate(-25 70 110)"/>
  <ellipse cx="145" cy="85" rx="5" ry="3" fill="#d97706" opacity="0.65" transform="rotate(20 145 85)"/>
  <ellipse cx="230" cy="120" rx="6" ry="3.5" fill="#f97316" opacity="0.6" transform="rotate(-35 230 120)"/>
  <ellipse cx="290" cy="90" rx="5" ry="3" fill="#c2440a" opacity="0.65" transform="rotate(15 290 90)"/>
  <ellipse cx="355" cy="130" rx="6" ry="3.5" fill="#d97706" opacity="0.6" transform="rotate(30 355 130)"/>
  <ellipse cx="115" cy="195" rx="5" ry="3" fill="#ea580c" opacity="0.55" transform="rotate(-20 115 195)"/>
  <ellipse cx="340" cy="175" rx="6" ry="3.5" fill="#f97316" opacity="0.6" transform="rotate(-40 340 175)"/>
`;

const HALLOWEEN_SVG = `
  <rect width="400" height="320" fill="#1c0a00"/>
  <rect width="400" height="220" fill="#0d0520" opacity="0.8"/>
  <circle cx="300" cy="65" r="44" fill="#fef9c3" opacity="0.9"/>
  <circle cx="314" cy="54" r="36" fill="#1c0a00" opacity="0.75"/>
  <circle cx="30" cy="22" r="1.2" fill="#fef9c3" opacity="0.6"/>
  <circle cx="75" cy="10" r="0.9" fill="#fef9c3" opacity="0.6"/>
  <circle cx="120" cy="28" r="1.2" fill="#fef9c3" opacity="0.6"/>
  <circle cx="170" cy="14" r="0.9" fill="#fef9c3" opacity="0.6"/>
  <circle cx="215" cy="32" r="1.2" fill="#fef9c3" opacity="0.6"/>
  <circle cx="250" cy="8" r="0.9" fill="#fef9c3" opacity="0.6"/>
  <circle cx="45" cy="48" r="0.9" fill="#fef9c3" opacity="0.5"/>
  <circle cx="140" cy="55" r="1.2" fill="#fef9c3" opacity="0.5"/>
  <circle cx="190" cy="42" r="0.9" fill="#fef9c3" opacity="0.5"/>
  <circle cx="55" cy="78" r="1" fill="#fef9c3" opacity="0.5"/>
  <rect y="240" width="400" height="80" fill="#0d0520" opacity="0.9"/>
  <g stroke="#3d1a00" stroke-width="2.5" fill="none" stroke-linecap="round">
    <line x1="35" y1="320" x2="38" y2="190"/>
    <line x1="38" y1="230" x2="22" y2="205"/>
    <line x1="38" y1="218" x2="55" y2="200"/>
    <line x1="38" y1="205" x2="26" y2="188"/>
    <line x1="38" y1="205" x2="50" y2="192"/>
  </g>
  <g stroke="#3d1a00" stroke-width="2" fill="none" stroke-linecap="round">
    <line x1="370" y1="320" x2="367" y2="185"/>
    <line x1="367" y1="228" x2="382" y2="208"/>
    <line x1="367" y1="215" x2="352" y2="198"/>
    <line x1="367" y1="200" x2="378" y2="186"/>
  </g>
  <ellipse cx="75" cy="270" rx="18" ry="15" fill="#c2440a" opacity="0.9"/>
  <ellipse cx="75" cy="270" rx="12" ry="15" fill="#ea580c" opacity="0.45"/>
  <rect x="72" y="255" width="5" height="7" rx="2" fill="#166534"/>
  <polygon points="68,264 72,259 76,264" fill="#1c0a00"/>
  <polygon points="78,264 82,259 86,264" fill="#1c0a00"/>
  <path d="M68 272 Q75 278 82 272" fill="none" stroke="#1c0a00" stroke-width="1.5"/>
  <circle cx="70" cy="274" r="1.5" fill="#1c0a00"/>
  <circle cx="74" cy="276" r="1.5" fill="#1c0a00"/>
  <circle cx="78" cy="276" r="1.5" fill="#1c0a00"/>
  <circle cx="82" cy="274" r="1.5" fill="#1c0a00"/>
  <ellipse cx="340" cy="268" rx="15" ry="12" fill="#bf360c" opacity="0.9"/>
  <rect x="337" y="256" width="4" height="6" rx="2" fill="#166534"/>
  <polygon points="334,263 337,259 340,263" fill="#1c0a00"/>
  <polygon points="340,263 343,259 346,263" fill="#1c0a00"/>
  <path d="M155 95 Q148 88 140 93 Q148 90 155 95 Q162 90 170 93 Q162 88 155 95Z" fill="#0d0520" opacity="0.8"/>
  <path d="M255 70 Q249 64 242 68 Q249 66 255 70 Q261 66 268 68 Q261 64 255 70Z" fill="#0d0520" opacity="0.7"/>
  <ellipse cx="200" cy="245" rx="60" ry="20" fill="#f97316" opacity="0.06"/>
`;

const WINTER_SVG = `
  <rect width="400" height="320" fill="#f0f4ff"/>
  <rect width="400" height="220" fill="#dbeafe" opacity="0.55"/>
  <rect width="400" height="110" fill="#bfdbfe" opacity="0.35"/>
  <circle cx="200" cy="95" r="55" fill="#e0e7ff" opacity="0.45"/>
  <circle cx="200" cy="95" r="32" fill="#c7d2fe" opacity="0.55"/>
  <circle cx="200" cy="95" r="16" fill="#a5b4fc" opacity="0.65"/>
  <rect y="230" width="400" height="90" fill="#e0e7ff" opacity="0.7"/>
  <rect y="230" width="400" height="22" fill="#f0f4ff" opacity="0.9"/>
  <ellipse cx="60" cy="232" rx="65" ry="18" fill="white" opacity="0.75"/>
  <ellipse cx="200" cy="228" rx="90" ry="22" fill="white" opacity="0.85"/>
  <ellipse cx="355" cy="232" rx="70" ry="18" fill="white" opacity="0.75"/>
  <polygon points="55,232 72,175 89,232" fill="#166534" opacity="0.7"/>
  <polygon points="57,210 72,168 87,210" fill="#15803d" opacity="0.6"/>
  <polygon points="59,195 72,162 85,195" fill="#16a34a" opacity="0.55"/>
  <polygon points="52,234 72,172 92,234" fill="white" opacity="0.4"/>
  <rect x="68" y="232" width="8" height="14" fill="#92400e" opacity="0.5"/>
  <polygon points="170,232 190,162 210,232" fill="#166534" opacity="0.65"/>
  <polygon points="173,208 190,155 207,208" fill="#15803d" opacity="0.55"/>
  <polygon points="176,188 190,150 204,188" fill="#16a34a" opacity="0.5"/>
  <polygon points="167,234 190,159 213,234" fill="white" opacity="0.38"/>
  <rect x="186" y="232" width="8" height="14" fill="#92400e" opacity="0.45"/>
  <polygon points="315,232 332,178 349,232" fill="#166534" opacity="0.7"/>
  <polygon points="317,212 332,171 347,212" fill="#15803d" opacity="0.6"/>
  <polygon points="319,196 332,165 345,196" fill="#16a34a" opacity="0.55"/>
  <polygon points="312,234 332,175 352,234" fill="white" opacity="0.4"/>
  <rect x="328" y="232" width="8" height="14" fill="#92400e" opacity="0.5"/>
  <g stroke="#93c5fd" stroke-width="1" opacity="0.55">
    <line x1="120" y1="55" x2="120" y2="72"/><line x1="111" y1="63" x2="129" y2="63"/>
    <line x1="113" y1="57" x2="127" y2="71"/><line x1="127" y1="57" x2="113" y2="71"/>
  </g>
  <g stroke="#93c5fd" stroke-width="0.8" opacity="0.45">
    <line x1="290" y1="40" x2="290" y2="54"/><line x1="283" y1="47" x2="297" y2="47"/>
    <line x1="285" y1="42" x2="295" y2="52"/><line x1="295" y1="42" x2="285" y2="52"/>
  </g>
  <g stroke="#93c5fd" stroke-width="0.8" opacity="0.5">
    <line x1="355" y1="100" x2="355" y2="112"/><line x1="349" y1="106" x2="361" y2="106"/>
    <line x1="351" y1="102" x2="359" y2="110"/><line x1="359" y1="102" x2="351" y2="110"/>
  </g>
  <g stroke="#93c5fd" stroke-width="0.8" opacity="0.4">
    <line x1="50" y1="130" x2="50" y2="141"/><line x1="44" y1="135" x2="56" y2="135"/>
    <line x1="46" y1="131" x2="54" y2="139"/><line x1="54" y1="131" x2="46" y2="139"/>
  </g>
`;

const CHRISTMAS_SVG = `
  <rect width="400" height="320" fill="#0f172a"/>
  <rect width="400" height="240" fill="#020617" opacity="0.6"/>
  <circle cx="25" cy="18" r="1.2" fill="white" opacity="0.8"/>
  <circle cx="60" cy="8" r="0.9" fill="white" opacity="0.6"/>
  <circle cx="95" cy="25" r="1.2" fill="white" opacity="0.9"/>
  <circle cx="145" cy="12" r="0.9" fill="white" opacity="0.7"/>
  <circle cx="195" cy="30" r="1.2" fill="white" opacity="0.8"/>
  <circle cx="240" cy="10" r="0.9" fill="white" opacity="0.6"/>
  <circle cx="280" cy="22" r="1.2" fill="white" opacity="0.9"/>
  <circle cx="340" cy="16" r="0.9" fill="white" opacity="0.7"/>
  <circle cx="380" cy="35" r="1" fill="white" opacity="0.6"/>
  <circle cx="42" cy="55" r="0.9" fill="white" opacity="0.5"/>
  <circle cx="128" cy="48" r="1" fill="white" opacity="0.7"/>
  <circle cx="218" cy="55" r="0.9" fill="white" opacity="0.6"/>
  <circle cx="312" cy="42" r="1" fill="white" opacity="0.8"/>
  <polygon points="200,40 150,130 250,130" fill="#14532d" opacity="0.95"/>
  <polygon points="200,75 145,170 255,170" fill="#166534" opacity="0.95"/>
  <polygon points="200,115 138,210 262,210" fill="#15803d" opacity="0.95"/>
  <polygon points="200,40 150,130 250,130" fill="white" opacity="0.12"/>
  <polygon points="200,75 145,170 255,170" fill="white" opacity="0.1"/>
  <rect x="192" y="210" width="16" height="24" fill="#78350f" opacity="0.8"/>
  <circle cx="173" cy="120" r="5" fill="#ef4444" opacity="0.9"/>
  <circle cx="173" cy="120" r="8" fill="#ef4444" opacity="0.12"/>
  <circle cx="225" cy="118" r="5" fill="#eab308" opacity="0.9"/>
  <circle cx="225" cy="118" r="8" fill="#eab308" opacity="0.12"/>
  <circle cx="190" cy="155" r="5" fill="#3b82f6" opacity="0.9"/>
  <circle cx="190" cy="155" r="8" fill="#3b82f6" opacity="0.12"/>
  <circle cx="215" cy="158" r="5" fill="#ef4444" opacity="0.9"/>
  <circle cx="165" cy="160" r="4" fill="#eab308" opacity="0.85"/>
  <circle cx="240" cy="155" r="4" fill="#10b981" opacity="0.85"/>
  <circle cx="178" cy="96" r="4" fill="#3b82f6" opacity="0.85"/>
  <circle cx="220" cy="94" r="4" fill="#ef4444" opacity="0.85"/>
  <polygon points="200,30 203,40 213,40 205,46 208,56 200,50 192,56 195,46 187,40 197,40" fill="#fde047" opacity="0.95"/>
  <path d="M30 15 Q70 22 110 15 Q150 8 190 15 Q230 22 270 15 Q310 8 350 15 Q380 20 400 15" fill="none" stroke="#374151" stroke-width="0.8"/>
  <circle cx="55" cy="18" r="3" fill="#ef4444" opacity="0.85"/>
  <circle cx="55" cy="18" r="5" fill="#ef4444" opacity="0.15"/>
  <circle cx="110" cy="14" r="3" fill="#eab308" opacity="0.85"/>
  <circle cx="110" cy="14" r="5" fill="#eab308" opacity="0.15"/>
  <circle cx="165" cy="18" r="3" fill="#3b82f6" opacity="0.85"/>
  <circle cx="165" cy="18" r="5" fill="#3b82f6" opacity="0.15"/>
  <circle cx="220" cy="13" r="3" fill="#10b981" opacity="0.85"/>
  <circle cx="275" cy="17" r="3" fill="#ef4444" opacity="0.85"/>
  <circle cx="330" cy="12" r="3" fill="#eab308" opacity="0.85"/>
  <rect y="234" width="400" height="86" fill="#1e293b" opacity="0.8"/>
  <ellipse cx="100" cy="236" rx="90" ry="16" fill="#e2e8f0" opacity="0.3"/>
  <ellipse cx="300" cy="238" rx="100" ry="14" fill="#e2e8f0" opacity="0.25"/>
`;

const SCENE_SVG: Record<Season, string> = {
  spring:    SPRING_SVG,
  summer:    SUMMER_SVG,
  autumn:    AUTUMN_SVG,
  halloween: HALLOWEEN_SVG,
  winter:    WINTER_SVG,
  christmas: CHRISTMAS_SVG,
};

// ─── Particles ────────────────────────────────────────────────────────────────

function makeParticle(season: Season): string {
  const r = Math.random;
  if (season === "halloween") season = "autumn" as Season;
  if (season === "christmas") season = "winter" as Season;
  if (season === "spring") {
    const types = [
      () => { const c = ["#f9a8d4","#fbcfe8","#ddd6fe","white"][Math.floor(r()*4)]; return `<svg width="12" height="9" viewBox="0 0 20 14"><ellipse cx="10" cy="7" rx="9" ry="5" fill="${c}" opacity="${(.5+r()*.4).toFixed(2)}" transform="rotate(${Math.round(r()*60-30)} 10 7)"/></svg>`; },
      () => `<svg width="11" height="11" viewBox="0 0 20 20"><path d="M10 1 Q18 8 10 15 Q2 8 10 1Z" fill="#86c44a" opacity="${(.4+r()*.35).toFixed(2)}" transform="rotate(${Math.round(r()*60-30)} 10 8)"/></svg>`,
    ];
    return types[Math.floor(r()*types.length)]();
  }
  if (season === "summer") {
    const s = Math.round(5+r()*5);
    return `<svg width="${s}" height="${s}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#fbbf24" opacity="${(.2+r()*.3).toFixed(2)}"/></svg>`;
  }
  if (season === "autumn") {
    const c = ["#ea580c","#d97706","#c2440a","#f97316","#b45309"][Math.floor(r()*5)];
    return `<svg width="13" height="10" viewBox="0 0 20 16"><ellipse cx="10" cy="8" rx="8" ry="4" fill="${c}" opacity="${(.6+r()*.3).toFixed(2)}" transform="rotate(${Math.round(r()*60-30)} 10 8)"/></svg>`;
  }
  const s = Math.round(6+r()*8);
  return `<svg width="${s}" height="${s}" viewBox="0 0 10 10"><g stroke="white" stroke-width="1.2" opacity="${(.4+r()*.5).toFixed(2)}"><line x1="5" y1="0" x2="5" y2="10"/><line x1="0" y1="5" x2="10" y2="5"/><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></g></svg>`;
}

const PARTICLE_CONFIG: Record<Season, { max: number; interval: number; duration: [number, number] }> = {
  spring:    { max: 10, interval: 500, duration: [4, 8] },
  summer:    { max: 5,  interval: 900, duration: [5, 9] },
  autumn:    { max: 12, interval: 350, duration: [3.5, 7] },
  halloween: { max: 14, interval: 300, duration: [3.5, 7] },
  winter:    { max: 12, interval: 320, duration: [4, 8] },
  christmas: { max: 20, interval: 220, duration: [4, 8] },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SeasonBackground({ season }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef    = useRef(0);
  const intervalRef  = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cfg = PARTICLE_CONFIG[season];
    activeRef.current = 0;

    function spawn() {
      if (!container || activeRef.current >= cfg.max) return;
      const el = document.createElement("div");
      const dur = cfg.duration[0] + Math.random() * (cfg.duration[1] - cfg.duration[0]);
      el.style.cssText = `position:absolute;top:-20px;left:${(Math.random()*96).toFixed(1)}%;pointer-events:none;z-index:1;animation:seasonfall ${dur.toFixed(1)}s linear forwards;animation-delay:${(Math.random()*1.5).toFixed(1)}s`;
      el.innerHTML = makeParticle(season);
      container.appendChild(el);
      activeRef.current++;
      el.addEventListener("animationend", () => { el.remove(); activeRef.current--; });
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
          0%   { transform: translateY(0)     rotate(0deg)   translateX(0); }
          25%  { transform: translateY(25vh)  rotate(90deg)  translateX(14px); }
          50%  { transform: translateY(50vh)  rotate(180deg) translateX(-10px); }
          75%  { transform: translateY(75vh)  rotate(270deg) translateX(12px); }
          100% { transform: translateY(110vh) rotate(360deg) translateX(0); }
        }
      `}</style>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 400 320"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: SCENE_SVG[season] }}
        />
      </div>
    </>
  );
}
