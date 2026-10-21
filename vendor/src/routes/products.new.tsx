import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as api from "@/features/vendor/api/vendor";
import { Card, ErrorNote, Loading, Section, TopBar, VendorScreen } from "@/features/vendor/components";
import type { MasterProduct } from "@/features/vendor/model";
import { ProductForm } from "@/features/vendor/product-form";
import { q, useVendorMutation } from "@/features/vendor/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/new")({
  head: () => ({
    meta: [
      { title: "Add product · aasPass Partner" },
      { name: "description", content: "Pick a product from the aasPass catalogue and set your price." },
      { property: "og:title", content: "Add product · aasPass Partner" },
      { property: "og:description", content: "Pick a product from the aasPass catalogue and set your price." },
    ],
  }),
  component: () => <VendorScreen tabs={false}><AddProduct /></VendorScreen>,
});

function AddProduct() {
  const navigate = useNavigate();
  const master = useQuery(q.master);
  const categories = useQuery(q.categories);
  const products = useQuery(q.products);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<MasterProduct | null>(null);
  const [stock, setStock] = useState("");

  const create = useVendorMutation(async (v: Parameters<typeof api.createStoreProduct>[0]) => {
    const row = await api.createStoreProduct(v);
    if (v.trackInventory) await api.createInventory({ storeProductId: row.id, stockQuantity: Number(stock) || 0 });
    return row;
  }, "Product added to your store");

  const listed = new Set((products.data ?? []).map((p) => p.masterProductId));
  const catName = new Map((categories.data ?? []).map((c) => [c.id, c.name]));
  const options = useMemo(() => (master.data ?? [])
    .filter((m) => m.status === "ACTIVE" && !listed.has(m.id))
    .filter((m) => !search || `${m.name} ${m.sku}`.toLowerCase().includes(search.toLowerCase())),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [master.data, products.data, search]);

  if (picked)
    return (
      <>
        <TopBar title="Set your price" subtitle={picked.name} back="/products" />
        <Section>
          <Card className="mb-4 bg-muted">
            <p className="font-bold">{picked.name}</p>
            <p className="text-xs text-muted-foreground">{picked.unitValue} · {picked.sku} · GST {picked.gstRate}%</p>
            <button className="mt-1 text-xs font-bold text-primary" onClick={() => setPicked(null)}>Change product</button>
          </Card>
          <ProductForm
            initial={{ mrp: "", sellingPrice: "", availabilityStatus: "AVAILABLE", trackInventory: true, isFeatured: false }}
            submitLabel="Add to my store" busy={create.isPending}
            extra={<div className="space-y-1.5"><Label htmlFor="stock">Opening stock (units)</Label>
              <Input id="stock" inputMode="numeric" placeholder="0" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} /></div>}
            onSubmit={(v) => create.mutate({ masterProductId: picked.id, ...v }, { onSuccess: () => navigate({ to: "/products" }) })}
          />
        </Section>
      </>
    );

  return (
    <>
      <TopBar title="Add product" subtitle="Choose from the aasPass catalogue" back="/products" />
      <Section>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus className="pl-9" placeholder="Search by name or code" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Section>
      {master.isLoading ? <Loading /> : master.error ? <ErrorNote error={master.error} /> : (
        <Section>
          <div className="space-y-2">
            {options.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nothing left to add{search && " for that search"}.</p>}
            {options.map((m) => (
              <button key={m.id} onClick={() => setPicked(m)} className="w-full text-left">
                <Card className={cn("flex items-center gap-3 hover:border-primary")}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.unitValue} · {catName.get(m.categoryId) ?? "Catalogue"}</p>
                  </div>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </Card>
              </button>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
