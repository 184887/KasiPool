"use client";

import type { ReactNode } from "react";
import {
  Inbox,
  ArrowLeftRight,
  BadgeCheck,
  CheckCircle2,
  Circle,
  CircleDot,
  CircleMinus,
  CircleSlash,
  Clock3,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import type { Tone } from "@/lib/status";

const toneCls: Record<Tone, string> = {
  open: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
  gold: "bg-gold-soft text-gold-foreground",
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: ReactNode;
  className?: string;
}) {
  // Labels come in English (the icon is picked from them) and are translated for display
  const { t } = useT();
  const label = typeof children === "string" ? children.toLowerCase() : "";
  const completed = label === "completed" || label === "received";
  const Icon =
    label.includes("cancel") || label.includes("issue") || label.includes("problem")
      ? CircleSlash
      : label.includes("target reached") ||
          label.includes("awaiting confirmation") ||
          label.includes("confirm your order")
        ? CircleDot
        : label.includes("out for delivery")
          ? PackageCheck
          : label.includes("completed") || label.includes("received") || label === "delivered"
            ? BadgeCheck
            : label.includes("paid") || label.includes("payment confirmed")
              ? CheckCircle2
              : label === "confirmed"
                ? CircleDot
                : label.includes("awaiting payment") ||
                    label.includes("waiting for payment") ||
                    label.includes("checking payment") ||
                    label.includes("payment due") ||
                    label === "pay"
                  ? Clock3
                  : label.includes("procurement") ||
                      label.includes("ordered") ||
                      label.includes("stock received")
                    ? ArrowLeftRight
                    : label.includes("preparing") || label.includes("getting your stock")
                      ? ArrowLeftRight
                      : label.includes("unsuccessful") ||
                          label.includes("failed") ||
                          label.includes("below target")
                        ? CircleMinus
                        : label.includes("open") || label.includes("scheduled")
                          ? Circle
                          : tone === "success"
                            ? CheckCircle2
                            : tone === "warning"
                              ? Clock3
                              : tone === "danger"
                                ? CircleSlash
                                : tone === "info"
                                  ? ArrowLeftRight
                                  : CircleMinus;
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-sm px-2 text-sm font-bold whitespace-nowrap",
        completed ? "bg-success text-white" : toneCls[tone],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {typeof children === "string" ? t(children) : children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-md border-2 border-dashed border-ink/30 bg-card px-6 py-10 text-center">
      <Inbox className="mb-3 size-8 text-muted-foreground" />
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Grey blocks in the shape of a page while data loads, so the layout doesn't jump when it
 * arrives. `inline` is for a list inside a page that is already showing.
 */
export function Loading({ label, inline }: { label?: string; inline?: boolean }) {
  const { t } = useT();
  const block = "rounded-md bg-ink/10 animate-pulse";
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(!inline && "mx-auto max-w-3xl px-4 py-6", "animate-fade-in")}
    >
      <span className="sr-only">{label ?? t("Loading…")}</span>
      {!inline && <div className={cn(block, "mb-2 h-11 w-2/3 max-w-xs")} />}
      {!inline && <div className={cn(block, "mb-6 h-4 w-1/2 max-w-[14rem]")} />}
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(block, "h-28")} style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-md border-2 border-ink bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-headline text-3xl tabular",
          tone === "gold" && "text-ember",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-headline text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Big Anton section heading over a thick ink rule, as in the pitch deck. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b-4 border-ink pb-2">
      <h2 className="font-headline text-3xl">{children}</h2>
      {action}
    </div>
  );
}

export function Section({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-md border-2 border-ink bg-card p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-xl font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
