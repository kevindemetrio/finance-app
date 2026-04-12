import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./app/lib/supabase/middleware";

// Rutas de API que gestionan su propia autenticación o no requieren auth
const EXCLUDED_PATHS = [
  "/api/stripe/webhook",
  "/api/stripe/portal",
];

// Páginas públicas accesibles sin sesión (no redirigen a login)
const PUBLIC_PAGES = ["/pricing"];

const isDev = process.env.NODE_ENV === "development";

/** Nonce aleatorio por petición para CSP — elimina la necesidad de 'unsafe-inline' en script-src */
function generateNonce(): string {
  return btoa(crypto.randomUUID());
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      // 'strict-dynamic' permite que los scripts con nonce carguen otros scripts
      // sin necesitar nonce propio (cubre el chunk-loading de Next.js)
      "'strict-dynamic'",
      // Incluir host como fallback para navegadores sin soporte de strict-dynamic
      "https://js.stripe.com",
      isDev ? "'unsafe-eval'" : "",
    ].filter(Boolean).join(" "),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const csp   = buildCsp(nonce);

  // Inyectamos el nonce en los headers de la petición para que los Server
  // Components puedan leerlo con headers() si necesitan pasar nonce a <Script>.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  if (EXCLUDED_PATHS.includes(request.nextUrl.pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  // /pricing es pública: los usuarios no autenticados pueden verla.
  if (PUBLIC_PAGES.includes(request.nextUrl.pathname)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  // Para rutas autenticadas, pasamos la petición con el nonce ya inyectado
  // a updateSession, que refresca la cookie de Supabase si es necesario.
  const requestWithNonce = new NextRequest(request, { headers: requestHeaders });
  const response = await updateSession(requestWithNonce);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
