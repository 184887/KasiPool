import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { corsHeaders, handleOptions, jsonResponse } from "../_shared/response.ts";

type SmsHook = {
  user?: { phone?: string };
  sms?: { otp?: string };
};

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  const apiKey = Deno.env.get("CLICKATELL_API_KEY");
  const apiUrl = Deno.env.get("CLICKATELL_API_URL") ?? "https://api.clickatell.com/rest/message";
  if (!hookSecret || !apiKey) {
    console.error("Clickatell SMS hook is missing required server configuration");
    return jsonResponse({ error: "SMS delivery is not configured" }, 503);
  }

  const rawBody = await request.text();
  let hook: SmsHook;
  try {
    const webhook = new Webhook(hookSecret.replace(/^v1,whsec_/, ""));
    hook = webhook.verify(rawBody, Object.fromEntries(request.headers)) as SmsHook;
  } catch (error) {
    console.error("Supabase SMS hook signature verification failed", error);
    return jsonResponse({ error: "Invalid hook signature" }, 401);
  }

  const phone = hook.user?.phone;
  const otp = hook.sms?.otp;
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone) || !otp || !/^\d{6}$/.test(otp)) {
    return jsonResponse({ error: "Invalid SMS request" }, 400);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Version": "1",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `Your KasiPool sign-in code is ${otp}. Do not share this code.`,
        to: [phone.replace(/^\+/, "")],
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("Clickatell SMS request failed", error);
    return jsonResponse({ error: "Could not send the verification message" }, 502);
  }

  if (!response.ok) {
    console.error("Clickatell rejected SMS request", response.status);
    return jsonResponse({ error: "The SMS provider could not send the verification message" }, 502);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    console.error("Clickatell returned invalid SMS response", error);
    return jsonResponse({ error: "The SMS provider returned an invalid response" }, 502);
  }

  const messages =
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    typeof result.data === "object" &&
    result.data !== null &&
    "message" in result.data &&
    Array.isArray(result.data.message)
      ? result.data.message
      : null;
  if (!messages?.length || messages.some((message) => message?.accepted !== true)) {
    console.error("Clickatell did not accept the verification message");
    return jsonResponse({ error: "The SMS provider did not accept the verification message" }, 502);
  }

  return new Response(null, { status: 200, headers: corsHeaders });
});
