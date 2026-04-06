import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./app/lib/supabase/middleware";

// Rutas de API que gestionan su propia autenticación o no requieren auth
const EXCLUDED_PATHS = [
  "/api/stripe/webhook",
  "/api/stripe/portal",
];

// Páginas públicas accesibles sin sesión (no redirigen a login)
const PUBLIC_PAGES = ["/pricing"];

export async function middleware(request: NextRequest) {
  if (EXCLUDED_PATHS.includes(request.nextUrl.pathname)) {
    return;
  }

  // /pricing es pública: los usuarios no autenticados pueden verla.
  // Devolvemos next() directamente para evitar el redirect a login que haría
  // updateSession. Si hay sesión activa se refrescará en la siguiente petición.
  if (PUBLIC_PAGES.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
