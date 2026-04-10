"use client";

import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // 10 s: equilibrio entre no-redundancia y frescura de datos financieros.
      // (Antes era 30 s, demasiado largo para datos que cambian con frecuencia.)
      dedupingInterval: 10_000,
    }}>
      {children}
    </SWRConfig>
  );
}
