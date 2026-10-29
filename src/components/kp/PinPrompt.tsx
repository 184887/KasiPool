"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { missingPin } from "@/lib/delivery";
import { errMsg } from "@/lib/queries";
import { cn } from "@/lib/utils";

/** Phone locations rougher than this (in metres) would send the driver to the wrong place */
const MAX_ERROR_M = 200;

/**
 * Asks a shop without an exact map pin to set one, with one tap while standing at the place.
 * Shows nothing once the pin is set. A shop needs the pin before it can confirm an order.
 */
export function PinPrompt({
  business,
  className,
}: {
  business: Tables<"businesses"> | null;
  className?: string;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const missing = missingPin(business);
  if (!business || !missing) return null;
  const place = missing === "other" ? "the other address" : "your business";

  function setHere() {
    if (!navigator.geolocation) return toast.error("Location is not available on this device");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (coords.accuracy > MAX_ERROR_M) {
          setBusy(false);
          return toast.error(
            `Your phone only knows roughly where you are (about ${Math.round(coords.accuracy)} m). Go outside and try again.`,
          );
        }
        const pin =
          missing === "other"
            ? { delivery_latitude: coords.latitude, delivery_longitude: coords.longitude }
            : { latitude: coords.latitude, longitude: coords.longitude };
        const { error } = await supabase.from("businesses").update(pin).eq("id", business!.id);
        setBusy(false);
        if (error) return toast.error(errMsg(error));
        toast.success("Map pin saved. Thank you!");
        qc.invalidateQueries({ queryKey: ["my-business"] });
        qc.invalidateQueries({ queryKey: ["pool-distances"] });
      },
      () => {
        setBusy(false);
        toast.error("We could not find where you are. Allow location on your phone and try again.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className={cn("rounded-md border-2 border-ink bg-gold-soft p-4 text-ink", className)}>
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <MapPin className="size-5 shrink-0" aria-hidden="true" /> Set your map pin
      </p>
      <p className="mt-1 text-sm">
        The driver uses the pin to find {place}. When you are there, tap the button. You need the
        pin to confirm an order.
      </p>
      <Button size="lg" variant="gold" className="mt-3 w-full" disabled={busy} onClick={setHere}>
        {busy
          ? "Finding you…"
          : missing === "other"
            ? "I am at the other address now"
            : "I am at my business now"}
      </Button>
      <Link
        href="/profile"
        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline"
      >
        Not there? Search for the place in your profile
      </Link>
    </div>
  );
}
