import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getConnection, resetConnection, saveConnection, type Connection } from "@/features/vendor/api/config";
import { Note, PhoneFrame, Section, TopBar } from "@/features/vendor/components";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connection · aasPass Partner" },
      { name: "description", content: "Point the aasPass Partner app at your aasPass server." },
      { property: "og:title", content: "Connection · aasPass Partner" },
      { property: "og:description", content: "Point the aasPass Partner app at your aasPass server." },
    ],
  }),
  component: ConnectScreen,
});

function ConnectScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Connection>({ apiUrl: "", supabaseUrl: "", supabaseAnonKey: "" });
  useEffect(() => setForm(getConnection()), []);
  const set = (k: keyof Connection) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <PhoneFrame>
      <TopBar title="Connection" back="/" />
      <Section>
        <Note>Enter your aasPass server address to use real store data. Leave it empty to use the sample store.</Note>
      </Section>
      <Section title="Server">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="api">Server address</Label>
            <Input id="api" placeholder="http://localhost:3000" value={form.apiUrl} onChange={set("apiUrl")} /></div>
        </div>
      </Section>
      <Section title="Email sign-in">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="sb">Sign-in project address</Label>
            <Input id="sb" placeholder="https://xyz.supabase.co" value={form.supabaseUrl} onChange={set("supabaseUrl")} /></div>
          <div className="space-y-1.5"><Label htmlFor="key">Public sign-in key</Label>
            <Input id="key" value={form.supabaseAnonKey} onChange={set("supabaseAnonKey")} /></div>
        </div>
      </Section>
      <Section>
        <div className="flex gap-2">
          <Button className="flex-1 font-bold" onClick={() => { saveConnection(form); toast.success("Saved"); navigate({ to: "/" }); }}>Save</Button>
          <Button variant="outline" onClick={() => { setForm(resetConnection()); toast("Reset to defaults"); }}>Reset</Button>
        </div>
      </Section>
    </PhoneFrame>
  );
}
