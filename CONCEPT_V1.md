# KasiPool – Concept V1

**Venture:** KasiPool
**Team:** [TEAM NAME] – [6 member names]
**Programme:** UCT MakersForge, VentureVerse, October 2026
**Date:** [DATE]

> **Draft status.** Text marked **[TODO]** or **[A]** still needs real input from the team. Numbers marked [A] are assumptions to be replaced with field data (see `NUMBERS.md`).

---

## 1. One-liner

KasiPool lets local spaza owners pool their stock orders into bulk purchases, so they get the wholesale prices and delivery that organised shop networks already enjoy.

## 2. The problem

Township spaza shops share the same supply needs: the same staples, from the same wholesalers. But local owners buy alone. Each one buys small quantities, too small to qualify for bulk prices, and has to travel to the cash and carry, often by taxi, closing the shop while they go.

This has three costs:
1. **Higher stock prices.** At a hybrid wholesaler we interviewed, bulk prices apply only to full-pallet buyers. A single spaza needs one or two units of a product, not a pallet.
2. **High transport costs.** The wholesaler told us transport makes small trips expensive. Standard Bank's 2025 township research lists "the absence of group buying benefits" and "transportation difficulties for stock collection" as common challenges, eroding already thin margins (SB p. 8, p. 13).
3. **Losing ground to organised competitors.** Foreign-owned shops (Somali, Bangladeshi, Chinese) buy together in small, organised groups of roughly 10–15 and get the volume price. Local owners mostly don't. In the wholesaler's words, local bulk buying is "minimal" because "they're not working together."

**Problem statement:** Township businesses share common supply needs but operate in isolation, missing opportunities to reduce costs and improve profitability through economies of scale.

## 3. Target customer

**Primary:** South African-owned spaza shops in a single township cluster, starting with **[AREA, e.g. Philippi]**.
- Roughly 4–7 spaza shops per 1,000 people in Cape Town townships. Browns Farm in Philippi alone has around 170 (REDI3x3, 2014; to be rechecked).
- Most township businesses turn over R100k–R500k a year (SB p. 6). Margins are thin and competition is intense.
- Owners already use WhatsApp heavily (74% of township businesses, SB p. 23) and many pay for stock by EFT (SB p. 18).

**Not our first customer:** foreign-owned shop networks. They already buy together with no friction, so they have little reason to switch.

**Partner customer:** wholesalers and cash and carries, who gain new bulk customers they currently don't reach.

## 4. What we learned from problem testing

We spoke to [TODO: number] people outside a cash and carry in [TODO: area] on 21 October 2026, plus staff at one hybrid wholesale/retail store. Full log: `PROBLEM_TESTING.md`.

| We assumed | We found |
|------------|----------|
| Local owners compete too much to cooperate. | **Wrong.** People told us locals are willing to come together when it means making money. |
| Group buying would be a new habit. | **It already exists.** Foreign-owned shops buy together in organised groups. Some locals do too, but informally: handshake deals, informal arrangements, Facebook. It all runs on trust. |
| Bulk buying gives a big saving. | **The saving is modest:** about 2.5–5% per the wholesaler. But for a spaza with ~20% margins, that's a 12–18% increase in profit once transport savings are included (see section 7). |
| Wholesalers would resist a middleman. | **The wholesaler was positive** about bringing more local customers. |

**Key insight:** the barrier isn't willingness to cooperate. It's that local group buying has no structure, so it stays small and depends on personal trust.

## 5. The solution

KasiPool is an app that turns the trust-based group buying locals already do into safe, organised bulk orders.

Owners reserve the staples they need within a short campaign window and pay upfront through the app. KasiPool combines the orders into one bulk order with a partner wholesaler and has it delivered directly to each shop. Delivery is confirmed by scanning a QR code.

KasiPool keeps the existing habit and adds the structure that's missing: payments held safely, verified orders, confirmed delivery and an in-app way to sort out problems.

## 6. How it works (MVP)

1. **Register:** spaza owners sign up and upload a permit or trade proof. We start with one cluster.
2. **Reserve:** owners browse focus staples (e.g. 10 kg maize meal, 5 L cooking oil) and book quantities within campaign caps.
3. **Pay upfront:** owners pay in advance plus a small delivery fee, in-app (Instant EFT/payment gateway), within a 24-hour window.
4. **Pool and order:** KasiPool checks the combined order meets the bulk minimum (e.g. 8 tons) and places one consolidated order with the wholesaler. A logistics partner is booked.
5. **Transport:** independent drivers load the order directly at the supplier's depot. No warehouse needed.
6. **Deliver to the shop:** the driver delivers to each shop. Handover is verified by scanning the shop's QR code.
7. **Claims and settlement:** any problem is logged in-app with a photo. Final payment goes to partners.

**Opportunity found in testing:** wholesalers post weekly specials (e.g. R50 instead of R70) in WhatsApp groups for business customers. KasiPool can pool orders around specials for a much bigger saving.

## 7. Value: does it add up?

Worked example for one typical spaza (draft, full detail in `NUMBERS.md`):

| | Low | High |
|---|---|---|
| Bulk saving on R12,000/month of staples [A] | R300 | R600 |
| Transport saved (2 fewer trips) [A] | R520 | R520 |
| KasiPool delivery fee [A] | −R200 | −R200 |
| **Net saving per month** | **R620** | **R920** |
| **Extra profit for the owner** | **+12%** | **+18%** |

**For the owner:** lower prices, no trips to the cash and carry, more time in the shop.
**For wholesalers:** new bulk customers and volume from shops they don't reach today.
**For the community:** local owners compete on a more level playing field and more money stays in local businesses.

## 8. Alternatives and competition

| Alternative | Why it falls short for local owners |
|-------------|----------------------------------|
| Buying alone at the cash and carry | Retail prices, transport cost, shop closed |
| Informal group buying (handshake, Facebook) | Depends on personal trust, no protection if it goes wrong, stays small |
| Foreign-owned buying networks | Closed to local owners |
| Wholesaler's own WhatsApp group, online ordering and delivery | Still needs bulk-size orders; delivery limited by security concerns |
| [TODO: check for other apps or initiatives in SA, e.g. distributor apps, stokvel buying groups] | |

## 9. Business model (first idea)

- **Delivery fee** paid by the owner (~R100 per delivery [A]), roughly covering delivery cost.
- **Commission from wholesalers** (~1.5% of order value [A]) for bringing pooled bulk orders.
- At 100 shops: ~R1.2m/month pooled volume and ~R18,000/month commission [A].

## 10. Key assumptions and risks to test next

| # | Assumption | Status | Why it matters |
|---|------------|--------|----------------|
| A5 | Owners will trust an app with money upfront | **Untested – biggest risk** | Informal buying runs on personal trust. Without trust, no advance payments. |
| A3 | Owners will pay a delivery fee | Untested | Fee must stay below the saving. |
| – | Wholesalers will give pooled groups the bulk price and pay commission | Untested | Core of the business model. |
| – | Direct-to-shop delivery is safe | Risk | Crime affects 53% of Philippi businesses (HSRC p. 8). Wholesaler raised security too. |
| – | Owners can pay digitally | Partly supported | 56% prefer EFT (SB), but only 20% of Philippi businesses had a bank account (HSRC). May need a cash option. |

## 11. Next steps

- Interview at least 5 more local spaza owners about trust, fees and trip costs
- Visit 2 more wholesalers about pooled pricing, minimums and commission
- Replace assumptions in the numbers with field data
- Explore building trust through people owners already know, e.g. a local "pool captain" per cluster [idea to test]

---

**Sources:** Standard Bank *Township Informal Economy Report* (Oct 2025); HSRC *Innovating to survive* (Philippi, 2025); Charman & Petersen, REDI3x3 Working Paper 5 (2014); own interviews 21 Oct 2026.
