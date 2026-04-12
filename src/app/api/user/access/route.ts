import { NextResponse } from "next/server";
import { getUserAccess } from "@/app/lib/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/access
 * Devuelve el nivel de acceso del usuario autenticado.
 * Respuesta: { level: "lifetime" | "pro" | "basic" | "none", plan: string | null, expiresAt: string | null }
 */
export async function GET() {
  const access = await getUserAccess();
  return NextResponse.json(access);
}
