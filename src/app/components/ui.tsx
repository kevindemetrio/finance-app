"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function IconButton({ danger, className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={`btn-icon ${danger ? "hover:bg-red-50 dark:hover:bg-red-950 hover:text-brand-red" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input-base ${className}`} {...props} />;
}

type BadgeVariant = "paid" | "pending";
export function Badge({ variant, onClick }: { variant: BadgeVariant; onClick?: () => void }) {
  const styles =
    variant === "paid"
      ? "bg-brand-green-light text-brand-green-dark dark:bg-green-950 dark:text-green-400"
      : "bg-brand-red-light text-brand-red-dark dark:bg-red-950 dark:text-red-400";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles} text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap font-medium transition-colors`}
    >
      {variant === "paid" ? "Cobrado" : "Pendiente"}
    </button>
  );
}

export function PrimaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-lg border border-brand-blue px-4 py-2 text-sm text-brand-blue
        hover:bg-brand-blue-light dark:hover:bg-blue-950 active:scale-95 transition-all whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-lg border border-neutral-200 dark:border-neutral-700
        px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        active:scale-95 transition-all whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SaveButton({ children = "Guardar", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-lg border border-brand-green px-3 py-1.5 text-sm text-brand-green
        hover:bg-brand-green-light dark:hover:bg-green-950 active:scale-95 transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
