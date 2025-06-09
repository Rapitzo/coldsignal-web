import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
}

// Test mode = key starts with sk_test_, live mode = sk_live_. STRIPE_LIVE_MODE
// is the explicit gate: even with a live key present, we only treat checkout as
// "live" when STRIPE_LIVE_MODE === "true". This keeps a live key in the env
// from accidentally exposing buyers to production charges before sign-off.
export function stripeMode(): "live" | "test" | "absent" {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return "absent";
  if (key.startsWith("sk_live_") && process.env.STRIPE_LIVE_MODE === "true") return "live";
  return "test";
}

// Backwards-compat for existing call sites. New code should call getStripe().
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});
