"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/kp/ui";
import { Field, inputCls } from "@/components/kp/admin";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { errMsg } from "@/lib/queries";
import { money } from "@/lib/format";

const EMPTY = { name: "", areas: "", delivery_fee: "" };

/** Admin -> Settings: the delivery zones shops pick from, each with a flat fee per order */
export function DeliveryZonesAdmin() {
  const qc = useQueryClient();
  const zones = useQuery({
    queryKey: ["admin-zones"],
    queryFn: async () =>
      (await supabase.from("delivery_zones").select("*").order("sort").order("name")).data ?? [],
  });
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-zones"] });
    qc.invalidateQueries({ queryKey: ["delivery-zones"] });
  };

  async function save() {
    const fee = Number(form.delivery_fee);
    if (!form.name.trim()) return toast.error("Give the zone a name");
    if (form.delivery_fee === "" || !(fee >= 0))
      return toast.error("Enter a delivery fee (0 or more)");
    const row = { name: form.name.trim(), areas: form.areas.trim() || null, delivery_fee: fee };
    const { error } = editing
      ? await supabase.from("delivery_zones").update(row).eq("id", editing)
      : await supabase.from("delivery_zones").insert(row);
    if (error) return toast.error(errMsg(error));
    toast.success(editing ? "Zone updated" : "Zone added");
    setForm(EMPTY);
    setEditing(null);
    refresh();
  }

  async function toggle(z: Tables<"delivery_zones">) {
    const { error } = await supabase
      .from("delivery_zones")
      .update({ active: !z.active })
      .eq("id", z.id);
    if (error) return toast.error(errMsg(error));
    refresh();
  }

  return (
    <Section title="Delivery zones">
      <p className="mb-3 text-sm text-muted-foreground">
        Shops pick their zone with their address. Each deal delivers to the zones you choose, and
        shops pay the zone&apos;s fee once per order.
      </p>
      <ul className="mb-3 divide-y text-sm">
        {(zones.data ?? []).map((z) => (
          <li key={z.id} className="flex items-start justify-between gap-3 py-2">
            <div className={z.active ? undefined : "opacity-60"}>
              <b>{z.name}</b> · {money(z.delivery_fee)}
              {!z.active && " · hidden"}
              {z.areas && <p className="text-xs text-muted-foreground">{z.areas}</p>}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(z.id);
                  setForm({
                    name: z.name,
                    areas: z.areas ?? "",
                    delivery_fee: String(z.delivery_fee),
                  });
                }}
              >
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggle(z)}>
                {z.active ? "Hide" : "Show"}
              </Button>
            </div>
          </li>
        ))}
        {zones.data?.length === 0 && (
          <li className="py-2 text-muted-foreground">
            No zones yet. Shops can&apos;t register until there is at least one.
          </li>
        )}
      </ul>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Zone name">
            <input
              className={inputCls}
              value={form.name}
              placeholder="e.g. Khayelitsha"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Delivery fee per order (R)">
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.delivery_fee}
              onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Areas covered" hint="Shown to shops, e.g. Site C, Harare, Makhaza">
          <input
            className={inputCls}
            value={form.areas}
            onChange={(e) => setForm({ ...form, areas: e.target.value })}
          />
        </Field>
        <div className="flex gap-2">
          <Button variant="outline" onClick={save}>
            {editing ? "Save zone" : "Add zone"}
          </Button>
          {editing && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}
