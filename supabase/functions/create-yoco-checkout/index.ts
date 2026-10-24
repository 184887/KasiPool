import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/response.ts";

type CheckoutReservation = {
  attempt_id: string;
  amount_cents: number;
  order_ref: string;
};

function isCheckoutReservation(value: unknown): value is CheckoutReservation {
  if (typeof value !== "object" || value === null) return false;
  const reservation = value as Record<string, unknown>;
  return (
    typeof reservation.attempt_id === "string" &&
    typeof reservation.amount_cents === "number" &&
    Number.isInteger(reservation.amount_cents) &&
    reservation.amount_cents > 0 &&
    typeof reservation.order_ref === "string"
  );
}

function isCheckoutResponse(value: unknown): value is { id: string; redirectUrl: string } {
  if (typeof value !== "object" || value === null) return false;
  const checkout = value as Record<string, unknown>;
  return typeof checkout.id === "string" && typeof checkout.redirectUrl === "string";
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const yocoSecret = Deno.env.get("YOCO_SECRET_KEY");
  const appUrl = Deno.env.get("APP_URL")?.replace(/\/+$/, "");
  if (!supabaseUrl || !supabaseKey || !yocoSecret || !appUrl) {
    console.error("Yoco checkout is missing required server configuration");
    return jsonResponse({ error: "Online payments are not configured yet" }, 503);
  }
  if (!authorization) return jsonResponse({ error: "Sign in to continue" }, 401);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) return jsonResponse({ error: "Sign in to continue" }, 401);

  let orderId: string;
  try {
    const body = await request.json();
    orderId = typeof body.order_id === "string" ? body.order_id : "";
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return jsonResponse({ error: "Invalid order" }, 400);

  const { data: reservation, error: reserveError } = await supabase.rpc(
    "provider_prepare_yoco_checkout",
    { _order: orderId },
  );
  if (reserveError || !reservation) {
    return jsonResponse({ error: reserveError?.message ?? "Could not prepare payment" }, 400);
  }

  if (!isCheckoutReservation(reservation)) {
    console.error("Yoco checkout reservation returned an invalid response");
    return jsonResponse({ error: "Could not prepare payment" }, 500);
  }
  const attempt = reservation;
  let response: Response;
  try {
    response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${yocoSecret}`,
        "Content-Type": "application/json",
        "Idempotency-Key": attempt.attempt_id,
      },
      body: JSON.stringify({
        amount: attempt.amount_cents,
        currency: "ZAR",
        clientReferenceId: attempt.attempt_id,
        metadata: { attempt_id: attempt.attempt_id, order_id: orderId },
        successUrl: `${appUrl}/orders/${orderId}?payment=return`,
        cancelUrl: `${appUrl}/orders/${orderId}?payment=cancelled`,
        failureUrl: `${appUrl}/orders/${orderId}?payment=failed`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("Yoco checkout request failed", error);
    return jsonResponse(
      { error: "Could not connect to the payment provider. Please try again." },
      502,
    );
  }

  if (!response.ok) {
    await supabase.rpc("provider_fail_yoco_checkout", { _attempt: attempt.attempt_id });
    console.error("Yoco checkout creation failed", response.status);
    return jsonResponse({ error: "The payment provider could not start checkout" }, 502);
  }

  let checkout: unknown;
  try {
    checkout = await response.json();
  } catch (error) {
    await supabase.rpc("provider_fail_yoco_checkout", { _attempt: attempt.attempt_id });
    console.error("Yoco returned invalid checkout data", error);
    return jsonResponse({ error: "The payment provider returned an invalid response" }, 502);
  }
  if (!isCheckoutResponse(checkout)) {
    await supabase.rpc("provider_fail_yoco_checkout", { _attempt: attempt.attempt_id });
    return jsonResponse({ error: "The payment provider returned an invalid response" }, 502);
  }

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(checkout.redirectUrl);
  } catch {
    await supabase.rpc("provider_fail_yoco_checkout", { _attempt: attempt.attempt_id });
    return jsonResponse({ error: "The payment provider returned an invalid checkout link" }, 502);
  }
  if (
    redirectUrl.protocol !== "https:" ||
    !(redirectUrl.hostname === "yoco.com" || redirectUrl.hostname.endsWith(".yoco.com")) ||
    !checkout.id
  ) {
    await supabase.rpc("provider_fail_yoco_checkout", { _attempt: attempt.attempt_id });
    console.error("Yoco returned an unexpected checkout URL or missing ID");
    return jsonResponse({ error: "The payment provider returned an invalid checkout link" }, 502);
  }

  const { error: attachError } = await supabase.rpc("provider_attach_yoco_checkout", {
    _attempt: attempt.attempt_id,
    _checkout_id: checkout.id,
  });
  if (attachError) {
    console.error("Could not attach Yoco checkout to payment attempt", attachError);
    return jsonResponse(
      { error: "Could not save the payment session. Please contact support." },
      500,
    );
  }

  return jsonResponse({ redirect_url: redirectUrl.toString() });
});
