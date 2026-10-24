import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonResponse } from "../_shared/response.ts";

type YocoEvent = {
  type?: string;
  payload?: {
    amount?: number;
    currency?: string;
    id?: string;
    metadata?: Record<string, unknown>;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function verifySignature(
  secret: string,
  webhookId: string,
  timestamp: string,
  rawBody: string,
  header: string,
): Promise<boolean> {
  const secretValue = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let keyBytes: Uint8Array;
  try {
    keyBytes = decodeBase64(secretValue);
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = `${webhookId}.${timestamp}.${rawBody}`;
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed)),
  );
  const expected = btoa(String.fromCharCode(...digest));
  const signatures = header.split(/\s+/).map((part) => part.replace(/^v1,/, ""));
  return signatures.some((signature) => {
    if (signature.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < signature.length; index += 1) {
      difference |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
    }
    return difference === 0;
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("YOCO_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceRoleKey) {
    console.error("Yoco webhook is missing required server configuration");
    return jsonResponse({ error: "Webhook is not configured" }, 503);
  }

  const rawBody = await request.text();
  const webhookId = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signature = request.headers.get("webhook-signature");
  const timestampSeconds = Number(timestamp);
  if (
    !webhookId ||
    !timestamp ||
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() - timestampSeconds * 1000) > 180_000 ||
    !signature
  ) {
    return jsonResponse({ error: "Invalid webhook signature headers" }, 401);
  }

  try {
    if (!(await verifySignature(secret, webhookId, timestamp, rawBody, signature))) {
      return jsonResponse({ error: "Invalid webhook signature" }, 401);
    }
  } catch (error) {
    console.error("Could not verify Yoco webhook signature", error);
    return jsonResponse({ error: "Could not verify webhook signature" }, 401);
  }

  let parsedEvent: unknown;
  try {
    parsedEvent = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid webhook payload" }, 400);
  }
  if (!isRecord(parsedEvent)) return jsonResponse({ error: "Invalid webhook payload" }, 400);
  const event = parsedEvent as YocoEvent;
  if (!isRecord(event.payload)) return jsonResponse({ error: "Invalid webhook payload" }, 400);

  const attemptId = event.payload?.metadata?.attempt_id;
  const paymentId = event.payload?.id;
  if (typeof attemptId !== "string" || typeof paymentId !== "string") {
    return jsonResponse({ error: "Webhook does not identify a payment attempt" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (event.type === "payment.failed") {
    const { error } = await admin.rpc("provider_fail_yoco_webhook", {
      _attempt: attemptId,
      _payment_id: paymentId,
    });
    if (error) {
      console.error("Could not record failed Yoco payment", error);
      return jsonResponse({ error: "Could not process payment event" }, 500);
    }
    return jsonResponse({ received: true });
  }

  if (event.type !== "payment.succeeded") return jsonResponse({ received: true });
  if (!Number.isInteger(event.payload?.amount) || typeof event.payload?.currency !== "string") {
    return jsonResponse({ error: "Invalid payment details" }, 400);
  }

  const { data: accepted, error } = await admin.rpc("provider_complete_yoco_checkout", {
    _attempt: attemptId,
    _payment_id: paymentId,
    _amount_cents: event.payload.amount,
    _currency: event.payload.currency,
  });
  if (error) {
    console.error("Could not settle Yoco payment", error);
    return jsonResponse({ error: "Could not process payment event" }, 500);
  }
  if (!accepted) {
    console.error("Yoco payment did not match its checkout reservation", attemptId);
    return jsonResponse({ received: true, settled: false });
  }
  return jsonResponse({ received: true });
});
