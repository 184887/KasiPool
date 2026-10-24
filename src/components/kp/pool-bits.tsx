import { useEffect, useState } from "react";
import { Minus, Plus, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { pct } from "@/lib/format";
import { TIMELINE } from "@/lib/status";

/** The deck's two interlocking rings: orange passes over green at the top crossing. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 260" aria-hidden="true" className={className}>
      <circle cx="130" cy="130" r="105" fill="none" stroke="#F2892B" strokeWidth="36" />
      <circle cx="270" cy="130" r="105" fill="none" stroke="#3E9A62" strokeWidth="36" />
      <path
        d="M174.4,34.8 A105,105 0 0 1 220.9,77.5"
        fill="none"
        stroke="#F2892B"
        strokeWidth="36"
      />
    </svg>
  );
}

/** Rings mark + "KasiPool" wordmark. Use `light` on ink backgrounds. */
export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label="KasiPool"
      className={cn("inline-flex items-center gap-2", light ? "text-paper" : "text-ink", className)}
    >
      <LogoMark className="h-7 w-auto sm:h-8" />
      <span
        aria-hidden="true"
        className="font-display text-[22px] leading-none font-extrabold tracking-[-0.03em] sm:text-2xl"
      >
        Kasi<span className="text-gold">Pool</span>
      </span>
    </span>
  );
}

/** The signature pooling progress indicator. Shows interest only (not payment). */
export function PoolProgress({
  pledged,
  target,
  participants,
  unit,
  size = "md",
  label = "pledged",
}: {
  pledged: number;
  target: number;
  participants: number;
  unit: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const p = pct(pledged, target);
  const reached = pledged >= target;
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(p), 50);
    return () => clearTimeout(t);
  }, [p]);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p
          className={cn(
            "font-display font-bold tabular",
            size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base",
          )}
        >
          {pledged}{" "}
          <span className="font-sans text-sm font-medium text-muted-foreground">
            of {target} {unit}s {label}
          </span>
        </p>
        <span
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-xs font-bold tabular",
            reached ? "bg-gold text-ink animate-pop" : "bg-muted text-ink",
          )}
        >
          {p}%
        </span>
      </div>
      <div
        className={cn(
          "relative mt-2 overflow-hidden rounded-sm bg-muted",
          size === "lg" ? "h-5" : size === "md" ? "h-3.5" : "h-2.5",
        )}
        role="progressbar"
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Pool progress"
      >
        <div
          className="h-full bg-leaf transition-[width] duration-1000 ease-out"
          style={{ width: `${w}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span>
          <Users className="mr-1 inline size-3.5" aria-hidden="true" />
          {participants} {participants === 1 ? "business" : "businesses"} pooling
        </span>
        {!reached && size !== "sm" && (
          <span className="ml-auto whitespace-nowrap tabular">
            {Math.max(target - pledged, 0)} to go
          </span>
        )}
      </div>
    </div>
  );
}

export function Countdown({ to, className }: { to: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span className={className}>…</span>;
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return <span className={className}>Closed</span>;
  const d = Math.floor(ms / 86400000),
    h = Math.floor((ms % 86400000) / 3600000),
    m = Math.floor((ms % 3600000) / 60000),
    s = Math.floor((ms % 60000) / 1000);
  return (
    <span className={cn("tabular", className)}>
      {d > 0 && `${d}d `}
      {h}h {m}m {d === 0 && `${s}s`}
    </span>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center rounded-md border-2 border-ink bg-card">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="grid size-14 place-items-center text-primary disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="size-5" />
      </button>
      <input
        aria-label="Quantity"
        inputMode="numeric"
        className="h-14 w-16 border-x-2 border-ink bg-transparent text-center font-headline text-3xl tabular outline-none"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, "") || "0", 10);
          onChange(Math.min(max, n));
        }}
        onBlur={() => onChange(Math.max(min, Math.min(max, value)))}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        className="grid size-14 place-items-center text-primary disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}

export function OrderTimeline({ step, failed }: { step: number; failed?: string | null }) {
  return (
    <ol className="relative space-y-0">
      {TIMELINE.map((label, i) => {
        const done = i < step || (i === step && i === TIMELINE.length - 1);
        const current = i === step && !failed && i !== TIMELINE.length - 1;
        return (
          <li key={label} className="relative flex gap-3 pb-5 last:pb-0">
            {i < TIMELINE.length - 1 && (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5",
                  i < step ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : current
                    ? "border-gold bg-gold-soft text-gold-foreground ring-4 ring-gold/25"
                    : "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "pt-0.5 text-sm",
                current ? "font-bold" : done ? "font-medium" : "text-muted-foreground",
              )}
            >
              {label}
              {current && (
                <span className="ml-2 rounded bg-gold-soft px-1.5 py-0.5 text-[11px] font-bold text-gold-foreground">
                  Current
                </span>
              )}
            </span>
          </li>
        );
      })}
      {failed && (
        <li className="mt-3 rounded-lg bg-destructive-soft p-3 text-sm text-destructive">
          {failed}
        </li>
      )}
    </ol>
  );
}
