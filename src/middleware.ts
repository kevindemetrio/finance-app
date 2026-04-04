import { type NextRequest } from "next/server";
import { updateSession } from "./app/lib/supabase/middleware";

// Rutas de API que gestionan su propia autenticación o no requieren auth
const EXCLUDED_PATHS = [
  "/api/stripe/webhook",
  "/api/stripe/portal",
];

export async function middleware(request: NextRequest) {
  if (EXCLUDED_PATHS.includes(request.nextUrl.pathname)) {
    return;
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
