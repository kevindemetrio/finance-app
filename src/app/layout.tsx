import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ToastProvider } from "./components/Toast";
import { CategoriesProvider } from "./components/CategoriesProvider";
import { TrialBanner } from "./components/TrialBanner";
import { SWRProvider } from "./components/SWRProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Spenfly",
  description: "Spenfly — Tu gestor de finanzas personales",
  manifest: "/manifest.json",
  icons: { 
  icon: [
    { url: "/favicon.ico", type: "image/x-icon" },
    { url: "/favicon.svg", type: "image/svg+xml" },
    { url: "/favicon.png", type: "image/png" },
  ], 
  apple: "/icon-192.png" 
},
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Spenfly" },
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
        <SWRProvider>
          <ThemeProvider>
            <CategoriesProvider>
              <ToastProvider />
              <TrialBanner />
              {children}
            </CategoriesProvider>
          </ThemeProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
