"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { STEPS } from "@/views/home";

const FAQ = [
  [
    "Do I pay when I join a pool?",
    "No. Joining only registers your interest. You confirm and pay only if the pool reaches its target.",
  ],
  [
    "What if the pool doesn't reach its target?",
    "The deal is marked unsuccessful and you owe nothing.",
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
    "How do I get my stock?",
    "A courier delivers it to the address in your profile. Each deal shows the areas it delivers to and the delivery fee for your area. When it arrives, tap 'I received my stock' on your order.",
  ],
];

export function HowItWorks() {
  return (
    <Container className="max-w-3xl">
      <h1 className="font-headline text-5xl">How KasiPool works</h1>
      <p className="mt-2 text-muted-foreground">
        Many businesses. One bulk order. Better prices for everyone.
      </p>
      <ol className="mt-8 space-y-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-5 border-t-2 border-ink pt-4">
            <span className="w-10 shrink-0 font-headline text-5xl text-ember">{i + 1}</span>
            <div>
              <p className="font-display text-xl font-bold">{s.title}</p>
              <p className="text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <h2 className="mt-12 border-b-4 border-ink pb-2 font-headline text-3xl">Common questions</h2>
      <div className="mt-4 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="rounded-xl border bg-card p-4">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <Button asChild size="lg" variant="gold" className="mt-8">
        <Link href="/offers">See deals</Link>
      </Button>
    </Container>
  );
}
