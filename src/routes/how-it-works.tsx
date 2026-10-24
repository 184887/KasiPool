import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { STEPS } from "./index";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How KasiPool works — collective buying explained" },
      {
        name: "description",
        content:
          "Find a deal, join the pool, confirm and pay once it qualifies, then collect your stock.",
      },
      { property: "og:title", content: "How KasiPool works" },
      {
        property: "og:description",
        content: "Collective purchasing for Cape Town township businesses in four simple steps.",
      },
    ],
  }),
  component: HowItWorks,
});

const FAQ = [
  [
    "Do I pay when I join a pool?",
    "No. Joining only registers your interest. You confirm and pay only if the pool reaches its target.",
  ],
  [
    "What if the pool doesn't reach its target?",
    "The offer is marked unsuccessful and you owe nothing.",
  ],
  [
    "Can I change my quantity?",
    "Yes, while the pool is open you can change or withdraw your interest.",
  ],
  [
    "How is payment checked?",
    "A KasiPool administrator verifies each payment against our bank records. A screenshot alone is not proof of payment.",
  ],
  [
    "What if fewer businesses pay than confirmed?",
    "Stock is only ordered if enough paid orders meet the supplier minimum. Otherwise any payments are refunded.",
  ],
  [
    "Where do I collect?",
    "At the collection point shown on each offer. Bring your collection code.",
  ],
];

function HowItWorks() {
  return (
    <Container className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold">How KasiPool works</h1>
      <p className="mt-2 text-muted-foreground">
        Many businesses. One bulk order. Better prices for everyone.
      </p>
      <ol className="mt-8 space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-card">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <s.icon className="size-6" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">
                {i + 1}. {s.title}
              </p>
              <p className="text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <h2 className="mt-10 font-display text-2xl font-bold">Common questions</h2>
      <div className="mt-4 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="rounded-xl border bg-card p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <Button asChild size="lg" className="mt-8">
        <Link to="/offers">See active offers</Link>
      </Button>
    </Container>
  );
}
