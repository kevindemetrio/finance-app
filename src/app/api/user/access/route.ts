import { NextRequest, NextResponse } from "next/server";
import { getUserAccess } from "@/app/lib/access";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/access
 * Devuelve el nivel de acceso del usuario autenticado.
 * Respuesta: { level: "lifetime" | "pro" | "basic" | "none", plan: string | null, expiresAt: string | null }
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 30, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Espera un momento." },
      { status: 429 }
    );
  }

  const access = await getUserAccess();
  return NextResponse.json(access);
}
