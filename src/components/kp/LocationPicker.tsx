import { useState } from "react";
import { MapPin, Search, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PickedLocation = { latitude: number; longitude: number; address: string };

type Hit = { lat: string; lon: string; display_name: string };

const NOMINATIM = "https://nominatim.openstreetmap.org";

export function LocationPicker({
  latitude,
  longitude,
  address,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  address: string;
  onPick: (l: PickedLocation) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (q.trim().length < 3) return toast.error("Type a street, suburb or township");
    setBusy(true);
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=json&limit=5&countrycodes=za&q=${encodeURIComponent(q.trim())}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error();
      const data: Hit[] = await res.json();
      setHits(data);
      if (!data.length) toast.error("No matching places found. Try a nearby suburb or landmark.");
    } catch {
      toast.error("Address search is unavailable. Try again, or use your current location.");
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
    if (!navigator.geolocation) return toast.error("Location is not available on this device");
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
        toast.error("Could not get your location. Please allow location access or search instead.");
      },
      { timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-semibold">Business location *</p>
      <div className="flex gap-2">
        <Input
          className="h-12"
          placeholder="Search your street or suburb, e.g. Mandela Park, Khayelitsha"
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
          <Search className="size-4" /> Search
        </Button>
      </div>
      <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={useCurrent}>
        <LocateFixed className="size-4" /> Use my current location
      </Button>
      {hits.length > 0 && (
        <ul className="divide-y rounded-lg border bg-card text-sm">
          {hits.map((h) => (
            <li key={`${h.lat},${h.lon},${h.display_name}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
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
          <MapPin className="size-4 shrink-0 text-primary" />
          <span>
            {address}
            <br />
            <span className="text-xs text-muted-foreground">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Pools are limited to businesses near the collection point, so we need your location.
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Searches are sent to OpenStreetMap to find coordinates.
      </p>
    </div>
  );
}
