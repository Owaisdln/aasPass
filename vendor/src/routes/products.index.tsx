import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Plus, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvailabilityPill, Card, ErrorNote, Loading, Section, TopBar, VendorScreen } from "@/features/vendor/components";
import { q } from "@/features/vendor/queries";
import { formatINR, isLowStock } from "@/features/vendor/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Products · aasPass Partner" },
      { name: "description", content: "Prices, availability and stock for every product in your store." },
      { property: "og:title", content: "Products · aasPass Partner" },
      { property: "og:description", content: "Prices, availability and stock for every product in your store." },
    ],
  }),
  component: () => <VendorScreen><ProductsScreen /></VendorScreen>,
});

function ProductsScreen() {
  const products = useQuery(q.products);
  const master = useQuery(q.master);
  const inventory = useQuery(q.inventory);
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const rows = useMemo(() => {
    const byId = new Map((master.data ?? []).map((m) => [m.id, m]));
    const stock = new Map((inventory.data ?? []).map((i) => [i.storeProductId, i]));
    return (products.data ?? [])
      .map((p) => ({ p, m: byId.get(p.masterProductId), inv: stock.get(p.id) }))
      .filter(({ m, inv }) => (!search || m?.name.toLowerCase().includes(search.toLowerCase()))
        && (!lowOnly || (inv && isLowStock(inv.stockQuantity, inv.lowStockThreshold))))
      .sort((a, b) => a.p.displayOrder - b.p.displayOrder);
  }, [products.data, master.data, inventory.data, search, lowOnly]);
  const lowCount = (inventory.data ?? []).filter((i) => isLowStock(i.stockQuantity, i.lowStockThreshold)).length;

  return (
    <>
      <TopBar title="Products" subtitle={`${products.data?.length ?? 0} in your store`}
        right={<Button asChild size="sm" className="font-bold"><Link to="/products/new"><Plus className="h-4 w-4" /> Add</Link></Button>} />
      <Section>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search your products" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {lowCount > 0 && (
          <button onClick={() => setLowOnly(!lowOnly)} className={cn("mt-2 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
            lowOnly ? "border-offer bg-offer-soft text-offer-foreground" : "bg-card")}>
            <AlertTriangle className="h-3.5 w-3.5" /> Running low ({lowCount})
          </button>
        )}
      </Section>
      {products.isLoading || master.isLoading ? <Loading /> : products.error ? <ErrorNote error={products.error} /> : (
        <Section>
          <div className="space-y-2">
            {rows.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {search || lowOnly ? "No products match." : "No products yet. Tap Add to list your first one."}
              </div>
            )}
            {rows.map(({ p, m, inv }) => {
              const low = inv && isLowStock(inv.stockQuantity, inv.lowStockThreshold);
              const off = Number(p.sellingPrice) < Number(p.mrp);
              return (
                <Link key={p.id} to="/products/$productId" params={{ productId: p.id }}>
                  <Card className="flex items-center gap-3 transition-colors hover:border-primary">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-sm font-bold leading-snug">
                        {p.isFeatured && <Star className="h-3.5 w-3.5 shrink-0 fill-offer text-offer" />}
                        <span className="truncate">{m?.name ?? "Unknown product"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{m ? `${m.unitValue} · ${m.sku}` : p.masterProductId}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <AvailabilityPill status={p.availabilityStatus} />
                        {p.trackInventory && inv && (
                          <span className={cn("text-[11px] font-bold", low ? "text-snack-text" : "text-muted-foreground")}>{inv.stockQuantity} in stock</span>
                        )}
                        {p.trackInventory && !inv && <span className="text-[11px] font-bold text-offer-foreground">Set up stock</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold">{formatINR(p.sellingPrice)}</p>
                      {off && <p className="text-xs text-muted-foreground line-through">{formatINR(p.mrp)}</p>}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}
