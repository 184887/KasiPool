import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/kp/AppShell";
import { Logo } from "@/components/kp/pool-bits";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, safeRedirect } from "@/lib/auth";
import { errMsg } from "@/lib/queries";
import { normaliseSaMobile } from "@/lib/format";

type Search = { redirect?: string; mode?: "login" | "register" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    mode: s.mode === "register" ? "register" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Log in or register — KasiPool" },
      {
        name: "description",
        content: "Sign in to KasiPool or register your business to start pooling.",
      },
      { property: "og:title", content: "Log in to KasiPool" },
      { property: "og:description", content: "Register your business and start pooling." },
    ],
  }),
  component: AuthPage,
});

const REDIRECT_KEY = "kp-auth-redirect";

function AuthPage() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { user, business, businessLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneMode, setPhoneMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (search.redirect) sessionStorage.setItem(REDIRECT_KEY, safeRedirect(search.redirect));
  }, [search.redirect]);

  useEffect(() => {
    if (!user || businessLoading) return;
    const target = safeRedirect(search.redirect ?? sessionStorage.getItem(REDIRECT_KEY));
    sessionStorage.removeItem(REDIRECT_KEY);
    if (!business) nav({ to: "/onboarding", search: { redirect: target }, replace: true });
    else nav({ to: target, replace: true });
  }, [user, business, businessLoading, nav, search.redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (r.error) toast.error(errMsg(r.error));
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normaliseSaMobile(phone);
    if (!normalized) {
      toast.error("Enter a valid South African mobile number, e.g. 072 123 4567");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: { shouldCreateUser: mode === "register" },
      });
      if (error) throw error;
      setPhone(normalized);
      setOtpSent(true);
      toast.success("Verification code sent");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="max-w-md py-10">
      <div className="rounded-3xl border bg-card p-6 shadow-card">
        <div className="text-center">
          <Logo />
        </div>
        {sent ? (
          <div className="mt-6 text-center">
            <h1 className="font-display text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-muted-foreground">
              We sent a confirmation link to <b>{email}</b>. Click it to finish registering, then
              add your business details.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-center font-display text-2xl font-bold">
              {mode === "login" ? "Welcome back" : "Register your business"}
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {mode === "login"
                ? "Log in to join pools and track orders."
                : "Step 1 of 2: create your login."}
            </p>
            <Button variant="outline" size="lg" className="mt-6 w-full" onClick={google}>
              Continue with Google
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or continue with {phoneMode ? "mobile" : "email"}
              <span className="h-px flex-1 bg-border" />
            </div>
            {phoneMode ? (
              otpSent ? (
                <form onSubmit={verifyOtp} className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Enter the six-digit code sent to <b>{phone}</b>.
                  </p>
                  <div>
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      className="mt-1 h-12"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </div>
                  <Button type="submit" size="xl" className="w-full" disabled={busy}>
                    {busy ? "Verifying…" : "Verify code"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm font-semibold text-primary"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    Use a different number
                  </button>
                </form>
              ) : (
                <form onSubmit={sendOtp} className="space-y-3">
                  <div>
                    <Label htmlFor="phone">South African mobile number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="072 123 4567"
                      required
                      className="mt-1 h-12"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="xl" className="w-full" disabled={busy}>
                    {busy ? "Sending…" : "Send verification code"}
                  </Button>
                </form>
              )
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-1 h-12"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pw">Password</Label>
                  <Input
                    id="pw"
                    type="password"
                    required
                    minLength={mode === "register" ? 8 : undefined}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="mt-1 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" size="xl" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm">
              {mode === "login" ? "New to KasiPool? " : "Already registered? "}
              <button
                className="font-semibold text-primary"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setOtpSent(false);
                  setOtp("");
                }}
              >
                {mode === "login" ? "Register" : "Log in"}
              </button>
            </p>
            <button
              type="button"
              className="mt-3 w-full text-sm font-semibold text-primary"
              onClick={() => {
                setPhoneMode(!phoneMode);
                setOtpSent(false);
                setOtp("");
              }}
            >
              {phoneMode ? "Use email instead" : "Use mobile number instead"}
            </button>
          </>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to the{" "}
        <Link to="/terms" className="underline">
          draft terms
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="underline">
          privacy notice
        </Link>
        .
      </p>
    </Container>
  );
}
