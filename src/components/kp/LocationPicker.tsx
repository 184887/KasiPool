import { useState } from "react";
import { MapPin, Search, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mapsUrl, NOMINATIM } from "@/lib/delivery";
import { useT } from "@/i18n";

export type PickedLocation = { latitude: number; longitude: number; address: string };

type Hit = { lat: string; lon: string; display_name: string };

export function LocationPicker({
  latitude,
  longitude,
  address,
  onPick,
  title,
  hint,
}: {
  latitude: number | null;
  longitude: number | null;
  address: string;
  onPick: (l: PickedLocation) => void;
  title?: string;
  hint?: string;
}) {
  const { t, rich } = useT();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (q.trim().length < 3) return toast.error(t("Type a street, suburb or township"));
    setBusy(true);
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=json&limit=5&countrycodes=za&q=${encodeURIComponent(q.trim())}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error();
      const data: Hit[] = await res.json();
      setHits(data);
      if (!data.length)
        toast.error(t("No matching places found. Try a nearby suburb or landmark."));
    } catch {
      toast.error(t("Search is not working now. Try again, or use where you are now."));
    } finally {
      setBusy(false);
    }
  }

  function pick(h: Hit) {
    onPick({ latitude: +h.lat, longitude: +h.lon, address: h.display_name });
    setHits([]);
    setQ("");
  }

  function useCurrent() {
    if (!navigator.geolocation) return toast.error(t("Location is not available on this device"));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        let name = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        try {
          const res = await fetch(`${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (res.ok) name = (await res.json()).display_name ?? name;
        } catch {
          // keep coordinates as the address
        }
        onPick({ latitude: lat, longitude: lon, address: name });
        setBusy(false);
      },
      () => {
        setBusy(false);
        toast.error(t("We could not find where you are. Allow location on your phone, or search."));
      },
      { timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-semibold">{title ?? t("Map pin")}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          className="h-12"
          aria-label={t("Search your street or area")}
          placeholder={t("Street or area, like Site C")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <Button type="button" variant="outline" className="h-12" disabled={busy} onClick={search}>
          <Search className="size-4" /> {t("Search")}
        </Button>
      </div>
      <Button type="button" variant="ghost" disabled={busy} onClick={useCurrent}>
        <LocateFixed className="size-4" /> {t("Use my current location")}
      </Button>
      {hits.length > 0 && (
        <ul className="divide-y rounded-lg border bg-card text-sm">
          {hits.map((h) => (
            <li key={`${h.lat},${h.lon},${h.display_name}`}>
              <button
                type="button"
                className="min-h-12 w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => pick(h)}
              >
                {h.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {latitude != null && longitude != null ? (
        <p className="flex gap-2 text-sm">
          <MapPin className="size-4 shrink-0 text-leaf" />
          <span>
            <b>{t("Pin added.")}</b> {address}
            <br />
            <a
              href={mapsUrl(latitude, longitude) ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-ember underline underline-offset-4"
            >
              {t("Check it on the map")}
            </a>
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {hint ??
            rich(
              "Many places have no street number, so the pin is how the driver finds you. Best: stand at your business and tap <b>Use my current location</b>. Not there now? You can do it later, but you need it to confirm an order.",
              { b: (c) => <b>{c}</b> },
            )}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {t("We use OpenStreetMap to search for places.")}
      </p>
    </div>
  );
}
