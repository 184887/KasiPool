"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { STEPS } from "@/views/home";

const FAQ = [
  [
    "Do I pay when I join a pool?",
    "No. You pay when your stock arrives, in cash or by bank transfer (EFT).",
  ],
  ["What if the pool does not fill up?", "The deal stops and you pay nothing."],
  [
    "Can I change my order?",
    "Yes. While the pool is open, you can change how many you want, or leave the pool.",
  ],
  [
    "How do I pay?",
    "When you confirm your order, choose cash or bank transfer. Cash: pay at the door when your stock arrives. Bank transfer: use your order number as the reference, then send us a photo of your payment slip in the app. Your order shows 'Paid' when we find the money in our bank account.",
  ],
  [
    "What if some businesses don't confirm?",
    "The pool opens again for other businesses until the closing date. If it is still not full, the deal stops. If you paid early, we pay you back.",
  ],
  [
    "How do I get my stock?",
    "A courier delivers it to the address in your profile. Each deal shows the areas it delivers to and the delivery fee for your area. When it arrives, tap 'I received my stock' on your order.",
  ],
];

export function HowItWorks() {
  return (
    <Container className="max-w-3xl">
      <h1 className="font-headline text-4xl sm:text-5xl">How KasiPool works</h1>
      <p className="mt-2 text-muted-foreground">
        Many businesses. One big order. Better prices for everyone.
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
