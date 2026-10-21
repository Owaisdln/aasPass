import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as api from "@/features/vendor/api/vendor";
import { Card, ErrorNote, Loading, Section, TopBar, VendorScreen, timeAgo } from "@/features/vendor/components";
import type { Inventory, InventoryTransactionType } from "@/features/vendor/model";
import { ProductForm } from "@/features/vendor/product-form";
import { q, useVendorMutation } from "@/features/vendor/queries";
import { applyStockChange, isLowStock, STOCK_IN, STOCK_OUT } from "@/features/vendor/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "Edit product · aasPass Partner" },
      { name: "description", content: "Change price, availability and stock for this product." },
      { property: "og:title", content: "Edit product · aasPass Partner" },
      { property: "og:description", content: "Change price, availability and stock for this product." },
    ],
  }),
  component: () => <VendorScreen tabs={false}><EditProduct /></VendorScreen>,
});

const TX_LABEL: Record<InventoryTransactionType, string> = {
  PURCHASE: "Purchased", RESTOCK: "Restocked", RETURN: "Returned", SALE: "Sold", DAMAGE: "Damaged", EXPIRED: "Expired", ADJUSTMENT: "Adjusted",
};

function EditProduct() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const products = useQuery(q.products);
  const master = useQuery(q.master);
  const inventory = useQuery(q.inventory);
  const save = useVendorMutation((v: Parameters<typeof api.updateStoreProduct>[1]) => api.updateStoreProduct(productId, v), "Saved");
  const remove = useVendorMutation(() => api.deleteStoreProduct(productId), "Product removed");
  const setupStock = useVendorMutation(() => api.createInventory({ storeProductId: productId, stockQuantity: 0 }), "Stock tracking set up");

  if (products.isLoading || master.isLoading) return <><TopBar title="Product" back="/products" /><Loading /></>;
  if (products.error) return <><TopBar title="Product" back="/products" /><ErrorNote error={products.error} /></>;
  const p = products.data?.find((x) => x.id === productId);
  if (!p) return <><TopBar title="Product" back="/products" /><p className="p-8 text-center text-sm text-muted-foreground">Product not found.</p></>;
  const m = master.data?.find((x) => x.id === p.masterProductId);
  const inv = inventory.data?.find((i) => i.storeProductId === p.id);

  return (
    <>
      <TopBar title={m?.name ?? "Product"} subtitle={m ? `${m.unitValue} · ${m.sku}` : undefined} back="/products" />
      {p.trackInventory && (
        <Section title="Stock">
          {inv ? <StockCard inv={inv} /> : (
            <Card className="flex items-center justify-between">
              <p className="text-sm">Stock isn't set up for this product.</p>
              <Button size="sm" onClick={() => setupStock.mutate(undefined)} disabled={setupStock.isPending}>Set up</Button>
            </Card>
          )}
        </Section>
      )}
      <Section title="Price & visibility">
        <ProductForm key={p.updatedAt}
          initial={{ mrp: String(Number(p.mrp)), sellingPrice: String(Number(p.sellingPrice)), availabilityStatus: p.availabilityStatus,
            trackInventory: p.trackInventory, isFeatured: p.isFeatured }}
          submitLabel="Save changes" busy={save.isPending} onSubmit={(v) => save.mutate(v)} />
      </Section>
      <Section>
        <Button variant="ghost" className="w-full text-destructive" disabled={remove.isPending}
          onClick={() => { if (confirm("Remove this product from your store?")) remove.mutate(undefined, { onSuccess: () => navigate({ to: "/products" }) }); }}>
          <Trash2 className="h-4 w-4" /> Remove from store
        </Button>
      </Section>
    </>
  );
}

function StockCard({ inv }: { inv: Inventory }) {
  const [dir, setDir] = useState<"in" | "out">("in");
  const [type, setType] = useState<InventoryTransactionType>("RESTOCK");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [threshold, setThreshold] = useState(String(inv.lowStockThreshold));
  const tx = useQuery(q.transactions(inv.id));
  const adjust = useVendorMutation(() => api.adjustInventory(inv.id, {
    transactionType: type, quantity: Number(qty), referenceType: "MANUAL", notes: notes || undefined, expectedVersion: inv.version,
  }), "Stock updated");
  const saveThreshold = useVendorMutation(() => api.updateInventory(inv.id, { lowStockThreshold: Number(threshold) }), "Alert level saved");
  const preview = qty ? applyStockChange(inv.stockQuantity, inv.reservedQuantity, type, Number(qty)) : null;
  const low = isLowStock(inv.stockQuantity, inv.lowStockThreshold);

  return (
    <div className="space-y-3">
      <Card className="grid grid-cols-3 text-center">
        <div><p className={cn("text-2xl font-extrabold", low && "text-snack-text")}>{inv.stockQuantity}</p><p className="text-[11px] font-bold text-muted-foreground">In stock</p></div>
        <div><p className="text-2xl font-extrabold">{inv.reservedQuantity}</p><p className="text-[11px] font-bold text-muted-foreground">Held for orders</p></div>
        <div><p className="text-2xl font-extrabold">{inv.lowStockThreshold}</p><p className="text-[11px] font-bold text-muted-foreground">Alert at</p></div>
      </Card>

      <Card className="space-y-3">
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          {(["in", "out"] as const).map((d) => (
            <button key={d} onClick={() => { setDir(d); setType(d === "in" ? "RESTOCK" : "SALE"); }}
              className={cn("flex items-center justify-center gap-1 rounded py-1.5 text-sm font-bold", dir === d ? "bg-card shadow-sm" : "text-muted-foreground")}>
              {d === "in" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />} {d === "in" ? "Add stock" : "Remove stock"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(dir === "in" ? STOCK_IN : STOCK_OUT).map((t) => (
            <button key={t} onClick={() => setType(t)} className={cn("rounded-full border px-3 py-1 text-xs font-bold",
              type === t ? "border-primary bg-accent text-accent-foreground" : "bg-card")}>{TX_LABEL[t]}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input inputMode="numeric" placeholder="Units" className="w-24" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} />
          <Input placeholder="Note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {preview && ("error" in preview
          ? <p className="text-xs font-bold text-destructive">{preview.error}</p>
          : <p className="text-xs text-muted-foreground">New stock will be <span className="font-extrabold text-foreground">{preview.stock}</span></p>)}
        <Button className="w-full font-bold" disabled={!preview || "error" in preview || adjust.isPending}
          onClick={() => adjust.mutate(undefined, { onSuccess: () => { setQty(""); setNotes(""); } })}>Update stock</Button>
      </Card>

      <Card className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5"><Label htmlFor="th">Warn me when stock is at or below</Label>
          <Input id="th" inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value.replace(/\D/g, ""))} /></div>
        <Button variant="outline" disabled={saveThreshold.isPending || threshold === String(inv.lowStockThreshold)} onClick={() => saveThreshold.mutate(undefined)}>Save</Button>
      </Card>

      {tx.data && tx.data.length > 0 && (
        <Card className="divide-y p-0">
          <p className="px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">History</p>
          {tx.data.slice(0, 8).map((t) => {
            const plus = STOCK_IN.includes(t.transactionType);
            return (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div><p className="font-bold">{TX_LABEL[t.transactionType]}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(t.createdAt)}{t.notes ? ` · ${t.notes}` : ""}</p></div>
                <div className="text-right"><p className={cn("font-extrabold", plus ? "text-primary" : "text-snack-text")}>{plus ? "+" : "−"}{t.quantity}</p>
                  <p className="text-[11px] text-muted-foreground">left {t.balanceAfterTransaction}</p></div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
