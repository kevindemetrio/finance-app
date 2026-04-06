import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createClient } from "@/app/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "http://localhost:3000",
].filter(Boolean) as string[];

export async function POST(request: NextRequest) {
  // ── CSRF: verificar Origin ──────────────────────────────────────────────────
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Rate limiting: 20 req / 60 s por IP ────────────────────────────────────
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Espera un momento." },
      { status: 429 }
    );
  }

  // ── Autenticación: user_id siempre de la sesión, nunca del body ────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerCustomerId = subscription?.provider_customer_id;

  if (!providerCustomerId) {
    return NextResponse.json(
      { error: "No tienes una suscripción activa" },
      { status: 400 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: providerCustomerId,
    return_url: process.env.NEXT_PUBLIC_APP_URL + "/ajustes",
  });

  return NextResponse.json({ url: portalSession.url });
}
