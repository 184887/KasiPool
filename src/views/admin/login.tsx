"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/kp/pool-bits";
import { useAuth } from "@/lib/auth";

/** Admin redirects stay inside /admin */
function adminRedirect(r: string | null) {
  return r && r.startsWith("/admin") && !r.startsWith("/admin/login") ? r : "/admin";
}

/** Team login: real email + password (shops use phone + PIN at /auth). */
export function AdminLoginPage() {
  const params = useSearchParams();
  const nav = useRouter();
  const { user, isAdmin, rolesLoading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const target = adminRedirect(params.get("redirect"));

  useEffect(() => {
    if (user && isAdmin) nav.replace(target);
  }, [user, isAdmin, nav, target]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      setBusy(false);
      return toast.error("Wrong email or password");
    }
    const { data: admin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    setBusy(false);
    if (!admin) {
      await signOut();
      return toast.error("This account does not have admin access");
    }
    nav.replace(target);
  }

  const notAdmin = user && !rolesLoading && !isAdmin;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm rounded-md border-2 border-ink bg-card p-6">
        <div className="text-center">
          <Logo />
        </div>
        <h1 className="mt-4 flex items-center justify-center gap-2 font-headline text-4xl">
          <Shield className="size-7" aria-hidden="true" /> Admin
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          For the KasiPool team. Log in with your email.
        </p>
        {notAdmin ? (
          <div className="mt-6 space-y-3 text-center text-sm">
            <p>You are logged in as a shop. Log out to use a team account.</p>
            <Button variant="outline" className="w-full" onClick={signOut}>
              Log out
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                className="mt-1 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="xl" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : "Log in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Forgot your password? Ask another admin to reset it in Supabase.
            </p>
          </form>
        )}
      </div>
      <Link href="/" className="mt-4 text-sm font-semibold text-paper/80 underline">
        Back to KasiPool
      </Link>
    </div>
  );
}
