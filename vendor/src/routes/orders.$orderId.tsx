import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Banknote, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as api from "@/features/vendor/api/vendor";
import { Card, ErrorNote, Loading, OrderPill, Section, TopBar, VendorScreen, timeAgo } from "@/features/vendor/components";
import type { OrderStatus } from "@/features/vendor/model";
import { q, useVendorMutation } from "@/features/vendor/queries";
import { formatINR, nextOrderStatuses, ORDER_ACTION_LABEL, ORDER_STATUS_LABEL } from "@/features/vendor/rules";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order details · aasPass Partner" },
      { name: "description", content: "Review items, customer details and move the order forward." },
      { property: "og:title", content: "Order details · aasPass Partner" },
      { property: "og:description", content: "Review items, customer details and move the order forward." },
    ],
  }),
  component: () => <VendorScreen tabs={false}><OrderDetail /></VendorScreen>,
});

function OrderDetail() {
  const { orderId } = Route.useParams();
  const order = useQuery(q.order(orderId));
  const move = useVendorMutation(({ status }: { status: OrderStatus }) => api.setOrderStatus(orderId, status));
  const cod = useVendorMutation(() => api.markCodPaid(orderId), "Cash payment recorded");

  if (order.isLoading) return <><TopBar title="Order" back="/orders" /><Loading /></>;
  if (order.error) return <><TopBar title="Order" back="/orders" /><ErrorNote error={order.error} /></>;
  const o = order.data;
  if (!o) return <><TopBar title="Order" back="/orders" /><p className="p-8 text-center text-sm text-muted-foreground">Order not found.</p></>;

  const next = nextOrderStatuses(o.status, o.fulfillmentType);
  const primary = next.find((s) => s !== "CANCELLED" && s !== "FAILED");
  const secondary = next.find((s) => s === "CANCELLED" || s === "FAILED");

  return (
    <>
      <TopBar title={`#${o.orderNumber}`} subtitle={`Placed ${timeAgo(o.placedAt)}`} back="/orders" right={<OrderPill status={o.status} />} />
      <div className="pb-28">
        <Section title={`Items (${o.items.length})`}>
          <Card className="divide-y p-0">
            {o.items.map((i) => (
              <div key={i.id} className="flex items-start gap-3 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-accent text-sm font-extrabold text-accent-foreground">{i.quantity}×</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-snug">{i.productNameSnapshot}</p>
                  <p className="text-xs text-muted-foreground">{i.unitSnapshot} · {formatINR(i.sellingPriceSnapshot)} each</p>
                </div>
                <p className="text-sm font-bold">{formatINR(i.subtotal)}</p>
              </div>
            ))}
          </Card>
        </Section>
        <Section title="Bill">
          <Card className="space-y-1.5 text-sm">
            <Row label="Items total" value={formatINR(o.subtotal)} />
            {o.discountAmount > 0 && <Row label="Discount" value={`− ${formatINR(o.discountAmount)}`} />}
            {o.taxAmount > 0 && <Row label="Tax" value={formatINR(o.taxAmount)} />}
            <Row label="Delivery fee" value={o.deliveryFee ? formatINR(o.deliveryFee) : "Free"} />
            <div className="flex justify-between border-t pt-2 font-extrabold"><span>Total</span><span>{formatINR(o.totalAmount)}</span></div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="font-bold">{o.paymentMethod === "COD" ? "Cash on delivery" : `Paid by ${o.paymentMethod}`}</span>
              <span className={o.paymentStatus === "PAID" ? "font-extrabold text-primary" : "font-extrabold text-offer-foreground"}>
                {o.paymentStatus === "PAID" ? "Paid" : "To collect"}</span>
            </div>
            {o.paymentMethod === "COD" && o.paymentStatus !== "PAID" && ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP", "DELIVERED"].includes(o.status) && (
              <Button variant="outline" size="sm" className="mt-2 w-full" disabled={cod.isPending} onClick={() => cod.mutate(undefined)}>
                <Banknote className="h-4 w-4" /> Cash received
              </Button>
            )}
          </Card>
        </Section>
        <Section title={o.fulfillmentType === "PICKUP" ? "Customer pickup" : "Deliver to"}>
          <Card className="space-y-2 text-sm">
            <p className="font-bold">{o.deliveryReceiverName}</p>
            <a href={`tel:${o.deliveryPhone}`} className="flex items-center gap-2 text-primary"><Phone className="h-4 w-4" /> {o.deliveryPhone}</a>
            {o.fulfillmentType === "DELIVERY" && (
              <p className="flex gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {[o.deliveryHouseNo, o.deliveryStreet, o.deliveryArea, o.deliveryLandmark, o.deliveryCity, o.deliveryPincode].filter(Boolean).join(", ")}</p>
            )}
            {o.deliveryInstructions && <p className="rounded bg-offer-soft p-2 text-xs text-offer-foreground">“{o.deliveryInstructions}”</p>}
          </Card>
        </Section>
      </div>
      {next.length > 0 && (
        <div className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 gap-2 border-t bg-card p-3">
          {secondary && (
            <Button variant="outline" size="lg" className="font-bold text-destructive" disabled={move.isPending}
              onClick={() => move.mutate({ status: secondary }, { onSuccess: () => toastStatus(secondary) })}>{ORDER_ACTION_LABEL[secondary]}</Button>
          )}
          {primary && (
            <Button size="lg" className="flex-1 font-bold" disabled={move.isPending}
              onClick={() => move.mutate({ status: primary }, { onSuccess: () => toastStatus(primary) })}>{ORDER_ACTION_LABEL[primary]}</Button>
          )}
        </div>
      )}
    </>
  );
}

const toastStatus = (s: OrderStatus) => toast.success(`Order is now: ${ORDER_STATUS_LABEL[s]}`);

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground">{value}</span></div>;
}
