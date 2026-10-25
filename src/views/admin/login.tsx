"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/kp/pool-bits";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/queries";
import { PHONE_LOGIN_DOMAIN } from "@/lib/phone-auth";
import { MIN_PASSWORD } from "./account";
import { isEmail } from "./settings";

/** Admin redirects stay inside /admin */
function adminRedirect(r: string | null) {
  return r && r.startsWith("/admin") && !r.startsWith("/admin/login") ? r : "/admin";
}

/** What's wrong with an access request form, or null when it can be sent. */
export function requestProblem(name: string, email: string, password: string, again: string) {
  if (name.trim().length < 2) return "Enter your name";
  if (!isEmail(email.trim())) return "Enter your email address";
  if (email.trim().toLowerCase().endsWith(`@${PHONE_LOGIN_DOMAIN}`))
    return "Use your own email address";
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`;
  if (password !== again) return "The passwords don't match";
  return null;
}

type Mode = "login" | "request" | "sent";

/** Team login: real email + password (businesses use phone + PIN at /auth). */
export function AdminLoginPage() {
  const params = useSearchParams();
  const nav = useRouter();
  const { user, isAdmin, rolesLoading, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const target = adminRedirect(params.get("redirect"));

  useEffect(() => {
    if (user && isAdmin) nav.replace(target);
  }, [user, isAdmin, nav, target]);

  async function login(e: React.FormEvent) {
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
    if (!admin) {
      const { data: req } = await supabase
        .from("admin_requests")
        .select("status")
        .eq("user_id", data.user.id)
        .maybeSingle();
      await signOut();
      setBusy(false);
      return toast.error(
        req?.status === "pending"
          ? "Your request is waiting for another admin to approve it"
          : req?.status === "declined"
            ? "Your request for admin access was not approved"
            : "This account does not have admin access",
      );
    }
    setBusy(false);
    nav.replace(target);
  }

  async function request(e: React.FormEvent) {
    e.preventDefault();
    const problem = requestProblem(name, email, password, again);
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      const login = { email: email.trim(), password };
      const signUp = await supabase.auth.signUp({
        ...login,
        options: { data: { full_name: name } },
      });
      if (signUp.error) {
        // The email already has an account (e.g. asked before): ask with that account instead
        if (!/already (been )?registered|already exists/i.test(signUp.error.message))
          throw signUp.error;
        const signIn = await supabase.auth.signInWithPassword(login);
        if (signIn.error) {
          toast.error("This email already has an account. Log in, or check the password.");
          return;
        }
      } else if (!signUp.data.session) {
        toast.error("You can't ask for access right now. Please try again later.");
        return;
      }
      const { error } = await supabase.rpc("request_admin_access", { _name: name.trim() });
      if (error) throw error;
      setMode("sent");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      // No one waiting for approval stays logged in
      if ((await supabase.auth.getSession()).data.session) await signOut();
      setBusy(false);
    }
  }

  const notAdmin = user && !rolesLoading && !isAdmin && !busy && mode === "login";
  const switchTo = (m: Mode) => {
    setPassword("");
    setAgain("");
    setMode(m);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm animate-enter rounded-md border-2 border-ink bg-card p-6">
        <div className="text-center">
          <Logo />
        </div>
        <h1 className="mt-4 flex items-center justify-center gap-2 font-headline text-4xl">
          <Shield className="size-7" aria-hidden="true" />{" "}
          {mode === "request" ? "Join the team" : "Admin"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "request"
            ? "Create your team login. Another KasiPool admin must approve it before you can use it."
            : "For the KasiPool team. Log in with your email."}
        </p>

        {mode === "sent" ? (
          <div className="mt-6 space-y-3 text-center" role="status">
            <CheckCircle2 className="mx-auto size-10 text-leaf" aria-hidden="true" />
            <p className="font-display text-lg font-bold">Request sent</p>
            <p className="text-sm text-muted-foreground">
              Ask another KasiPool admin to approve you in Admin, Settings. Then log in here with{" "}
              <b className="text-foreground">{email.trim()}</b>.
            </p>
            <Button variant="outline" className="w-full" onClick={() => switchTo("login")}>
              Back to log in
            </Button>
          </div>
        ) : notAdmin ? (
          <div className="mt-6 space-y-3 text-center text-sm">
            <p>You are logged in with a business account. Log out to use a team account.</p>
            <Button variant="outline" className="w-full" onClick={signOut}>
              Log out
            </Button>
          </div>
        ) : (
          <form onSubmit={mode === "login" ? login : request} className="mt-6 space-y-3">
            {mode === "request" && (
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  required
                  className="mt-1 h-12"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
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
              <Label htmlFor="password">
                {mode === "request" ? `Password (at least ${MIN_PASSWORD} characters)` : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "request" ? "new-password" : "current-password"}
                required
                className="mt-1 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === "request" && (
              <div>
                <Label htmlFor="again">Password again</Label>
                <Input
                  id="again"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 h-12"
                  value={again}
                  onChange={(e) => setAgain(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" size="xl" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Ask for access"}
            </Button>
            {mode === "login" ? (
              <>
                <p className="text-center text-sm text-muted-foreground">
                  Forgot your password? Ask another KasiPool admin to reset it.
                </p>
                <p className="border-t-2 border-ink/10 pt-3 text-center text-sm">
                  New to the team?{" "}
                  <button
                    type="button"
                    className="min-h-11 cursor-pointer font-semibold text-ember underline underline-offset-4"
                    onClick={() => switchTo("request")}
                  >
                    Ask for admin access
                  </button>
                </p>
              </>
            ) : (
              <p className="text-center text-sm">
                Already approved?{" "}
                <button
                  type="button"
                  className="min-h-11 cursor-pointer font-semibold text-ember underline underline-offset-4"
                  onClick={() => switchTo("login")}
                >
                  Log in
                </button>
              </p>
            )}
          </form>
        )}
      </div>
      <Link href="/" className="mt-4 text-sm font-semibold text-paper/80 underline">
        Back to KasiPool
      </Link>
    </div>
  );
}
