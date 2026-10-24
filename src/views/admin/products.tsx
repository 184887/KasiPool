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

const empty = {
  id: "",
  sku: "",
  name: "",
  category_id: "",
  brand: "",
  description: "",
  unit: "carton",
  pack_size: "",
  image_url: "",
  active: true,
};

export function Products() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const [p, c, pools] = await Promise.all([
        supabase.from("products").select("*, categories(name)").order("name"),
        supabase.from("categories").select("*").order("sort"),
        supabase.from("pools").select("product_id, status"),
      ]);
      return { products: p.data ?? [], cats: c.data ?? [], pools: pools.data ?? [] };
    },
  });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [edit, setEdit] = useState<typeof empty | null>(null);
  const [busy, setBusy] = useState(false);
  if (isLoading || !data) return <Loading />;
  const list = data.products.filter(
    (p) =>
      (!cat || p.category_id === cat) &&
      (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())),
  );

  async function upload(file: File) {
    if (file.size > 3 * 1024 * 1024) return toast.error("Image must be under 3MB");
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return toast.error(errMsg(error));
    const { data: s, error: se } = await supabase.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (se) return toast.error(errMsg(se));
    setEdit((e) => e && { ...e, image_url: s.signedUrl });
  }

  async function save() {
    if (!edit) return;
    if (!edit.sku || !edit.name || !edit.unit)
      return toast.error("SKU, name and unit are required");
    setBusy(true);
    const { id, ...row } = edit;
    const payload = { ...row, category_id: row.category_id || null };
    const { error } = id
      ? await supabase.from("products").update(payload).eq("id", id)
      : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Product saved");
    setEdit(null);
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader
        title="Products"
        actions={<Button onClick={() => setEdit({ ...empty })}>+ New product</Button>}
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className={inputCls + " max-w-xs"}
          placeholder="Search name or SKU"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={inputCls + " max-w-xs"}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">All categories</option>
          {data.cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        head={["", "Product", "SKU", "Category", "Unit / pack", "Pools", "Status", ""]}
        empty={!list.length}
      >
        {list.map((p) => (
          <tr key={p.id}>
            <Td>
              <img
                src={p.image_url ?? ""}
                alt=""
                className="size-10 rounded-md bg-muted object-cover"
              />
            </Td>
            <Td className="font-medium">{p.name}</Td>
            <Td>{p.sku}</Td>
            <Td>{p.categories?.name ?? "-"}</Td>
            <Td>
              {p.unit} · {p.pack_size}
            </Td>
            <Td>{data.pools.filter((x) => x.product_id === p.id).length}</Td>
            <Td>
              <StatusBadge tone={p.active ? "success" : "muted"}>
                {p.active ? "Active" : "Inactive"}
              </StatusBadge>
            </Td>
            <Td>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setEdit({
                    id: p.id,
                    sku: p.sku,
                    name: p.name,
                    category_id: p.category_id ?? "",
                    brand: p.brand ?? "",
                    description: p.description ?? "",
                    unit: p.unit,
                    pack_size: p.pack_size ?? "",
                    image_url: p.image_url ?? "",
                    active: p.active,
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{edit?.id ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="SKU *">
                  <input
                    className={inputCls}
                    value={edit.sku}
                    onChange={(e) => setEdit({ ...edit, sku: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <select
                    className={inputCls}
                    value={edit.category_id}
                    onChange={(e) => setEdit({ ...edit, category_id: e.target.value })}
                  >
                    <option value="">-</option>
                    {data.cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Name *">
                <input
                  className={inputCls}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </Field>
              <Field label="Brand">
                <input
                  className={inputCls}
                  value={edit.brand}
                  onChange={(e) => setEdit({ ...edit, brand: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Purchasing unit *">
                  <input
                    className={inputCls}
                    value={edit.unit}
                    onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                  />
                </Field>
                <Field label="Pack size">
                  <input
                    className={inputCls}
                    value={edit.pack_size}
                    onChange={(e) => setEdit({ ...edit, pack_size: e.target.value })}
                    placeholder="2L × 6"
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  className={inputCls + " h-20 py-2"}
                  value={edit.description}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                />
              </Field>
              <Field label="Image">
                <div className="flex items-center gap-3">
                  {edit.image_url && (
                    <img src={edit.image_url} alt="" className="size-14 rounded-md object-cover" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                    className="text-sm"
                  />
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={edit.active}
                  onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
                />{" "}
                Active
              </label>
              <Button className="w-full" onClick={save} disabled={busy}>
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
