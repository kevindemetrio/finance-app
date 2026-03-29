import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/Toast";
import { CategoriesProvider } from "./components/CategoriesProvider";
import { TrialBanner } from "./components/TrialBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Finanzas",
  description: "Tu gestor de finanzas personales",
  manifest: "/manifest.json",
  icons: { icon: [{ url: "/favicon.png", type: "image/png" }], apple: "/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Finanzas" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#1D9E75",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <CategoriesProvider>
            <ToastProvider />
            <TrialBanner />
            {children}
          </CategoriesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
