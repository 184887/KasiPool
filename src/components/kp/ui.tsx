import type { ReactNode } from "react";
import {
  Loader2,
  Inbox,
  AlertTriangle,
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
  const label = typeof children === "string" ? children.toLowerCase() : "";
  const completed = label === "completed" || label === "collected";
  const Icon =
    label.includes("cancel") || label.includes("issue")
      ? CircleSlash
      : label.includes("target reached") ||
          label.includes("awaiting confirmation") ||
          label.includes("confirm your order")
        ? CircleDot
        : label.includes("ready for collection")
          ? PackageCheck
          : label.includes("completed") || label.includes("collected")
            ? BadgeCheck
            : label.includes("paid") || label.includes("payment confirmed")
              ? CheckCircle2
              : label === "confirmed"
                ? CircleDot
                : label.includes("awaiting payment") ||
                    label.includes("payment due") ||
                    label === "pay"
                  ? Clock3
                  : label.includes("procurement") ||
                      label.includes("ordered") ||
                      label.includes("stock received")
                    ? ArrowLeftRight
                    : label.includes("preparing")
                      ? ArrowLeftRight
                      : label.includes("unsuccessful") || label.includes("below target")
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
        "inline-flex h-[26px] items-center gap-1 rounded-full px-2.5 text-xs font-bold whitespace-nowrap",
        completed ? "bg-success text-white" : toneCls[tone],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
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
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <Inbox className="mb-3 size-8 text-muted-foreground" />
      <p className="font-display text-lg font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-16 text-muted-foreground"
      role="status"
    >
      <Loader2 className="size-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive-soft p-4 text-sm text-destructive"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {message}
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
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-bold tabular",
          tone === "gold" && "text-gold-foreground",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
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
        <h1 className="font-display text-[26px] font-bold leading-[30px] sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
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
    <section className={cn("rounded-2xl border bg-card p-4 shadow-card sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="font-display text-xl font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
