"use client";

import { LegalPage } from "@/components/kp/LegalPage";

export function Privacy() {
  return (
    <LegalPage title="Privacy notice">
      <h2>What we collect</h2>
      <p>
        Your business name, representative name, mobile number, optional email, business category
        and location. We collect only what is needed to run pools, process orders and arrange
        collection.
      </p>
      <h2>How we use it</h2>
      <p>
        To manage your participation, confirm orders, verify payments, coordinate collection and
        send in-app notifications. Other businesses never see your details or quantities.
      </p>
      <h2>Marketing</h2>
      <p>
        We only send marketing messages via Meta WhatsApp if you opt in. You can change this at any
        time in your profile. Marketing campaigns are sent to businesses that have opted in.
      </p>
      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your information, subject to
        records we must keep for financial and legal reasons. This notice should be reviewed for
        POPIA compliance before launch.
      </p>
    </LegalPage>
  );
}
