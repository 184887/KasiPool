import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LegalPage } from "@/components/kp/LegalPage";
import { settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & contact — KasiPool" },
      { name: "description", content: "Get help with pools, payments and collection on KasiPool." },
      { property: "og:title", content: "KasiPool help" },
      {
        property: "og:description",
        content: "Answers and contact details for KasiPool customers.",
      },
    ],
  }),
  component: Help,
});

function Help() {
  const { data } = useQuery(settingsQuery);
  const c = data?.contact;
  return (
    <LegalPage title="Help & contact">
      <p>
        New to pooling? Read{" "}
        <Link to="/how-it-works" className="font-semibold text-ember underline">
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
        Always use your order reference when paying. KasiPool staff will verify your payment; you'll
        see “Payment confirmed” in your account.
      </p>
    </LegalPage>
  );
}
