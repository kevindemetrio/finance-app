import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// App Router: no bodyParser config needed — use request.text() for raw body
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function determinePlan(priceId: string): "basic" | "pro" | "family" | null {
  const {
    STRIPE_PRICE_BASIC_MONTHLY, STRIPE_PRICE_BASIC_ANNUAL,
    STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL,
    STRIPE_PRICE_FAMILY_MONTHLY, STRIPE_PRICE_FAMILY_ANNUAL,
  } = process.env;

  if (priceId === STRIPE_PRICE_BASIC_MONTHLY || priceId === STRIPE_PRICE_BASIC_ANNUAL) return "basic";
  if (priceId === STRIPE_PRICE_PRO_MONTHLY || priceId === STRIPE_PRICE_PRO_ANNUAL) return "pro";
  if (priceId === STRIPE_PRICE_FAMILY_MONTHLY || priceId === STRIPE_PRICE_FAMILY_ANNUAL) return "family";
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Sin firma" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firma inválida";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId ? determinePlan(priceId) : null;
      const periodEndTs = subscription.items.data[0]?.current_period_end;
      const periodEnd = periodEndTs
        ? new Date(periodEndTs * 1000).toISOString()
        : null;

      const payload = {
        plan: plan ?? "basic",
        status: "active",
        provider: "stripe",
        provider_customer_id: subscription.customer as string,
        provider_subscription_id: subscription.id,
        current_period_end: periodEnd,
      };

      // Intenta actualizar primero
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .update(payload)
        .eq("user_id", userId)
        .select("user_id")
        .single();

      // Si no existe la fila, inserta
      if (!existing) {
        await supabaseAdmin
          .from("subscriptions")
          .insert({ user_id: userId, ...payload });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      // Ignorar estados transitorios que Stripe manda durante el proceso de pago
      const definitiveStatuses = ["active", "canceled", "past_due", "unpaid"];
      if (!definitiveStatuses.includes(subscription.status)) break;

      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId ? determinePlan(priceId) : null;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: subscription.status as string,
          plan: plan ?? "basic",
          current_period_end: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
        })
        .eq("user_id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled", plan: "expired" })
        .eq("user_id", userId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (!customerId) break;

      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("provider_customer_id", customerId);
      break;
    }

    default:
      // Evento no manejado — ignorar
      break;
  }

  return NextResponse.json({ received: true });
}
