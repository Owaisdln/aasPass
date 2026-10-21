import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Card, ErrorNote, Loading, Note, OrderPill, Section, TopBar, VendorScreen, timeAgo } from "@/features/vendor/components";
import type { Order, OrderStatus } from "@/features/vendor/model";
import { q } from "@/features/vendor/queries";
import { formatINR } from "@/features/vendor/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Orders · aasPass Partner" },
      { name: "description", content: "Accept, pack and complete incoming store orders." },
      { property: "og:title", content: "Orders · aasPass Partner" },
      { property: "og:description", content: "Accept, pack and complete incoming store orders." },
    ],
  }),
  component: () => <VendorScreen><OrdersScreen /></VendorScreen>,
});

const TABS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "new", label: "New", statuses: ["PENDING"] },
  { key: "active", label: "In progress", statuses: ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
  { key: "done", label: "Past", statuses: ["DELIVERED", "CANCELLED", "FAILED"] },
];

function OrdersScreen() {
  const orders = useQuery(q.orders);
  const store = useQuery(q.store);
  const [tab, setTab] = useState("new");
  const list = orders.data ?? [];
  const current = TABS.find((t) => t.key === tab)!;
  const shown = list.filter((o) => current.statuses.includes(o.status));
  const today = list.filter((o) => o.status === "DELIVERED");

  return (
    <>
      <TopBar title="Orders" subtitle={store.data?.name ?? undefined}
        right={store.data && <span className={cn("rounded-full px-2.5 py-1 text-xs font-extrabold",
          store.data.isOpen ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>{store.data.isOpen ? "Open" : "Closed"}</span>} />
      <Section>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="New" value={String(list.filter((o) => o.status === "PENDING").length)} tone="offer" />
          <Stat label="In progress" value={String(list.filter((o) => TABS[1]!.statuses.includes(o.status)).length)} />
          <Stat label="Completed" value={formatINR(today.reduce((s, o) => s + o.totalAmount, 0)).replace(".00", "")} />
        </div>
      </Section>
      <div className="sticky top-[57px] z-[5] flex gap-1 border-b bg-background px-4">
        {TABS.map((t) => {
          const count = list.filter((o) => t.statuses.includes(o.status)).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("-mb-px border-b-2 px-3 py-2.5 text-sm font-bold",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
              {t.label} <span className="ml-0.5 text-xs">{count}</span>
            </button>
          );
        })}
      </div>
      {orders.isLoading ? <Loading /> : orders.error ? <ErrorNote error={orders.error} /> : (
        <Section>
          <div className="space-y-2">
            {shown.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No orders here right now.</p>}
            {shown.map((o) => <OrderRow key={o.id} order={o} />)}
          </div>
        </Section>
      )}
      <Section>
        <Note>Sample orders. Your server doesn't send orders to stores yet, so this list shows example orders until that's added.</Note>
      </Section>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "offer" }) {
  return (
    <div className={cn("rounded-lg border p-2.5", tone === "offer" ? "border-offer bg-offer-soft" : "bg-card")}>
      <p className="text-lg font-extrabold leading-tight">{value}</p>
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const items = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Link to="/orders/$orderId" params={{ orderId: order.id }}>
      <Card className={cn("flex items-center gap-3 transition-colors hover:border-primary", order.status === "PENDING" && "border-offer")}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-extrabold">#{order.orderNumber}</p>
            <OrderPill status={order.status} />
          </div>
          <p className="mt-0.5 truncate text-sm">{order.deliveryReceiverName} · {items} item{items > 1 ? "s" : ""}</p>
          <p className="text-xs text-muted-foreground">
            {timeAgo(order.placedAt)} · {order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"} · {order.paymentMethod === "COD" ? "Cash" : "Paid online"}
          </p>
        </div>
        <p className="font-extrabold">{formatINR(order.totalAmount)}</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Card>
    </Link>
  );
}
