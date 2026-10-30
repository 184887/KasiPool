"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InstallSteps } from "@/components/kp/InstallPrompt";
import { LegalPage } from "@/components/kp/LegalPage";
import { settingsQuery } from "@/lib/queries";
import { useT } from "@/i18n";

export function Help() {
  const { t, rich } = useT();
  const { data } = useQuery(settingsQuery);
  const c = data?.contact;
  return (
    <LegalPage title={t("Help & contact")}>
      <p>
        {rich("New to KasiPool? Read <link>how KasiPool works</link>.", {
          link: (x) => (
            <Link href="/how-it-works" className="font-semibold text-ember underline">
              {x}
            </Link>
          ),
        })}
      </p>
      <h2>{t("Get the app")}</h2>
      <InstallSteps />
      <h2>{t("Contact KasiPool")}</h2>
      {c?.phone || c?.email || c?.whatsapp ? (
        <ul className="list-disc pl-5">
          {c.phone && (
            <li>
              {t("Phone:")} {c.phone}
            </li>
          )}
          {c.whatsapp && <li>WhatsApp: {c.whatsapp}</li>}
          {c.email && (
            <li>
              {t("Email:")} {c.email}
            </li>
          )}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          {t("Contact details have not been configured yet.")}
        </p>
      )}
      <h2>{t("Payments")}</h2>
      <p>
        {t(
          "Pay in cash when your stock arrives, or by bank transfer. For a bank transfer, use your order number as the reference and send your proof of payment in the app. KasiPool checks it in our bank account, then your order shows “Paid”.",
        )}
      </p>
    </LegalPage>
  );
}
