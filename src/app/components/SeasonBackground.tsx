"use client";

import { useEffect, useRef } from "react";
import { Season } from "./ThemeProvider";

interface Props { season: Season; }

const SPRING_SVG = `
  <rect width="100%" height="100%" fill="#dff0d4"/>
  <rect width="100%" height="65%" fill="#e8f5e0" opacity="0.6"/>
  <circle cx="92%" cy="10%" r="6%" fill="#fff176" opacity="0.65"/>
  <circle cx="92%" cy="10%" r="4.2%" fill="#ffee58" opacity="0.75"/>
  <ellipse cx="8%" cy="12%" rx="12%" ry="4.5%" fill="white" opacity="0.5"/>
  <ellipse cx="20%" cy="10%" rx="9%" ry="4%" fill="white" opacity="0.5"/>
  <ellipse cx="58%" cy="8%" rx="14%" ry="4.5%" fill="white" opacity="0.42"/>
  <ellipse cx="70%" cy="6%" rx="10%" ry="3.5%" fill="white" opacity="0.4"/>
  <!-- cherry blossom tree left -->
  <line x1="12%" y1="100%" x2="12%" y2="60%" stroke="#5d4037" stroke-width="1.2%"/>
  <line x1="12%" y1="75%" x2="7%" y2="68%" stroke="#5d4037" stroke-width="0.7%"/>
  <line x1="12%" y1="70%" x2="17%" y2="64%" stroke="#5d4037" stroke-width="0.7%"/>
  <circle cx="12%" cy="55%" r="9%" fill="#f8bbd0" opacity="0.55"/>
  <circle cx="8%" cy="60%" r="6%" fill="#f48fb1" opacity="0.6"/>
  <circle cx="16%" cy="58%" r="7%" fill="#f48fb1" opacity="0.55"/>
  <circle cx="12%" cy="50%" r="6%" fill="#fce4ec" opacity="0.65"/>
  <!-- cherry blossom tree right -->
  <line x1="85%" y1="100%" x2="85%" y2="55%" stroke="#5d4037" stroke-width="1.2%"/>
  <line x1="85%" y1="72%" x2="79%" y2="65%" stroke="#5d4037" stroke-width="0.7%"/>
  <line x1="85%" y1="67%" x2="91%" y2="61%" stroke="#5d4037" stroke-width="0.7%"/>
  <circle cx="85%" cy="50%" r="10%" fill="#f48fb1" opacity="0.5"/>
  <circle cx="80%" cy="55%" r="7%" fill="#f8bbd0" opacity="0.55"/>
  <circle cx="90%" cy="53%" r="7%" fill="#f8bbd0" opacity="0.5"/>
  <circle cx="85%" cy="45%" r="6.5%" fill="#fce4ec" opacity="0.6"/>
  <!-- rolling hills -->
  <ellipse cx="25%" cy="88%" rx="35%" ry="12%" fill="#9ed86a" opacity="0.55"/>
  <ellipse cx="78%" cy="90%" rx="40%" ry="11%" fill="#8ecf58" opacity="0.5"/>
  <!-- ground -->
  <rect y="88%" width="100%" height="12%" fill="#6db83e"/>
  <rect y="88%" width="100%" height="3.5%" fill="#80cc50" opacity="0.8"/>
  <!-- flowers row -->
  <line x1="5%" y1="88%" x2="4.8%" y2="84%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="4.8%" cy="83%" r="1.1%" fill="#f48fb1"/><circle cx="4.8%" cy="83%" r="0.6%" fill="#fce4ec"/>
  <line x1="15%" y1="88%" x2="15.2%" y2="83%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="15.2%" cy="82%" r="1.1%" fill="#fff176"/><circle cx="15.2%" cy="82%" r="0.6%" fill="#fff9c4"/>
  <line x1="28%" y1="88%" x2="27.8%" y2="84%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="27.8%" cy="83%" r="1.1%" fill="#f06292"/><circle cx="27.8%" cy="83%" r="0.6%" fill="#fce4ec"/>
  <line x1="42%" y1="88%" x2="42%" y2="83%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="42%" cy="82%" r="1.1%" fill="#fff176"/><circle cx="42%" cy="82%" r="0.6%" fill="#fff9c4"/>
  <line x1="55%" y1="88%" x2="55.2%" y2="83%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="55.2%" cy="82%" r="1.1%" fill="#f48fb1"/><circle cx="55.2%" cy="82%" r="0.6%" fill="#fce4ec"/>
  <line x1="68%" y1="88%" x2="67.8%" y2="84%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="67.8%" cy="83%" r="1.1%" fill="#fff176"/><circle cx="67.8%" cy="83%" r="0.6%" fill="#fff9c4"/>
  <line x1="78%" y1="88%" x2="78%" y2="83%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="78%" cy="82%" r="1.1%" fill="#f06292"/><circle cx="78%" cy="82%" r="0.6%" fill="#fce4ec"/>
  <line x1="92%" y1="88%" x2="92.2%" y2="83%" stroke="#3d8c1e" stroke-width="0.4%"/>
  <circle cx="92.2%" cy="82%" r="1.1%" fill="#f48fb1"/><circle cx="92.2%" cy="82%" r="0.6%" fill="#fce4ec"/>
`;

const SUMMER_SVG = `
  <rect width="100%" height="100%" fill="#e0f7fa"/>
  <rect width="100%" height="58%" fill="#b3e5fc" opacity="0.4"/>
  <circle cx="72%" cy="12%" r="8%" fill="#ffe082" opacity="0.45"/>
  <circle cx="72%" cy="12%" r="5.5%" fill="#ffca28" opacity="0.7"/>
  <circle cx="72%" cy="12%" r="3.5%" fill="#ffee58" opacity="0.9"/>
  <ellipse cx="12%" cy="11%" rx="12%" ry="4.5%" fill="white" opacity="0.7"/>
  <ellipse cx="22%" cy="9%" rx="9%" ry="4%" fill="white" opacity="0.7"/>
  <ellipse cx="48%" cy="8%" rx="11%" ry="3.5%" fill="white" opacity="0.6"/>
  <!-- beach -->
  <rect y="55%" width="100%" height="8%" fill="#ffe082" opacity="0.9"/>
  <rect y="58%" width="100%" height="5%" fill="#ffd54f" opacity="0.7"/>
  <!-- sea layers -->
  <rect y="62%" width="100%" height="38%" fill="#006994"/>
  <rect y="62%" width="100%" height="12%" fill="#0097a7" opacity="0.7"/>
  <rect y="62%" width="100%" height="6%" fill="#00bcd4" opacity="0.6"/>
  <!-- waves -->
  <path d="M0 65% Q10% 63% 20% 65% Q30% 67% 40% 65% Q50% 63% 60% 65% Q70% 67% 80% 65% Q90% 63% 100% 65%" fill="none" stroke="white" stroke-width="0.4%" opacity="0.5"/>
  <path d="M0 69% Q12% 67% 25% 69% Q38% 71% 50% 69% Q62% 67% 75% 69% Q88% 71% 100% 69%" fill="none" stroke="white" stroke-width="0.3%" opacity="0.35"/>
  <!-- umbrella -->
  <line x1="20%" y1="63%" x2="20%" y2="53%" stroke="#d32f2f" stroke-width="0.4%"/>
  <path d="M11% 56% Q20% 52% 29% 56%" fill="#f44336" opacity="0.85"/>
  <path d="M11% 56% Q20% 54% 29% 56%" fill="#ef9a9a" opacity="0.5"/>
  <!-- surfboard -->
  <ellipse cx="55%" cy="62%" rx="9%" ry="1.8%" fill="#e91e63" opacity="0.8" transform="rotate(-5 55% 62%)"/>
  <!-- seafloor -->
  <rect y="88%" width="100%" height="12%" fill="#004d5e" opacity="0.8"/>
  <!-- coral -->
  <path d="M8% 100% Q7.5% 93% 7% 90% Q6.5% 93% 6% 100%" fill="#e91e63" opacity="0.65"/>
  <circle cx="7%" cy="89%" r="1.5%" fill="#e91e63" opacity="0.7"/>
  <path d="M88% 100% Q87.5% 94% 87% 91%" fill="none" stroke="#4caf50" stroke-width="0.7%" opacity="0.7"/>
  <path d="M90% 100% Q90.5% 94% 90% 91%" fill="none" stroke="#4caf50" stroke-width="0.6%" opacity="0.65"/>
`;

const AUTUMN_SVG = `
  <rect width="100%" height="100%" fill="#0d0520"/>
  <rect width="100%" height="100%" fill="#1a0505" opacity="0.5"/>
  <!-- moon -->
  <circle cx="80%" cy="14%" r="10%" fill="#fff9c4" opacity="0.85"/>
  <circle cx="82.5%" cy="12%" r="8%" fill="#0d0520" opacity="0.7"/>
  <!-- stars -->
  <circle cx="5%" cy="4%" r="0.4%" fill="white" opacity="0.9"/>
  <circle cx="14%" cy="2%" r="0.3%" fill="white" opacity="0.7"/>
  <circle cx="23%" cy="6%" r="0.4%" fill="white" opacity="0.8"/>
  <circle cx="33%" cy="3%" r="0.3%" fill="white" opacity="0.9"/>
  <circle cx="42%" cy="8%" r="0.4%" fill="white" opacity="0.7"/>
  <circle cx="52%" cy="4%" r="0.3%" fill="white" opacity="0.8"/>
  <circle cx="61%" cy="10%" r="0.4%" fill="white" opacity="0.9"/>
  <circle cx="17%" cy="12%" r="0.3%" fill="white" opacity="0.6"/>
  <circle cx="45%" cy="14%" r="0.4%" fill="white" opacity="0.7"/>
  <!-- spooky clouds -->
  <ellipse cx="20%" cy="18%" rx="16%" ry="5.5%" fill="#2d1b40" opacity="0.5"/>
  <ellipse cx="50%" cy="22%" rx="14%" ry="5%" fill="#1a0d2e" opacity="0.45"/>
  <!-- dead trees left -->
  <path d="M6% 100% L7% 52%" stroke="#2d1a00" stroke-width="1.2%" fill="none" stroke-linecap="round"/>
  <path d="M7% 70% L3% 62%" stroke="#2d1a00" stroke-width="0.7%" fill="none" stroke-linecap="round"/>
  <path d="M7% 63% L11% 57%" stroke="#2d1a00" stroke-width="0.7%" fill="none" stroke-linecap="round"/>
  <path d="M7% 57% L4% 51%" stroke="#2d1a00" stroke-width="0.5%" fill="none" stroke-linecap="round"/>
  <!-- dead trees right -->
  <path d="M93% 100% L92% 50%" stroke="#2d1a00" stroke-width="1.2%" fill="none" stroke-linecap="round"/>
  <path d="M92% 68% L96% 60%" stroke="#2d1a00" stroke-width="0.7%" fill="none" stroke-linecap="round"/>
  <path d="M92% 61% L88% 55%" stroke="#2d1a00" stroke-width="0.7%" fill="none" stroke-linecap="round"/>
  <path d="M92% 55% L95% 49%" stroke="#2d1a00" stroke-width="0.5%" fill="none" stroke-linecap="round"/>
  <!-- haunted house -->
  <rect x="35%" y="55%" width="30%" height="45%" fill="#0a0505"/>
  <polygon points="35%,55% 50%,38% 65%,55%" fill="#0a0505"/>
  <rect x="46%" y="42%" width="5%" height="13%" fill="#0a0505"/>
  <polygon points="46%,42% 48.5%,35% 51%,42%" fill="#0a0505"/>
  <rect x="41%" y="72%" width="8%" height="28%" fill="#1a0505"/>
  <rect x="39%" y="59%" width="7%" height="7%" fill="#ff6f00" opacity="0.6"/>
  <rect x="54%" y="59%" width="7%" height="7%" fill="#ff6f00" opacity="0.6"/>
  <!-- graveyard -->
  <rect y="92%" width="100%" height="8%" fill="#0d0a05"/>
  <rect x="12%" y="87%" width="5%" height="7%" rx="2.5%" fill="#1a1205"/>
  <rect x="12%" y="91%" width="5%" height="4%" fill="#1a1205"/>
  <rect x="26%" y="86%" width="5%" height="8%" rx="2.5%" fill="#1a1205"/>
  <rect x="68%" y="87%" width="5%" height="7%" rx="2.5%" fill="#1a1205"/>
  <rect x="82%" y="86%" width="5%" height="8%" rx="2.5%" fill="#1a1205"/>
  <!-- pumpkins -->
  <ellipse cx="23%" cy="93%" rx="4%" ry="3.5%" fill="#e65100"/>
  <ellipse cx="23%" cy="93%" rx="2.8%" ry="3.5%" fill="#ef6c00" opacity="0.6"/>
  <rect x="22.3%" y="89.5%" width="1.2%" height="1.8%" rx="0.6%" fill="#2e7d32"/>
  <ellipse cx="77%" cy="93%" rx="3.5%" ry="3%" fill="#bf360c"/>
  <ellipse cx="77%" cy="93%" rx="2.4%" ry="3%" fill="#d84315" opacity="0.6"/>
  <rect x="76.3%" y="90%" width="1%" height="1.5%" rx="0.5%" fill="#2e7d32"/>
  <!-- bats -->
  <path d="M37% 30% Q35% 27% 33% 28.5% Q31.5% 26.5% 33.5% 26.5% Q35% 24.5% 37% 26.5% Q39% 24.5% 40.5% 26.5% Q42.5% 26.5% 41% 28.5% Q39% 27% 37% 30%Z" fill="#0d0520" opacity="0.85"/>
  <path d="M62% 25% Q60% 22% 58% 23.5% Q56.5% 21.5% 58.5% 21.5% Q60% 19.5% 62% 21.5% Q64% 19.5% 65.5% 21.5% Q67.5% 21.5% 66% 23.5% Q64% 22% 62% 25%Z" fill="#0d0520" opacity="0.8"/>
  <!-- spider web corner -->
  <g stroke="#3a3a3a" stroke-width="0.3%" fill="none" opacity="0.55">
    <line x1="0" y1="0" x2="8%" y2="10%"/>
    <line x1="0" y1="0" x2="0" y2="12%"/>
    <line x1="0" y1="0" x2="-4%" y2="10%"/>
    <ellipse cx="0" cy="0" rx="4%" ry="3%" transform="rotate(30)"/>
    <ellipse cx="0" cy="0" rx="8%" ry="6%" transform="rotate(30)"/>
  </g>
`;

const WINTER_SVG = `
  <rect width="100%" height="100%" fill="#050e1f"/>
  <rect width="100%" height="100%" fill="#0a1628" opacity="0.6"/>
  <!-- aurora glow -->
  <ellipse cx="50%" cy="30%" rx="60%" ry="20%" fill="#1565c0" opacity="0.1"/>
  <ellipse cx="50%" cy="35%" rx="50%" ry="15%" fill="#4a148c" opacity="0.07"/>
  <!-- stars -->
  <circle cx="4%" cy="3%" r="0.4%" fill="white" opacity="0.9"/>
  <circle cx="11%" cy="1.5%" r="0.3%" fill="white" opacity="0.7"/>
  <circle cx="20%" cy="4.5%" r="0.4%" fill="white" opacity="0.8"/>
  <circle cx="28%" cy="2%" r="0.3%" fill="white" opacity="0.9"/>
  <circle cx="37%" cy="6%" r="0.4%" fill="white" opacity="0.7"/>
  <circle cx="47%" cy="3.5%" r="0.3%" fill="white" opacity="0.8"/>
  <circle cx="56%" cy="7%" r="0.4%" fill="white" opacity="0.9"/>
  <circle cx="66%" cy="2%" r="0.3%" fill="white" opacity="0.7"/>
  <circle cx="74%" cy="8%" r="0.4%" fill="white" opacity="0.8"/>
  <circle cx="84%" cy="3%" r="0.3%" fill="white" opacity="0.9"/>
  <circle cx="93%" cy="6%" r="0.4%" fill="white" opacity="0.7"/>
  <circle cx="16%" cy="10%" r="0.3%" fill="white" opacity="0.6"/>
  <circle cx="43%" cy="11%" r="0.4%" fill="white" opacity="0.7"/>
  <circle cx="70%" cy="12%" r="0.3%" fill="white" opacity="0.6"/>
  <!-- moon -->
  <circle cx="15%" cy="14%" r="7%" fill="#e3f2fd" opacity="0.9"/>
  <circle cx="17%" cy="12.5%" r="5.5%" fill="#0a1628" opacity="0.7"/>
  <!-- christmas lights string -->
  <path d="M0 7% Q10% 9% 20% 7% Q30% 5% 40% 7% Q50% 9% 60% 7% Q70% 5% 80% 7% Q90% 9% 100% 7%" fill="none" stroke="#333" stroke-width="0.3%"/>
  <circle cx="5%" cy="7.5%" r="1.2%" fill="#f44336"/>
  <circle cx="5%" cy="7.5%" r="2%" fill="#f44336" opacity="0.2"/>
  <circle cx="15%" cy="6.5%" r="1.2%" fill="#ffd600"/>
  <circle cx="15%" cy="6.5%" r="2%" fill="#ffd600" opacity="0.2"/>
  <circle cx="25%" cy="7.5%" r="1.2%" fill="#4caf50"/>
  <circle cx="25%" cy="7.5%" r="2%" fill="#4caf50" opacity="0.2"/>
  <circle cx="35%" cy="6.5%" r="1.2%" fill="#2196f3"/>
  <circle cx="35%" cy="6.5%" r="2%" fill="#2196f3" opacity="0.2"/>
  <circle cx="45%" cy="7.5%" r="1.2%" fill="#e91e63"/>
  <circle cx="45%" cy="7.5%" r="2%" fill="#e91e63" opacity="0.2"/>
  <circle cx="55%" cy="6.5%" r="1.2%" fill="#ff9800"/>
  <circle cx="55%" cy="6.5%" r="2%" fill="#ff9800" opacity="0.2"/>
  <circle cx="65%" cy="7.5%" r="1.2%" fill="#4caf50"/>
  <circle cx="65%" cy="7.5%" r="2%" fill="#4caf50" opacity="0.2"/>
  <circle cx="75%" cy="6.5%" r="1.2%" fill="#f44336"/>
  <circle cx="75%" cy="6.5%" r="2%" fill="#f44336" opacity="0.2"/>
  <circle cx="85%" cy="7.5%" r="1.2%" fill="#ffd600"/>
  <circle cx="85%" cy="7.5%" r="2%" fill="#ffd600" opacity="0.2"/>
  <circle cx="95%" cy="6.5%" r="1.2%" fill="#2196f3"/>
  <circle cx="95%" cy="6.5%" r="2%" fill="#2196f3" opacity="0.2"/>
  <!-- pine tree left -->
  <polygon points="8%,80% 14%,58% 20%,80%" fill="#1b5e20"/>
  <polygon points="9%,72% 14%,53% 19%,72%" fill="#2e7d32"/>
  <polygon points="10%,65% 14%,48% 18%,65%" fill="#388e3c"/>
  <rect x="13%" y="80%" width="2%" height="5%" fill="#5d4037"/>
  <polygon points="7%,82% 21%,82% 14%,57%" fill="white" opacity="0.5"/>
  <polygon points="8%,74% 20%,74% 14%,52%" fill="white" opacity="0.4"/>
  <!-- pine tree right -->
  <polygon points="80%,80% 86%,58% 92%,80%" fill="#1b5e20"/>
  <polygon points="81%,72% 86%,53% 91%,72%" fill="#2e7d32"/>
  <polygon points="82%,65% 86%,48% 90%,65%" fill="#388e3c"/>
  <rect x="85%" y="80%" width="2%" height="5%" fill="#5d4037"/>
  <polygon points="79%,82% 93%,82% 86%,57%" fill="white" opacity="0.5"/>
  <polygon points="80%,74% 92%,74% 86%,52%" fill="white" opacity="0.4"/>
  <!-- big christmas tree center -->
  <polygon points="50%,75% 62%,45% 74%,75%" fill="#1b5e20"/>
  <polygon points="51%,65% 62%,38% 73%,65%" fill="#2e7d32"/>
  <polygon points="52.5%,55% 62%,30% 71.5%,55%" fill="#388e3c"/>
  <polygon points="54%,44% 62%,22% 70%,44%" fill="#43a047"/>
  <rect x="60%" y="75%" width="4%" height="8%" fill="#5d4037"/>
  <!-- tree ornaments -->
  <circle cx="56%" cy="53%" r="1.2%" fill="#f44336"/>
  <circle cx="62%" cy="48%" r="1.2%" fill="#ffd600"/>
  <circle cx="68%" cy="53%" r="1.2%" fill="#2196f3"/>
  <circle cx="58%" cy="63%" r="1.2%" fill="#e91e63"/>
  <circle cx="66%" cy="63%" r="1.2%" fill="#f44336"/>
  <circle cx="60%" cy="40%" r="1.2%" fill="#2196f3"/>
  <circle cx="64%" cy="40%" r="1.2%" fill="#ffd600"/>
  <circle cx="55%" cy="71%" r="1.2%" fill="#ffd600"/>
  <circle cx="69%" cy="71%" r="1.2%" fill="#4caf50"/>
  <!-- star on top -->
  <polygon points="62%,20% 62.8%,22.5% 65.5%,22.5% 63.3%,24% 64.1%,26.5% 62%,25% 59.9%,26.5% 60.7%,24% 58.5%,22.5% 61.2%,22.5%" fill="#ffd600"/>
  <!-- snowy ground -->
  <rect y="83%" width="100%" height="17%" fill="#bfdbfe"/>
  <rect y="83%" width="100%" height="5%" fill="white" opacity="0.8"/>
  <ellipse cx="10%" cy="83%" rx="18%" ry="5%" fill="white" opacity="0.8"/>
  <ellipse cx="50%" cy="82%" rx="25%" ry="6%" fill="white" opacity="0.85"/>
  <ellipse cx="88%" cy="83%" rx="20%" ry="5%" fill="white" opacity="0.8"/>
  <!-- snowman -->
  <circle cx="35%" cy="86%" r="4.5%" fill="white"/>
  <circle cx="35%" cy="79%" r="3.2%" fill="white"/>
  <circle cx="33.5%" cy="78%" r="0.7%" fill="#212121"/>
  <circle cx="36.5%" cy="78%" r="0.7%" fill="#212121"/>
  <circle cx="35%" cy="80%" r="0.6%" fill="#ff8f00"/>
  <path d="M32% 82% Q35% 83.5% 38% 82%" fill="none" stroke="#212121" stroke-width="0.4%"/>
  <path d="M30% 79% L27% 76%" stroke="#5d4037" stroke-width="0.7%" stroke-linecap="round"/>
  <path d="M40% 79% L43% 76%" stroke="#5d4037" stroke-width="0.7%" stroke-linecap="round"/>
  <path d="M32.5% 76% Q35% 73% 37.5% 76%" fill="#f44336" stroke="#b71c1c" stroke-width="0.2%"/>
  <rect x="32.5%" y="73.5%" width="5%" height="2.5%" rx="0.5%" fill="#212121"/>
  <!-- gift boxes -->
  <rect x="72%" y="88%" width="8%" height="6%" fill="#f44336" rx="0.5%"/>
  <rect x="75%" y="88%" width="2%" height="6%" fill="#ffd600"/>
  <path d="M76% 88% Q74% 86% 73% 87% Q72.5% 88.5% 76% 88%Z" fill="#ffd600"/>
  <path d="M76% 88% Q78% 86% 79% 87% Q79.5% 88.5% 76% 88%Z" fill="#ffd600"/>
  <rect x="82%" y="90%" width="6%" height="5%" fill="#1565c0" rx="0.5%"/>
  <rect x="84.5%" y="90%" width="1.5%" height="5%" fill="#e91e63"/>
`;

const SCENE_SVG: Record<Season, string> = { spring: SPRING_SVG, summer: SUMMER_SVG, autumn: AUTUMN_SVG, winter: WINTER_SVG };

function makeParticle(season: Season): string {
  const r = Math.random;
  if (season === "spring") {
    const types = [
      () => { const c = ["#f48fb1","#f8bbd0","#fce4ec","white"][Math.floor(r()*4)]; return `<svg width="12" height="9" viewBox="0 0 20 14"><ellipse cx="10" cy="7" rx="9" ry="5" fill="${c}" opacity="${(.5+r()*.4).toFixed(2)}" transform="rotate(${Math.round(r()*60-30)} 10 7)"/></svg>`; },
      () => `<svg width="13" height="11" viewBox="0 0 20 16"><path d="M10 1 Q18 8 10 15 Q2 8 10 1Z" fill="#6ab04c" opacity="${(.45+r()*.35).toFixed(2)}" transform="rotate(${Math.round(r()*60-30)} 10 8)"/></svg>`,
    ];
    return types[Math.floor(r()*types.length)]();
  }
  if (season === "summer") {
    const s = Math.round(5+r()*6);
    return `<svg width="${s}" height="${s}" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#fbbf24" opacity="${(.25+r()*.35).toFixed(2)}"/></svg>`;
  }
  if (season === "autumn") {
    const c = ["#ea580c","#d97706","#c2440a","#f97316","#b45309"][Math.floor(r()*5)];
    const rot = Math.round(r()*60-30);
    return `<svg width="14" height="11" viewBox="0 0 20 16"><ellipse cx="10" cy="8" rx="8" ry="4" fill="${c}" opacity="${(.65+r()*.3).toFixed(2)}" transform="rotate(${rot} 10 8)"/><line x1="10" y1="4" x2="10" y2="12" stroke="${c}" stroke-width="0.8" opacity="0.5"/></svg>`;
  }
  const s = Math.round(6+r()*9);
  return `<svg width="${s}" height="${s}" viewBox="0 0 10 10"><g stroke="white" stroke-width="1.3" opacity="${(.45+r()*.5).toFixed(2)}"><line x1="5" y1="0" x2="5" y2="10"/><line x1="0" y1="5" x2="10" y2="5"/><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></g></svg>`;
}

const PARTICLE_CONFIG: Record<Season, { max: number; interval: number; duration: [number, number] }> = {
  spring: { max: 10, interval: 500, duration: [4, 8] },
  summer: { max: 6,  interval: 800, duration: [5, 9] },
  autumn: { max: 14, interval: 300, duration: [3.5, 7] },
  winter: { max: 20, interval: 220, duration: [4, 8] },
};

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
      <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
          dangerouslySetInnerHTML={{ __html: SCENE_SVG[season] }}
        />
      </div>
    </>
  );
}
