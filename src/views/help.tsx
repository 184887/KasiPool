"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InstallSteps } from "@/components/kp/InstallPrompt";
import { LegalPage } from "@/components/kp/LegalPage";
import { settingsQuery } from "@/lib/queries";

export function Help() {
  const { data } = useQuery(settingsQuery);
  const c = data?.contact;
  return (
    <LegalPage title="Help & contact">
      <p>
        New to KasiPool? Read{" "}
        <Link href="/how-it-works" className="font-semibold text-ember underline">
          how KasiPool works
        </Link>
        .
      </p>
      <h2>Get the app</h2>
      <InstallSteps />
      <h2>Contact KasiPool</h2>
      {c?.phone || c?.email || c?.whatsapp ? (
        <ul className="list-disc pl-5">
          {c.phone && <li>Phone: {c.phone}</li>}
          {c.whatsapp && <li>WhatsApp: {c.whatsapp}</li>}
          {c.email && <li>Email: {c.email}</li>}
        </ul>
      ) : (
        <p className="text-muted-foreground">Contact details have not been configured yet.</p>
      )}
      <h2>Payments</h2>
      <p>
        Pay in cash when your stock arrives, or by bank transfer. For a bank transfer, use your
        order number as the reference and send your proof of payment in the app. KasiPool checks it
        in our bank account, then your order shows “Paid”.
      </p>
    </LegalPage>
  );
}
