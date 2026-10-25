"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
        Always use your order number as the reference when you pay. KasiPool checks your payment,
        then your order shows “Paid”.
      </p>
    </LegalPage>
  );
}
