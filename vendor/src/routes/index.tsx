import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Settings2, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoLogin, listDemoUsers, signInWithPassword } from "@/features/vendor/api/auth";
import { setApiAccessToken } from "@/features/vendor/api/client";
import { isApiConfigured, isAuthConfigured } from "@/features/vendor/api/config";
import { Brand, PhoneFrame } from "@/features/vendor/components";
import { useSession } from "@/features/vendor/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · aasPass Partner" },
      { name: "description", content: "Sign in to manage your aasPass store orders, products and stock." },
      { property: "og:title", content: "Sign in · aasPass Partner" },
      { property: "og:description", content: "Sign in to manage your aasPass store orders, products and stock." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { session, hydrated, signIn } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (hydrated && session) navigate({ to: "/orders" });
  }, [hydrated, session, navigate]);

  const apiReady = mounted && isApiConfigured();
  const authReady = mounted && isAuthConfigured();
  const demoUsers = useQuery({ queryKey: ["demo-users"], queryFn: listDemoUsers, enabled: apiReady, retry: false });

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); navigate({ to: "/orders" }); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(null); }
  };

  const passwordSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) { toast.error("Enter your email and password"); return; }
    run("password", async () => {
      const { token, email: who } = await signInWithPassword(email.trim(), password);
      signIn({ mode: "live", email: who, name: who.split("@")[0] ?? who }, token);
    });
  };

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col px-6 pb-8 pt-14">
        <Brand size="lg" />
        <h1 className="mt-10 text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to take orders and manage your store.</p>

        <form onSubmit={passwordSignIn} className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@yourstore.in" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" size="lg" className="w-full font-bold" disabled={!!busy}>
            {busy === "password" && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </Button>
          {mounted && !authReady && (
            <p className="text-xs text-muted-foreground">Email sign-in needs your sign-in details on the Connection screen.</p>
          )}
        </form>

        {apiReady && demoUsers.data && demoUsers.data.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Test accounts on your server</p>
            <div className="space-y-2">
              {demoUsers.data.map((u) => (
                <button key={u.id} disabled={!!busy} onClick={() => run(u.id, async () => {
                  const res = await demoLogin(u.email);
                  setApiAccessToken(res.access_token);
                  signIn({ mode: "live", email: u.email, name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email }, res.access_token);
                })} className="flex w-full items-center justify-between rounded-lg border bg-card px-3 py-2.5 text-left text-sm hover:border-primary">
                  <span><span className="font-bold">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "Test user"}</span>
                    <span className="block text-xs text-muted-foreground">{u.email}</span></span>
                  {busy === u.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button variant="outline" size="lg" className="w-full font-bold" disabled={!!busy}
          onClick={() => run("demo", async () => signIn({ mode: "demo", email: "owner@sharmafresh.in", name: "Rakesh Sharma" }))}>
          <Store className="h-4 w-4" /> Explore a sample store
        </Button>

        <Link to="/connect" className="mt-auto flex items-center justify-center gap-1.5 pt-8 text-xs font-bold text-muted-foreground hover:text-foreground">
          <Settings2 className="h-3.5 w-3.5" /> Connection settings
        </Link>
      </div>
    </PhoneFrame>
  );
}
