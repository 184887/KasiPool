import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  head,
  children,
  empty,
}: {
  head: ReactNode[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-md border-2 border-ink bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-center text-sm text-muted-foreground">Nothing to show.</p>}
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn("whitespace-nowrap px-3 py-2.5 align-middle", className)}>{children}</td>
  );
}

export const inputCls = "h-11 w-full rounded-md border-2 border-input bg-card px-3 text-base";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>}
    </label>
  );
}
