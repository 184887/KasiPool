import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/response.ts";

type Delivery = {
  delivery_id: string;
  business_id: string;
  mobile: string;
  trading_name: string;
  campaign_name: string;
  description: string | null;
};

type WhatsAppResponse = {
  messages?: Array<{ id?: string }>;
  error?: { message?: string };
};

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const accessToken = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");
  const apiVersion = Deno.env.get("META_WHATSAPP_API_VERSION");
  const templateName = Deno.env.get("META_WHATSAPP_MARKETING_TEMPLATE");
  const languageCode = Deno.env.get("META_WHATSAPP_TEMPLATE_LANGUAGE");
  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    !accessToken ||
    !phoneNumberId ||
    !apiVersion ||
    !templateName ||
    !languageCode
  ) {
    console.error("WhatsApp campaign sender is missing required server configuration");
    return jsonResponse({ error: "WhatsApp messaging is not configured yet" }, 503);
  }
  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    console.error("META_WHATSAPP_API_VERSION must be a version such as vXX.0");
    return jsonResponse({ error: "WhatsApp messaging is misconfigured" }, 503);
  }
  if (!authorization) return jsonResponse({ error: "Sign in to continue" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: userError } = await userClient.auth.getUser();
  if (userError || !userResult.user) return jsonResponse({ error: "Sign in to continue" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: role, error: roleError } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userResult.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError) {
    console.error("Could not verify WhatsApp campaign permissions", roleError);
    return jsonResponse({ error: "Could not verify administrator access" }, 500);
  }
  if (!role) return jsonResponse({ error: "Administrator access required" }, 403);

  let campaignId: string;
  let retryFailed: boolean;
  try {
    const body = await request.json();
    campaignId = typeof body.campaign_id === "string" ? body.campaign_id : "";
    retryFailed = body.retry_failed === true;
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }
  if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return jsonResponse({ error: "Invalid campaign" }, 400);

  const { data: rawDeliveries, error: prepareError } = await admin.rpc(
    "provider_prepare_whatsapp_campaign",
    { _campaign: campaignId, _retry_failed: retryFailed },
  );
  if (prepareError) {
    console.error("Could not prepare WhatsApp campaign", prepareError);
    return jsonResponse({ error: prepareError.message }, 400);
  }
  const deliveries = (rawDeliveries ?? []) as Delivery[];
  let sent = 0;
  let failed = 0;
  for (let offset = 0; offset < deliveries.length; offset += 5) {
    const batch = deliveries.slice(offset, offset + 5);
    const results = await Promise.all(
      batch.map(async (delivery) => {
        const phone = delivery.mobile.replace(/\D/g, "");
        if (!/^27[6-8]\d{8}$/.test(phone)) {
          return {
            delivery,
            status: "failed" as const,
            error: "Invalid South African mobile number",
          };
        }

        try {
          const response = await fetch(
            `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "template",
                template: {
                  name: templateName,
                  language: { code: languageCode },
                  components: [
                    {
                      type: "body",
                      parameters: [
                        { type: "text", text: delivery.campaign_name.slice(0, 1024) },
                        {
                          type: "text",
                          text: (delivery.description || "View this offer on KasiPool.").slice(
                            0,
                            1024,
                          ),
                        },
                      ],
                    },
                  ],
                },
              }),
              signal: AbortSignal.timeout(15_000),
            },
          );
          const body = (await response.json()) as WhatsAppResponse;
          if (!response.ok) {
            return {
              delivery,
              status: "failed" as const,
              error: `Meta API returned HTTP ${response.status}`,
            };
          }
          const messageId = body.messages?.[0]?.id;
          if (!messageId) {
            console.error(
              "Meta accepted no message ID",
              body.error?.message ?? "unknown provider response",
            );
            return {
              delivery,
              status: "failed" as const,
              error: "Meta did not confirm message acceptance",
            };
          }
          return { delivery, status: "sent" as const, messageId };
        } catch (error) {
          console.error("WhatsApp campaign send failed", error);
          return { delivery, status: "failed" as const, error: "Could not connect to Meta" };
        }
      }),
    );

    for (const result of results) {
      const { error: updateError } = await admin.rpc("provider_finish_whatsapp_delivery", {
        _delivery: result.delivery.delivery_id,
        _status: result.status,
        _provider_message_id: result.status === "sent" ? result.messageId : null,
        _error: result.status === "failed" ? result.error : null,
      });
      if (updateError) {
        console.error("Could not save WhatsApp delivery result", updateError);
        failed += 1;
      } else if (result.status === "sent") {
        sent += 1;
      } else {
        failed += 1;
      }
    }
  }

  const { count: remaining, error: countError } = await admin
    .from("whatsapp_campaign_deliveries")
    .select("id, businesses!inner(marketing_opt_in)", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("businesses.marketing_opt_in", true)
    .eq("status", "pending");
  if (countError) {
    console.error("Could not count remaining WhatsApp deliveries", countError);
    return jsonResponse({ error: "Could not finish the WhatsApp campaign" }, 500);
  }

  return jsonResponse({
    total: deliveries.length,
    sent,
    failed,
    remaining: remaining ?? 0,
    message: deliveries.length === 0 ? "There are no opted-in businesses to contact." : undefined,
  });
});
