"use client";

import Link from "next/link";
import { LegalPage } from "@/components/kp/LegalPage";

export function Privacy() {
  return (
    <LegalPage title="Privacy notice" englishOnly>
      <h2>What we collect</h2>
      <p>
        Your business name, representative name, mobile number, optional email, business category,
        business address, delivery address and the map pin of your business, plus the proofs of
        payment you upload. We collect only what is needed to run pools, process orders and arrange
        delivery.
      </p>
      <h2>How we use it</h2>
      <p>
        To manage your participation, confirm orders, verify payments, arrange delivery and send
        in-app notifications. We share your delivery address and phone number with our courier
        partner only to deliver your order. Other businesses never see your details or quantities.
      </p>
      <h2>Who processes your data</h2>
      <p>These companies process your information for KasiPool, only to run the service:</p>
      <ul className="list-disc pl-5">
        <li>
          <b>Supabase</b> stores your account, business details, orders and proofs of payment. The
          database is in the European Union (Ireland).
        </li>
        <li>
          <b>Vercel</b> hosts the website. Your requests pass through its servers, which can be
          outside South Africa.
        </li>
        <li>
          <b>Our courier partner</b> gets your delivery address and phone number to deliver your
          order.
        </li>
        <li>
          <b>Meta (WhatsApp)</b> sends marketing messages, only if you opt in.
        </li>
      </ul>
      <p>
        Because Supabase and Vercel store or handle data outside South Africa, your information is
        sent across borders. We only use providers that protect personal information to a standard
        similar to POPIA (section 72).
      </p>
      <h2>Marketing</h2>
      <p>
        We only send marketing messages via Meta WhatsApp if you opt in. You can change this at any
        time in your profile. Marketing campaigns are sent to businesses that have opted in.
      </p>
      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your information, subject to
        records we must keep for financial and legal reasons. To make a request, contact KasiPool
        using the details on the{" "}
        <Link href="/help" className="font-semibold text-ember underline">
          Help &amp; contact
        </Link>{" "}
        page. You can also complain to the Information Regulator of South Africa.
      </p>
      <h2>Information Officer</h2>
      <p>
        The name and contact details of KasiPool&apos;s Information Officer will be added here
        before launch. This notice should be reviewed for POPIA compliance before launch.
      </p>
    </LegalPage>
  );
}
