import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ClipboardList, Info, Loader2, Package, Store } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import mark from "@/assets/aaspass-mark.png";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus, OrderStatus } from "./model";
import { ORDER_STATUS_LABEL } from "./rules";
import { useSession } from "./session";

export function Brand({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div className="flex items-center gap-2">
      <img src={mark} alt="aasPass" className={size === "lg" ? "h-14 w-14" : "h-8 w-8"} />
      <div className="leading-none">
        <p className={cn("font-extrabold", size === "lg" ? "text-3xl" : "text-lg")}>
          <span className="text-primary">aas</span><span className="text-offer">Pass</span>
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Partner</p>
      </div>
    </div>
  );
}

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-sm">{children}</div>
    </div>
  );
}

const NAV = [
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/products", label: "Products", icon: Package },
  { to: "/store", label: "Store", icon: Store },
] as const;

/** Signed-in vendor screen: guards the session and shows the bottom tabs. */
export function VendorScreen({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  const { session, hydrated, signIn } = useSession();
  const path = useRouterState({ select: (s) => s.location.pathname });
  // Opening a page while signed out starts the sample store instead of bouncing to login.
  useEffect(() => {
    if (hydrated && !session) signIn({ mode: "demo", email: "owner@sharmafresh.in", name: "Rakesh Sharma" });
  }, [hydrated, session, signIn]);

  if (!hydrated || !session)
    return (
      <PhoneFrame>
        <div className="grid flex-1 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </PhoneFrame>
    );

  return (
    <PhoneFrame>
      <div className={cn("flex-1", tabs && "pb-20")}>{children}</div>
      {tabs && (
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t bg-card">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = path.startsWith(to);
            return (
              <Link key={to} to={to} className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors",
                active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </PhoneFrame>
  );
}

export function TopBar({ title, back, right, subtitle }: { title: string; back?: string | undefined; right?: ReactNode; subtitle?: string | undefined }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
      {back && (
        <Link to={back} className="-ml-2 rounded-md p-1.5 hover:bg-muted" aria-label="Back"><ChevronLeft className="h-5 w-5" /></Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-extrabold">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="px-4 py-3">
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between">
          {title && <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border bg-card p-3", className)}>{children}</div>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg bg-trust-soft p-3 text-xs text-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>{children}</div>
    </div>
  );
}

const ORDER_TONE: Record<OrderStatus, string> = {
  PENDING: "bg-offer-soft text-offer-foreground", CONFIRMED: "bg-health-soft text-health-text",
  PREPARING: "bg-daily-soft text-daily-text", READY_FOR_PICKUP: "bg-accent text-accent-foreground",
  OUT_FOR_DELIVERY: "bg-accent text-accent-foreground", DELIVERED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-snack-soft text-snack-text", FAILED: "bg-snack-soft text-snack-text",
};
export function OrderPill({ status }: { status: OrderStatus }) {
  return <span className={cn("rounded px-2 py-0.5 text-[11px] font-extrabold", ORDER_TONE[status])}>{ORDER_STATUS_LABEL[status]}</span>;
}

const AVAIL: Record<AvailabilityStatus, [string, string]> = {
  AVAILABLE: ["In stock", "bg-accent text-accent-foreground"], OUT_OF_STOCK: ["Sold out", "bg-snack-soft text-snack-text"],
  HIDDEN: ["Hidden", "bg-muted text-muted-foreground"], DISCONTINUED: ["Discontinued", "bg-muted text-muted-foreground"],
};
export const AVAILABILITY_LABEL = Object.fromEntries(Object.entries(AVAIL).map(([k, v]) => [k, v[0]])) as Record<AvailabilityStatus, string>;
export function AvailabilityPill({ status }: { status: AvailabilityStatus }) {
  return <span className={cn("rounded px-2 py-0.5 text-[11px] font-extrabold", AVAIL[status][1])}>{AVAIL[status][0]}</span>;
}

export function Loading() {
  return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <div className="m-4 rounded-lg bg-snack-soft p-3 text-sm text-snack-text">
      {(error as Error)?.message ?? "Something went wrong"}. Check the <Link to="/connect" className="font-bold underline">connection</Link>.
    </div>
  );
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} hr ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
