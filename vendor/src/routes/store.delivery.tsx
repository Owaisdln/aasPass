import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import * as api from "@/features/vendor/api/vendor";
import { Card, ErrorNote, Loading, Section, TopBar, VendorScreen } from "@/features/vendor/components";
import type { UpdateDeliverySettingsInput } from "@/features/vendor/model";
import { q, useVendorMutation } from "@/features/vendor/queries";

export const Route = createFileRoute("/store/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery & pickup · aasPass Partner" },
      { name: "description", content: "Delivery area, charges, minimum order and pickup options." },
      { property: "og:title", content: "Delivery & pickup · aasPass Partner" },
      { property: "og:description", content: "Delivery area, charges, minimum order and pickup options." },
    ],
  }),
  component: () => <VendorScreen tabs={false}><DeliveryScreen /></VendorScreen>,
});

type F = { isDeliveryAvailable: boolean; isPickupAvailable: boolean; minimumOrderAmount: string; deliveryRadiusKm: string;
  deliveryCharge: string; freeDeliveryAbove: string; estimatedDeliveryTime: string };

function DeliveryScreen() {
  const settings = useQuery(q.delivery);
  const [f, setF] = useState<F | null>(null);
  const save = useVendorMutation((v: UpdateDeliverySettingsInput) => api.updateDelivery(v), "Delivery settings saved");

  useEffect(() => {
    const d = settings.data;
    if (d) setF({ isDeliveryAvailable: d.isDeliveryAvailable, isPickupAvailable: d.isPickupAvailable,
      minimumOrderAmount: String(d.minimumOrderAmount), deliveryRadiusKm: String(d.deliveryRadiusKm), deliveryCharge: String(d.deliveryCharge),
      freeDeliveryAbove: d.freeDeliveryAbove != null ? String(d.freeDeliveryAbove) : "", estimatedDeliveryTime: String(d.estimatedDeliveryTime) });
  }, [settings.data]);

  const num = (k: keyof F, lbl: string, suffix: string) => f && (
    <div className="space-y-1.5"><Label htmlFor={k}>{lbl}</Label>
      <div className="relative"><Input id={k} inputMode="decimal" value={f[k] as string} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(/[^\d.]/g, "") })} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span></div></div>
  );
  const noneOn = f && !f.isDeliveryAvailable && !f.isPickupAvailable;

  return (
    <>
      <TopBar title="Delivery & pickup" back="/store" />
      {settings.isLoading || !f ? (settings.error ? <ErrorNote error={settings.error} /> : <Loading />) : (
        <Section>
          <div className="space-y-3">
            <Card className="divide-y p-0">
              <label className="flex items-center justify-between p-3"><span className="text-sm font-bold">Home delivery</span>
                <Switch checked={f.isDeliveryAvailable} onCheckedChange={(c) => setF({ ...f, isDeliveryAvailable: c })} /></label>
              <label className="flex items-center justify-between p-3"><span className="text-sm font-bold">Store pickup</span>
                <Switch checked={f.isPickupAvailable} onCheckedChange={(c) => setF({ ...f, isPickupAvailable: c })} /></label>
            </Card>
            {noneOn && <p className="text-xs font-bold text-destructive">Turn on delivery or pickup so customers can order.</p>}
            <div className="grid grid-cols-2 gap-3">
              {num("minimumOrderAmount", "Minimum order", "₹")}
              {f.isDeliveryAvailable && <>
                {num("deliveryRadiusKm", "Delivery area", "km")}
                {num("deliveryCharge", "Delivery charge", "₹")}
                {num("freeDeliveryAbove", "Free delivery above", "₹")}
                {num("estimatedDeliveryTime", "Usual delivery time", "min")}
              </>}
            </div>
            <Button size="lg" className="w-full font-bold" disabled={!!noneOn || save.isPending} onClick={() => save.mutate({
              isDeliveryAvailable: f.isDeliveryAvailable, isPickupAvailable: f.isPickupAvailable,
              minimumOrderAmount: Number(f.minimumOrderAmount) || 0, deliveryRadiusKm: Number(f.deliveryRadiusKm) || 0,
              deliveryCharge: Number(f.deliveryCharge) || 0, estimatedDeliveryTime: Number(f.estimatedDeliveryTime) || 0,
              ...(f.freeDeliveryAbove ? { freeDeliveryAbove: Number(f.freeDeliveryAbove) } : {}),
            })}>Save</Button>
          </div>
        </Section>
      )}
    </>
  );
}
