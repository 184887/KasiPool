"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InstallSteps } from "@/components/kp/InstallPrompt";
import { LegalPage } from "@/components/kp/LegalPage";
import { contactHref } from "@/lib/contact";
import { settingsQuery } from "@/lib/queries";
import { useT } from "@/i18n";

const LINK = "font-semibold text-ember underline";

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
          {c.whatsapp && (
            <li>
              WhatsApp:{" "}
              <a href={contactHref.whatsapp(c.whatsapp)} className={LINK}>
                {c.whatsapp}
              </a>
            </li>
          )}
          {c.phone && (
            <li>
              {t("Phone:")}{" "}
              <a href={contactHref.phone(c.phone)} className={LINK}>
                {c.phone}
              </a>
            </li>
          )}
          {c.email && (
            <li>
              {t("Email:")}{" "}
              <a href={contactHref.email(c.email)} className={LINK}>
                {c.email}
              </a>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          {t("Ask the KasiPool team member who helped you sign up.")}
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
