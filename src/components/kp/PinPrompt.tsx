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
import { useT } from "@/i18n";

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
  const { t, server } = useT();
  const [busy, setBusy] = useState(false);
  const missing = missingPin(business);
  if (!business || !missing) return null;

  function setHere() {
    if (!navigator.geolocation) return toast.error(t("Location is not available on this device"));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (coords.accuracy > MAX_ERROR_M) {
          setBusy(false);
          return toast.error(
            t(
              "Your phone only knows roughly where you are (about {m} m). Go outside and try again.",
              { m: Math.round(coords.accuracy) },
            ),
          );
        }
        const pin =
          missing === "other"
            ? { delivery_latitude: coords.latitude, delivery_longitude: coords.longitude }
            : { latitude: coords.latitude, longitude: coords.longitude };
        const { error } = await supabase.from("businesses").update(pin).eq("id", business!.id);
        setBusy(false);
        if (error) return toast.error(server(errMsg(error)));
        toast.success(t("Map pin saved. Thank you!"));
        qc.invalidateQueries({ queryKey: ["my-business"] });
        qc.invalidateQueries({ queryKey: ["pool-distances"] });
      },
      () => {
        setBusy(false);
        toast.error(
          t("We could not find where you are. Allow location on your phone and try again."),
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className={cn("rounded-md border-2 border-ink bg-gold-soft p-4 text-ink", className)}>
      <p className="flex items-center gap-2 font-display text-lg font-bold">
        <MapPin className="size-5 shrink-0" aria-hidden="true" /> {t("Set your map pin")}
      </p>
      <p className="mt-1 text-sm">
        {missing === "other"
          ? t(
              "The driver uses the pin to find the other address. When you are there, tap the button. You need the pin to confirm an order.",
            )
          : t(
              "The driver uses the pin to find your business. When you are there, tap the button. You need the pin to confirm an order.",
            )}
      </p>
      <Button size="lg" variant="gold" className="mt-3 w-full" disabled={busy} onClick={setHere}>
        {busy
          ? t("Finding you…")
          : missing === "other"
            ? t("I am at the other address now")
            : t("I am at my business now")}
      </Button>
      <Link
        href="/profile"
        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline"
      >
        {t("Not there? Search for the place in your profile")}
      </Link>
    </div>
  );
}
