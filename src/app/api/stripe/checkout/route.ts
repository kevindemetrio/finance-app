import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createClient } from "@/app/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/app/lib/rateLimit";

const VALID_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_BASIC_MONTHLY,
  process.env.STRIPE_PRICE_BASIC_ANNUAL,
  process.env.STRIPE_PRICE_PRO_MONTHLY,
  process.env.STRIPE_PRICE_PRO_ANNUAL,
  process.env.STRIPE_PRICE_FAMILY_MONTHLY,
  process.env.STRIPE_PRICE_FAMILY_ANNUAL,
]);

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

  // ── Rate limiting: 10 req / 60 s por IP ────────────────────────────────────
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, 10, 60_000)) {
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

  let body: { priceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { priceId } = body;

  if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
    return NextResponse.json({ error: "priceId no válido" }, { status: 400 });
  }

  // Buscar si el usuario ya tiene un customer id de Stripe
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId: string | undefined = subscription?.provider_customer_id ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?success=true`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: { user_id: user.id },
    subscription_data: {
      metadata: { user_id: user.id },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
