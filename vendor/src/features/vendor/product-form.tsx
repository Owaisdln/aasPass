import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AVAILABILITY_LABEL } from "./components";
import type { AvailabilityStatus } from "./model";
import { discountPercent, validatePrice } from "./rules";

export type ProductFormValues = {
  mrp: string; sellingPrice: string; availabilityStatus: AvailabilityStatus; trackInventory: boolean; isFeatured: boolean;
};
const STATUSES: AvailabilityStatus[] = ["AVAILABLE", "OUT_OF_STOCK", "HIDDEN", "DISCONTINUED"];

export function ProductForm({ initial, submitLabel, busy, onSubmit, extra }: {
  initial: ProductFormValues; submitLabel: string; busy?: boolean;
  onSubmit: (v: { mrp: number; sellingPrice: number; availabilityStatus: AvailabilityStatus; trackInventory: boolean; isFeatured: boolean }) => void;
  extra?: React.ReactNode;
}) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const mrp = Number(v.mrp), sp = Number(v.sellingPrice);
  const off = discountPercent(mrp, sp);

  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const err = validatePrice(mrp, sp);
      setError(err);
      if (!err) onSubmit({ mrp, sellingPrice: sp, availabilityStatus: v.availabilityStatus, trackInventory: v.trackInventory, isFeatured: v.isFeatured });
    }}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="mrp">MRP (₹)</Label>
          <Input id="mrp" inputMode="decimal" value={v.mrp} onChange={(e) => setV({ ...v, mrp: e.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="sp">Your price (₹)</Label>
          <Input id="sp" inputMode="decimal" value={v.sellingPrice} onChange={(e) => setV({ ...v, sellingPrice: e.target.value })} /></div>
      </div>
      {off > 0 && <p className="-mt-2 text-xs font-bold text-offer-foreground">Customers see {off}% off</p>}
      {error && <p className="-mt-2 text-xs font-bold text-destructive">{error}</p>}

      <div className="space-y-1.5">
        <Label>Availability</Label>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button type="button" key={s} onClick={() => setV({ ...v, availabilityStatus: s })}
              className={`rounded-md border px-3 py-2 text-sm font-bold ${v.availabilityStatus === s ? "border-primary bg-accent text-accent-foreground" : "bg-card"}`}>
              {AVAILABILITY_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center justify-between rounded-lg border bg-card p-3">
        <span><span className="block text-sm font-bold">Track stock</span><span className="text-xs text-muted-foreground">Count units in and out</span></span>
        <Switch checked={v.trackInventory} onCheckedChange={(c) => setV({ ...v, trackInventory: c })} />
      </label>
      <label className="flex items-center justify-between rounded-lg border bg-card p-3">
        <span><span className="block text-sm font-bold">Featured</span><span className="text-xs text-muted-foreground">Show near the top of your store</span></span>
        <Switch checked={v.isFeatured} onCheckedChange={(c) => setV({ ...v, isFeatured: c })} />
      </label>
      {extra}
      <Button type="submit" size="lg" className="w-full font-bold" disabled={busy}>{submitLabel}</Button>
    </form>
  );
}
