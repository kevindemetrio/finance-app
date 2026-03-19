"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Dashboard is hidden for now — code kept at /dashboard for future use
const links = [
  {
    href: "/",
    label: "Finanzas",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  },
  {
    href: "/metas",
    label: "Metas",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  },
  {
    href: "/inversiones",
    label: "Inversiones",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden
        bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md
        border-t border-neutral-200 dark:border-neutral-800
        pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                  ${active ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-600"}`}>
                <span className={active ? "opacity-100" : "opacity-40"}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function DesktopTabs() {
  const pathname = usePathname();
  return (
    <div className="hidden lg:flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${active ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"}`}>
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
