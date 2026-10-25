"use client";

import { LegalPage } from "@/components/kp/LegalPage";

export function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>Version v0.1-draft.</p>
      <h2>1. What KasiPool does</h2>
      <p>
        KasiPool aggregates purchasing demand from registered businesses and buys stock from
        wholesalers once enough paid demand is secured. KasiPool resells the products to
        participating businesses at the stated KasiPool price.
      </p>
      <h2>2. Joining a pool</h2>
      <p>
        Joining a pool registers interest only. It is not a binding order and no payment is
        required. You may change or withdraw your interest while the pool is open.
      </p>
      <h2>3. Confirmation and payment</h2>
      <p>
        If a pool reaches its target, you will be asked to confirm your order at the stated price
        and pay within the payment window (24 hours by default). Confirmed prices will not be
        changed.
      </p>
      <h2>4. Funding and procurement</h2>
      <p>
        Stock is ordered only if fully paid orders meet the supplier minimum. If not, the deal fails
        and payments received are refunded.
      </p>
      <h2>5. Supplier availability</h2>
      <p>
        Deals are subject to supplier availability. If a supplier delivers less than ordered,
        affected quantities are refunded.
      </p>
      <h2>6. Delivery</h2>
      <p>
        Goods are delivered by a courier to the delivery address in your profile, in a delivery area
        the deal serves. The delivery fee for your area is shown before you confirm and is added to
        your order total. Delivery dates are confirmed once stock arrives. Please confirm in the app
        when you receive your stock, or report a problem.
      </p>
    </LegalPage>
  );
}
