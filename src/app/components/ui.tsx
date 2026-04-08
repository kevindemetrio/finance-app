"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function IconButton({
  danger, className = "", children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90
        text-neutral-400 dark:text-neutral-500
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        hover:text-neutral-700 dark:hover:text-neutral-200
        ${danger
          ? "hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-500 dark:hover:text-red-400"
          : ""}
        ${className}`}
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
      className={`${styles} text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap font-semibold transition-colors active:scale-95`}
    >
      {variant === "paid" ? "Cobrado" : "Pendiente"}
    </button>
  );
}

export function PrimaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-xl border border-brand-blue px-4 py-2 text-sm font-medium text-brand-blue
        hover:bg-brand-blue hover:text-white
        active:scale-95 transition-all whitespace-nowrap ${className}`}
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
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700
        px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        hover:border-neutral-300 dark:hover:border-neutral-600
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
      className={`rounded-xl border border-brand-green px-3 py-1.5 text-sm font-medium text-brand-green
        hover:bg-brand-green hover:text-white
        active:scale-95 transition-all ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
