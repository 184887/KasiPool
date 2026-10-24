"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loading, PageHeader, StatusBadge } from "@/components/kp/ui";
import { DataTable, Td, Field, inputCls } from "@/components/kp/admin";
import { errMsg } from "@/lib/queries";
import { normaliseSaMobile } from "@/lib/format";

const empty = {
  id: "",
  name: "",
  contact_person: "",
  mobile: "",
  email: "",
  location: "",
  categories: "",
  notes: "",
  active: true,
};

export function Suppliers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => (await supabase.from("suppliers").select("*").order("name")).data ?? [],
  });
  const [edit, setEdit] = useState<typeof empty | null>(null);
  if (isLoading) return <Loading />;

  async function save() {
    if (!edit?.name) return toast.error("Name is required");
    const { id, categories, ...row } = edit;
    const mobile = row.mobile ? (normaliseSaMobile(row.mobile) ?? row.mobile) : null;
    const payload = {
      ...row,
      mobile,
      categories: categories
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const { error } = id
      ? await supabase.from("suppliers").update(payload).eq("id", id)
      : await supabase.from("suppliers").insert(payload);
    if (error) return toast.error(errMsg(error));
    toast.success("Supplier saved");
    setEdit(null);
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Private: never visible to customers"
        actions={<Button onClick={() => setEdit({ ...empty })}>+ New supplier</Button>}
      />
      <DataTable
        head={["Supplier", "Contact", "Location", "Categories", "Status", ""]}
        empty={!data?.length}
      >
        {(data ?? []).map((s) => (
          <tr key={s.id}>
            <Td className="font-medium">{s.name}</Td>
            <Td>
              {s.contact_person}
              <p className="text-xs text-muted-foreground">
                {s.mobile} {s.email}
              </p>
            </Td>
            <Td>{s.location}</Td>
            <Td className="max-w-xs truncate">{(s.categories ?? []).join(", ")}</Td>
            <Td>
              <StatusBadge tone={s.active ? "success" : "muted"}>
                {s.active ? "Active" : "Inactive"}
              </StatusBadge>
            </Td>
            <Td>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setEdit({
                    id: s.id,
                    name: s.name,
                    contact_person: s.contact_person ?? "",
                    mobile: s.mobile ?? "",
                    email: s.email ?? "",
                    location: s.location ?? "",
                    categories: (s.categories ?? []).join(", "),
                    notes: s.notes ?? "",
                    active: s.active,
                  })
                }
              >
                Edit
              </Button>
            </Td>
          </tr>
        ))}
      </DataTable>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit supplier" : "New supplier"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <Field label="Supplier name *">
                <input
                  className={inputCls}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Contact person">
                  <input
                    className={inputCls}
                    value={edit.contact_person}
                    onChange={(e) => setEdit({ ...edit, contact_person: e.target.value })}
                  />
                </Field>
                <Field label="Mobile">
                  <input
                    className={inputCls}
                    value={edit.mobile}
                    onChange={(e) => setEdit({ ...edit, mobile: e.target.value })}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className={inputCls}
                    value={edit.email}
                    onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                  />
                </Field>
                <Field label="Location">
                  <input
                    className={inputCls}
                    value={edit.location}
                    onChange={(e) => setEdit({ ...edit, location: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Product categories" hint="Comma separated">
                <input
                  className={inputCls}
                  value={edit.categories}
                  onChange={(e) => setEdit({ ...edit, categories: e.target.value })}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className={inputCls + " h-20 py-2"}
                  value={edit.notes}
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={edit.active}
                  onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
                />{" "}
                Active
              </label>
              <Button className="w-full" onClick={save}>
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
