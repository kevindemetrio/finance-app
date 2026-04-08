"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);

    // Start progress
    setOpacity(1);
    setVisible(true);
    setWidth(0);

    // Small delay then animate to 85%
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setWidth(85);
      });
    });

    // After 400ms complete to 100%, then fade out
    timerRef.current = setTimeout(() => {
      setWidth(100);
      timerRef.current = setTimeout(() => {
        setOpacity(0);
        timerRef.current = setTimeout(() => {
          setVisible(false);
          setWidth(0);
          setOpacity(1);
        }, 300);
      }, 150);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] pointer-events-none"
      style={{
        width: `${width}%`,
        opacity,
        background: "linear-gradient(90deg, #1D9E75, #378ADD)",
        transition: width === 85
          ? "width 0.4s cubic-bezier(0.4,0,0.2,1)"
          : width === 100
          ? "width 0.15s ease-out"
          : "none",
        boxShadow: "0 0 8px rgba(29,158,117,0.6)",
      }}
    />
  );
}
