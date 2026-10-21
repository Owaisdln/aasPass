import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight, Clock, LogOut, Settings2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { signOutRemote } from "@/features/vendor/api/auth";
import * as api from "@/features/vendor/api/vendor";
import { Card, ErrorNote, Loading, Note, Section, TopBar, VendorScreen } from "@/features/vendor/components";
import type { Store, UpdateStoreInput } from "@/features/vendor/model";
import { q, useVendorMutation } from "@/features/vendor/queries";
import { formatINR } from "@/features/vendor/rules";
import { useSession } from "@/features/vendor/session";

export const Route = createFileRoute("/store/")({
  head: () => ({
    meta: [
      { title: "My store · aasPass Partner" },
      { name: "description", content: "Store profile, opening hours and delivery settings." },
      { property: "og:title", content: "My store · aasPass Partner" },
      { property: "og:description", content: "Store profile, opening hours and delivery settings." },
    ],
  }),
  component: () => <VendorScreen><StoreScreen /></VendorScreen>,
});

const FIELDS: { key: keyof UpdateStoreInput; label: string; required?: boolean; half?: boolean }[] = [
  { key: "name", label: "Store name", required: true },
  { key: "phone", label: "Phone", required: true, half: true },
  { key: "email", label: "Email", half: true },
  { key: "addressLine1", label: "Address line 1", required: true },
  { key: "addressLine2", label: "Address line 2" },
  { key: "city", label: "City", required: true, half: true },
  { key: "pincode", label: "Pincode", required: true, half: true },
  { key: "state", label: "State", required: true, half: true },
  { key: "country", label: "Country", required: true, half: true },
  { key: "gstNumber", label: "GST number", half: true },
  { key: "businessRegistrationNumber", label: "Registration no.", half: true },
];

function StoreScreen() {
  const store = useQuery(q.store);
  const delivery = useQuery(q.delivery);
  const hours = useQuery(q.hours);
  const { session, signOut } = useSession();
  const navigate = useNavigate();

  const logout = async () => { await signOutRemote(); signOut(); navigate({ to: "/" }); };

  if (store.isLoading) return <><TopBar title="My store" /><Loading /></>;
  if (store.error) return <><TopBar title="My store" /><ErrorNote error={store.error} /></>;

  return (
    <>
      <TopBar title="My store" subtitle={session?.email} />
      {store.data ? <StoreProfile store={store.data} /> : <CreateStore />}
      {store.data && (
        <Section title="Running your store">
          <Card className="divide-y p-0">
            <NavRow to="/store/hours" icon={<Clock className="h-4 w-4" />} title="Opening hours"
              hint={hours.data ? `${hours.data.filter((h) => !h.isClosed).length} days open` : ""} />
            <NavRow to="/store/delivery" icon={<Truck className="h-4 w-4" />} title="Delivery & pickup"
              hint={delivery.data ? `${delivery.data.isDeliveryAvailable ? `${delivery.data.deliveryRadiusKm} km` : "No delivery"} · min ${formatINR(delivery.data.minimumOrderAmount)}` : ""} />
            <NavRow to="/connect" icon={<Settings2 className="h-4 w-4" />} title="Connection" hint={session?.mode === "demo" ? "Sample store" : "Live server"} />
          </Card>
        </Section>
      )}
      <Section>
        <Button variant="outline" className="w-full font-bold" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</Button>
      </Section>
    </>
  );
}

function NavRow({ to, icon, title, hint }: { to: "/store/hours" | "/store/delivery" | "/connect"; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-3 hover:bg-muted">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground">{icon}</span>
      <span className="flex-1"><span className="block text-sm font-bold">{title}</span><span className="text-xs text-muted-foreground">{hint}</span></span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function StoreProfile({ store }: { store: Store }) {
  const [editing, setEditing] = useState(false);
  const statusText: Record<Store["status"], string> = {
    PENDING: "Waiting for approval", ACTIVE: "Live on aasPass", TEMPORARILY_CLOSED: "Temporarily closed", SUSPENDED: "Suspended", CLOSED: "Closed",
  };
  return (
    <Section>
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1 text-lg font-extrabold">{store.name}
              {store.verificationStatus === "VERIFIED" && <BadgeCheck className="h-4 w-4 text-primary" />}</p>
            <p className="text-xs font-bold text-muted-foreground">{statusText[store.status]} · {store.isOpen ? "Open now" : "Closed now"}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>{editing ? "Close" : "Edit"}</Button>
        </div>
        {!editing ? (
          <div className="mt-3 space-y-1 text-sm">
            {store.description && <p className="text-muted-foreground">{store.description}</p>}
            <p>{[store.addressLine1, store.addressLine2, store.city, store.pincode].filter(Boolean).join(", ")}</p>
            <p className="text-muted-foreground">{store.phone}{store.email ? ` · ${store.email}` : ""}</p>
            {store.gstNumber && <p className="text-xs text-muted-foreground">GST {store.gstNumber}</p>}
          </div>
        ) : <StoreForm store={store} onDone={() => setEditing(false)} />}
      </Card>
      {store.verificationStatus === "PENDING" && <div className="mt-3"><Note>Your store is waiting for aasPass to verify it.</Note></div>}
    </Section>
  );
}

type FormState = Record<string, string>;
const toForm = (s?: Partial<Store>): FormState => ({
  ...Object.fromEntries(FIELDS.map((f) => [f.key, String(s?.[f.key as keyof Store] ?? "")])),
  description: s?.description ?? "", latitude: s?.latitude != null ? String(s.latitude) : "", longitude: s?.longitude != null ? String(s.longitude) : "",
});
const fromForm = (f: FormState) => {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(f)) if (v.trim() !== "") out[k] = k === "latitude" || k === "longitude" ? Number(v) : v.trim();
  return out;
};

function StoreFields({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELDS.map((f) => (
        <div key={f.key} className={f.half ? "space-y-1.5" : "col-span-2 space-y-1.5"}>
          <Label htmlFor={f.key}>{f.label}{f.required && " *"}</Label>
          <Input id={f.key} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
        </div>
      ))}
      <div className="col-span-2 space-y-1.5"><Label htmlFor="desc">About your store</Label>
        <Textarea id="desc" rows={2} value={form["description"]} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="lat">Latitude *</Label><Input id="lat" inputMode="decimal" value={form["latitude"]} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="lng">Longitude *</Label><Input id="lng" inputMode="decimal" value={form["longitude"]} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
      <button type="button" className="col-span-2 text-left text-xs font-bold text-primary" onClick={() =>
        navigator.geolocation?.getCurrentPosition((p) => setForm({ ...form, latitude: p.coords.latitude.toFixed(6), longitude: p.coords.longitude.toFixed(6) }))}>
        Use my current location
      </button>
    </div>
  );
}

function StoreForm({ store, onDone }: { store: Store; onDone: () => void }) {
  const [form, setForm] = useState(() => toForm(store));
  const save = useVendorMutation((v: UpdateStoreInput) => api.updateStore(v), "Store details saved");
  return (
    <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(fromForm(form) as UpdateStoreInput, { onSuccess: onDone }); }}>
      <StoreFields form={form} setForm={setForm} />
      <Button type="submit" className="w-full font-bold" disabled={save.isPending}>Save</Button>
    </form>
  );
}

function CreateStore() {
  const [form, setForm] = useState<FormState>(() => toForm({ country: "India" }));
  const [error, setError] = useState<string | null>(null);
  const create = useVendorMutation((v: Parameters<typeof api.createStore>[0]) => api.createStore(v), "Store created");
  useEffect(() => setError(null), [form]);
  return (
    <Section title="Set up your store">
      <Note>You don't have a store on aasPass yet. Fill in your details to create one — aasPass will verify it before customers can see it.</Note>
      <form className="mt-4 space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const missing = FIELDS.filter((f) => f.required && !(form[f.key] ?? "").trim()).map((f) => f.label);
        if (!form["latitude"] || !form["longitude"]) missing.push("Location");
        if (missing.length) return setError(`Please fill in: ${missing.join(", ")}`);
        create.mutate(fromForm(form) as Parameters<typeof api.createStore>[0]);
      }}>
        <StoreFields form={form} setForm={setForm} />
        {error && <p className="text-xs font-bold text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full font-bold" disabled={create.isPending}>Create store</Button>
      </form>
    </Section>
  );
}
