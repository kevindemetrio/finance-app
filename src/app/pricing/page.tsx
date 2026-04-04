import PricingClient from "./PricingClient";

export default function PricingPage() {
  return (
    <PricingClient
      prices={{
        basicMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY!,
        basicAnnual: process.env.STRIPE_PRICE_BASIC_ANNUAL!,
        proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
        proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
        familyMonthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY!,
        familyAnnual: process.env.STRIPE_PRICE_FAMILY_ANNUAL!,
      }}
    />
  );
}
