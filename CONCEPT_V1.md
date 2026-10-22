# KasiPool – Concept V1

**Venture:** KasiPool
**Team:** KasiPool – Magnus Fondenes, Levi Anastasis-Lan, Valerie Kyolaba, Biggie Muchabwera, Fulufhelo Mulaudzi, Chris Mabhele
**Programme:** UCT MakersForge, VentureVerse, October 2026
**Date:** [DATE]

> **Draft status.** Text marked **[TODO]** or **[A]** still needs real input from the team. Numbers marked [A] are assumptions to be replaced with field data (see `NUMBERS.md`).

---

## 1. One-liner

KasiPool helps small township businesses buy stock together, so they get bulk prices without trusting anyone with their money.

## 2. The problem

Township spaza shops share the same supply needs: the same staples, from the same wholesalers. But local owners buy alone. Each one buys small quantities, too small to qualify for bulk prices, and has to travel to the cash and carry, often by taxi, closing the shop while they go.

This has three costs:
1. **Higher stock prices.** At a hybrid wholesaler we interviewed, bulk prices apply only to full-pallet buyers. A single spaza needs one or two units of a product, not a pallet.
2. **High transport costs.** The wholesaler told us transport makes small trips expensive. Standard Bank's 2025 township research lists "the absence of group buying benefits" and "transportation difficulties for stock collection" as common challenges, eroding already thin margins (SB p. 8, p. 13).
3. **Losing ground to organised competitors.** Foreign-owned shops (Somali, Bangladeshi, Chinese) buy together in small, organised groups of roughly 10–15 and get the volume price. Local owners mostly don't. In the wholesaler's words, local bulk buying is "minimal" because "they're not working together."

**Problem statement:** Township businesses share common supply needs but operate in isolation, missing opportunities to reduce costs and improve profitability through economies of scale.

## 3. Target customer

**Primary:** small, South African-owned township businesses that buy the same kinds of stock, in a single township cluster, starting with **[AREA, e.g. Philippi]**. This includes spaza shops, taverns and liquor sellers, salons and barbers, takeaways and food sellers.
- Spaza shops are the biggest group and the one we've tested most so far. Roughly 4–7 per 1,000 people in Cape Town townships; Browns Farm in Philippi alone has around 170 (REDI3x3, 2014; to be rechecked).
- Across five Cape Town townships, liquor sellers (20%), spaza/grocery shops (15%), hair care (6.5%) and takeaways (6%) are the most common micro-enterprises (REDI p. 22). All of them buy stock regularly.
- Most township businesses turn over R100k–R500k a year (SB p. 6). Margins are thin and competition is intense.
- Owners already use WhatsApp heavily (74% of township businesses, SB p. 23) and many pay for stock by EFT (SB p. 18).

**Not our first customer:** foreign-owned shop networks. They already buy together with no friction, so they have little reason to switch.

**Partner customer:** wholesalers and suppliers, who gain new bulk customers they currently don't reach.

**Later segments:** any group with the same buying need can pool, for example students in residences or shared houses buying groceries together. We'll test these only after township business pools work. That's why onboarding is built around a **pool**, not a shop: a pool has a type (spaza, tavern, salon, student residence…), members, a group bank account, a product list and a delivery point. Nothing in it assumes the members are shops, so a new segment is just a new pool type.

## 4. What we learned from problem testing

We spoke to [TODO: number] people outside a cash and carry in [TODO: area] on 21 October 2026, plus staff at one hybrid wholesale/retail store. Full log: `PROBLEM_TESTING.md`.

| We assumed | We found |
|------------|----------|
| Local owners compete too much to cooperate. | **Wrong.** People told us locals are willing to come together when it means making money. |
| Group buying would be a new habit. | **It already exists.** Foreign-owned shops buy together in organised groups. Some locals do too, but informally: handshake deals, informal arrangements, Facebook. It all runs on trust. |
| Bulk buying gives a big saving. | **The saving is modest:** about 2.5–5% per the wholesaler. But for a spaza with ~20% margins, it can mean up to 16–22% more profit once transport savings are included (see section 7). |
| Wholesalers would resist a middleman. | **The wholesaler was positive** about bringing more local customers. |

**Key insight:** the barrier isn't willingness to cooperate. It's that local group buying has no structure, so it stays small and depends on personal trust.

## 5. The solution

KasiPool turns the trust-based group buying locals already do into organised bulk orders, without asking anyone to hand their money to a stranger.

Nearby township businesses (spaza shops, taverns, salons, food sellers) order through **WhatsApp**, the tool they already use. Each business pays its share into a **group bank account that the businesses own themselves**, not KasiPool. KasiPool combines the orders into one bulk order with a partner wholesaler, and the group gets **one bulk order delivered**.

This answers the biggest problem we found: local group buying stays small because it runs on personal trust. With KasiPool, the money stays with the group, and KasiPool organises the order.

## 6. How it works (MVP)

1. **Form a pool:** a group of nearby businesses that buy similar stock joins a KasiPool WhatsApp group (e.g. a spaza pool, a tavern pool). [TODO: how many businesses per pool?]
2. **Open a group account:** the pool opens a **stokvel account**, a product every big SA bank already offers for groups. For example, FNB's needs 3 members and 3 signatories, has no monthly fee and opens online; at Standard Bank every payment needs approval from 3 signatories, so nobody can take the money alone. KasiPool gives each pool a simple constitution template. (Details: `BANK_ACCOUNTS.md`.) [TODO: confirm with a bank that a group of business owners may use one to buy stock]
3. **Order:** each week, businesses send their orders on WhatsApp (e.g. maize meal and cooking oil for spazas, drinks for taverns, hair products for salons). KasiPool adds them up.
4. **Pay their share:** each shop pays its share into the group account.
5. **Bulk order:** KasiPool places one combined bulk order with a partner wholesaler, and the group account pays the wholesaler.
6. **Delivery:** the bulk order is delivered. [TODO: to one drop point or to each shop? who pays for delivery?]
7. **Split and check:** each shop collects or receives its share, and problems are reported in the WhatsApp group. [TODO: how are shares split and checked?]

A full app with in-app payments and QR-confirmed delivery is a possible later version, once pools are working on WhatsApp.

**Opportunity found in testing:** wholesalers post weekly specials (e.g. R50 instead of R70) in WhatsApp groups for business customers. KasiPool can pool orders around specials for a much bigger saving.

## 7. Value: does it add up?

Worked example for one typical spaza buying R12,000/month of staples through a pool (draft, full detail in `NUMBERS.md`). The owner saves 2.5–5% on price plus R520 in transport, and pays KasiPool nothing. **How delivery works decides the result:**

| Delivery option | Net saving/month | Extra profit |
|---|---|---|
| Wholesaler delivers free above a minimum order | R820 – R1,120 | +16% to +22% |
| Group hires a bakkie to one drop point, weekly [A] | R220 – R520 | +4% to +10% |
| Group hires a bakkie to each shop, weekly [A] | R20 – R320 | +0% to +6% |

So we will (1) negotiate free delivery as part of the wholesaler deal, (2) order every two weeks rather than weekly where possible, and (3) ask members to pay in by EFT, since cash deposit fees (~1% at an ATM) could eat a quarter to half of the bulk saving. A tavern example gives a similar result (`NUMBERS.md`).

**Pool size:** Wholesaler 1 gives the bulk price per full pallet. A pallet of ~100 bags of maize meal needs ~34 spazas ordering weekly, but only ~9 ordering monthly [A]. Small pools that order less often are easier to trust and organise.

**For the owner:** lower prices, no trips to the cash and carry, more time in the shop.
**For wholesalers:** new bulk customers and volume from shops they don't reach today.
**For the community:** local owners compete on a more level playing field and more money stays in local businesses.

## 8. Alternatives and competition

| Alternative | Why it falls short for local owners |
|-------------|----------------------------------|
| Buying alone at the cash and carry | Retail prices, transport cost, shop closed |
| Informal group buying (handshake, Facebook) | Depends on personal trust, no protection if it goes wrong, stays small |
| Foreign-owned buying networks | Closed to local owners |
| **Stock platforms: Yebo Fresh (Cape Town), Vuleka (Johannesburg)** | They buy stock, keep it in their own warehouses and resell to shops, with WhatsApp ordering and buy-now-pay-later. Each shop still buys alone from one supplier and doesn't control the money. |
| Older spaza ordering apps (Zuzela, Spazapp) | One shop orders alone, so no group price. Unclear if still active. |
| Wholesaler's own WhatsApp group, online ordering and delivery | Still needs bulk-size orders; delivery limited by security concerns |
| Consumer stokvel programmes (Makro stokvel card, bank grocery stokvel accounts) | Built for households saving for groceries, not businesses buying stock. |

**What makes KasiPool different:** unlike stock platforms like Yebo Fresh and Vuleka, which sell to shops from their own warehouses, KasiPool helps businesses buy together straight from wholesalers, with the money kept in a bank account the group owns. No warehouse and no stock risk for us, and owners keep control of their money. (Details: `COMPETITORS.md`.)

## 9. Business model (first idea)

- **Wholesalers pay KasiPool a small commission** for bringing them a steady weekly order (~1.5% of order value [A]).
- Shops pay KasiPool nothing, so their whole saving stays with them.
- At 100 shops: ~R1.2m/month pooled volume and ~R18,000/month commission [A].
- Costs stay low: no warehouse, no stock, mainly people time to run pools on WhatsApp.
- If wholesalers won't pay 1.5% (their margins are thin), fallbacks are a share of the discount, a small monthly fee per pool, or payment from brands for promoting their products in pools.
- [TODO: who covers delivery cost: ideally the wholesaler, as free delivery above a minimum order]

## 10. Key assumptions and risks to test next

| # | Assumption | Status | Why it matters |
|---|------------|--------|----------------|
| A5 | Owners will trust a group account they own together | **Untested – biggest risk** | The group account removes the need to trust KasiPool, but owners still have to trust each other and the signatories. |
| – | Pools can open a group bank account and use it for business stock | Partly supported | Stokvel accounts exist at all big banks, often with no monthly fee (`BANK_ACCOUNTS.md`). But they're personal savings products, so we must confirm business use is allowed. Only 20% of Philippi businesses had a bank account (HSRC p. 3), and cash deposit fees are high. |
| – | Competitors with their own stock (Yebo Fresh, Vuleka) won't win these customers first | Untested | Yebo Fresh already serves Cape Town townships via WhatsApp. Ask owners if they use it. |
| – | Wholesalers will give pooled groups the bulk price and pay commission | Untested | Core of the business model. |
| – | Delivery is affordable and safe | Risk | Crime affects 53% of Philippi businesses (HSRC p. 8). Wholesaler raised security too. |
| – | WhatsApp is enough to run a pool | Likely | 74% of township businesses use WhatsApp (SB p. 23). |

## 11. Next steps

- Interview at least 5 more local spaza owners about trust, fees and trip costs
- Visit 2 more wholesalers about pooled pricing, minimums and commission
- Replace assumptions in the numbers with field data
- Call a bank (FNB or Standard Bank) to confirm a pool of business owners can use a stokvel account to pay a wholesaler
- Ask wholesalers whether the bulk price is per pallet or per order value, and from what order size they deliver free
- Run one test pool on WhatsApp with about 10 nearby shops, ordering every two weeks
- Later: test whether students in residences want to pool (V2 or later)
- Explore building trust through people owners already know, e.g. a local "pool captain" per cluster [idea to test]

---

**Sources:** Standard Bank *Township Informal Economy Report* (Oct 2025); HSRC *Innovating to survive* (Philippi, 2025); Charman & Petersen, REDI3x3 Working Paper 5 (2014); bank stokvel account pages (FNB, Standard Bank, Absa, Nedbank); public information on Yebo Fresh, Vuleka, Zuzela and Spazapp; own interviews 21 Oct 2026.
