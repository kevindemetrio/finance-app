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

// Estados definitivos que Stripe puede asignar a una suscripción
const DEFINITIVE_STATUSES = ["active", "trialing", "past_due", "canceled", "unpaid"];

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
    // ── Pago único (Lifetime) ─────────────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId) break;

      if (session.mode === "payment") {
        // ── Pago único (Lifetime) ──────────────────────────────────────────
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;
        if (!priceId || priceId !== process.env.STRIPE_PRICE_LIFETIME) break;

        await supabaseAdmin
          .from("subscriptions")
          .update({ is_lifetime: true })
          .eq("user_id", userId);

        const customerId = session.customer as string;
        if (customerId) {
          const activeSubs = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 10,
          });
          for (const sub of activeSubs.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        }

      } else if (session.mode === "subscription" && session.subscription) {
        // ── Suscripción nueva — fallback por si customer.subscription.created
        //    no está registrado en el endpoint de Stripe ─────────────────────
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? determinePlan(priceId) : null;
        const periodEndTs = subscription.items.data[0]?.current_period_end;
        const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;
        const priceInterval = subscription.items.data[0]?.price?.recurring?.interval;
        const billingInterval = priceInterval === "year" ? "annual" : "monthly";

        const payload = {
          user_id: userId,
          plan: plan ?? "basic",
          status: subscription.cancel_at_period_end ? "canceling" : subscription.status,
          provider: "stripe",
          provider_customer_id: subscription.customer as string,
          provider_subscription_id: subscription.id,
          current_period_end: periodEnd,
          billing_interval: billingInterval,
        };

        await supabaseAdmin
          .from("subscriptions")
          .upsert(payload, { onConflict: "user_id" });
      }
      break;
    }

    // ── Suscripción creada ────────────────────────────────────────────────────
    case "customer.subscription.created":
    // ── Suscripción actualizada ───────────────────────────────────────────────
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      // Ignorar estados transitorios
      if (!DEFINITIVE_STATUSES.includes(subscription.status)) break;

      // Si está activa pero programada para cancelar al final del período → "canceling"
      const effectiveStatus =
        subscription.status === "active" && subscription.cancel_at_period_end
          ? "canceling"
          : subscription.status;

      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId ? determinePlan(priceId) : null;
      const periodEndTs = subscription.items.data[0]?.current_period_end;
      const periodEnd = periodEndTs
        ? new Date(periodEndTs * 1000).toISOString()
        : null;
      const priceInterval = subscription.items.data[0]?.price?.recurring?.interval;
      const billingInterval = priceInterval === "year" ? "annual" : "monthly";

      const payload = {
        user_id: userId,
        plan: plan ?? "basic",
        status: effectiveStatus,
        provider: "stripe",
        provider_customer_id: subscription.customer as string,
        provider_subscription_id: subscription.id,
        current_period_end: periodEnd,
        billing_interval: billingInterval,
      };

      // UPSERT: buscar por provider_subscription_id; si existe, actualiza;
      // si no, intentar update por user_id y finalmente insertar.
      const { data: updatedBySub } = await supabaseAdmin
        .from("subscriptions")
        .update({ plan: payload.plan, status: payload.status, current_period_end: periodEnd, billing_interval: billingInterval })
        .eq("provider_subscription_id", subscription.id)
        .select("user_id")
        .maybeSingle();

      if (!updatedBySub) {
        // No existe fila con ese subscription ID: upsert por user_id
        await supabaseAdmin
          .from("subscriptions")
          .upsert(payload, { onConflict: "user_id" });
      }
      break;
    }

    // ── Suscripción eliminada ─────────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      // Buscar primero por provider_subscription_id para mayor precisión
      const { data: updated } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("provider_subscription_id", subscription.id)
        .select("user_id")
        .maybeSingle();

      // Fallback: actualizar por user_id si no encontramos la fila por subscription ID
      if (!updated) {
        const userId = subscription.metadata?.user_id;
        if (userId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId);
        }
      }
      break;
    }

    // ── Pago fallido ──────────────────────────────────────────────────────────
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
