# Third-party provider setup

KasiPool integrates Yoco for online payments, Clickatell for Supabase phone-authentication
messages, and Meta WhatsApp Cloud API for opted-in marketing campaigns. Provider credentials are
server-side only; do not put them in `VITE_*` variables, `app_settings`, source control, or a
browser request.

## 1. Apply the database migration

Apply `drizzle/migrations/0008_third_party_providers.sql` to the Supabase database using the
project's normal migration process. The migration adds provider checkout and WhatsApp delivery
records, restricts their access with RLS, and exposes only the required security-definer RPCs.

## 2. Configure and deploy Supabase Edge Functions

Copy `supabase/functions/.env.example` to an ignored local env file, then provide the credentials
from the respective provider dashboards. For hosted functions, configure the same values as
Supabase Edge Function secrets. Supabase's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` are normally provided by the Edge Functions runtime; set them for
local development if the local environment does not provide them.

Deploy the functions:

```sh
supabase functions deploy create-yoco-checkout
supabase functions deploy yoco-webhook --no-verify-jwt
supabase functions deploy clickatell-sms-hook --no-verify-jwt
supabase functions deploy send-whatsapp-campaign
```

Only the provider callbacks disable the Edge gateway's JWT check. The Yoco callback validates
Yoco's signed, time-bounded webhook. The SMS hook validates Supabase Auth's Standard Webhooks
signature. Customer checkout and WhatsApp campaign functions verify the user's Supabase session;
campaign sends also require the administrator role.

## 3. Yoco online payments

1. Add `YOCO_SECRET_KEY` and `APP_URL` as Edge Function secrets. `APP_URL` must be the public
   application origin (no trailing slash).
2. Register `https://<project-ref>.supabase.co/functions/v1/yoco-webhook` in Yoco as a Checkout API
   payment notification webhook. Save its signing secret as `YOCO_WEBHOOK_SECRET`.
3. In KasiPool **Admin → Settings**, enable **Offer online payment through Yoco** and save.
4. A confirmed order can then create a hosted Yoco Checkout session. The app only records payment
   after a valid `payment.succeeded` webhook matches the reserved order, amount, and ZAR currency.
   The browser return URL is not treated as proof of payment.

See Yoco's [Checkout API guide](https://developer.yoco.com/guides/online-payments/accepting-a-payment)
and [webhook signature guide](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events).

## 4. Clickatell SMS phone sign-in

1. Add `CLICKATELL_API_KEY` and, if needed, override `CLICKATELL_API_URL` with the SMS API endpoint
   enabled for the Clickatell account.
2. In Supabase **Authentication → Providers → Phone**, enable phone authentication and configure
   six-digit SMS OTPs.
3. In **Authentication → Hooks**, configure the Send SMS hook URL as
   `https://<project-ref>.supabase.co/functions/v1/clickatell-sms-hook`. Store the hook's signing
   secret as `SEND_SMS_HOOK_SECRET` in Edge Function secrets.
4. Customers can use **Use mobile number instead** on the sign-in page. New phone registrations
   continue through the existing business onboarding workflow.

The sample API URL in `.env.example` is Clickatell's REST endpoint. Use the endpoint and API key
issued for the account, and verify the account is enabled for that API before enabling phone login.
See the [Supabase Send SMS Hook guide](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook)
and Clickatell's [Send Message reference](https://help.clickatell.com/developers-api-reference/developers-archive/sms-rest-api-overview/send-message).

## 5. Meta WhatsApp Cloud API campaigns

1. Set `META_WHATSAPP_ACCESS_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, and `META_WHATSAPP_API_VERSION`
   from the Meta app and WhatsApp Business account. Replace the version placeholder with a
   currently supported Graph API version.
2. Create and have Meta approve a marketing message template named by
   `META_WHATSAPP_MARKETING_TEMPLATE`, in the language set by
   `META_WHATSAPP_TEMPLATE_LANGUAGE`. The template body must have two text placeholders: campaign
   name (`{{1}}`) and description (`{{2}}`).
3. In KasiPool **Admin → Campaigns**, choose **Send WhatsApp to opted-in businesses**. Only current
   business profiles with marketing opt-in enabled are included. Delivery IDs and provider
   acceptance are recorded per campaign/business, and failed deliveries can be retried.

WhatsApp delivery success here means Meta accepted the message; final delivery/read status remains
available in Meta's WhatsApp Manager.
See Meta's [Cloud API messages reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages).

## Local development and verification

Use the env file with `supabase functions serve --env-file <path-to-env-file>`. Configure the local
Supabase Auth Send SMS hook to reach the locally served function, and use Yoco's test credentials
and a test webhook endpoint before enabling live payments. Never use a client redirect or a
customer-provided screenshot to mark an order paid.
