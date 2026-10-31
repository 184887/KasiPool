"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/kp/AppShell";
import { Logo } from "@/components/kp/pool-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, safeRedirect } from "@/lib/auth";
import { contactHref } from "@/lib/contact";
import { errMsg, FriendlyError, settingsQuery } from "@/lib/queries";
import { isValidPin, phoneToLogin } from "@/lib/phone-auth";
import { useT } from "@/i18n";

type Search = { redirect?: string; mode?: "login" | "register" };

const REDIRECT_KEY = "kp-auth-redirect";

/** Sign-in errors talk about email and password; say number and PIN instead. */
function authError(err: unknown): string {
  const msg = err && typeof err === "object" && "message" in err ? String(err.message) : "";
  if (/invalid login credentials/i.test(msg)) return "Wrong mobile number or PIN";
  if (/already (been )?registered|already exists/i.test(msg))
    return "This number is already registered. Log in instead.";
  if (/rate limit|too many/i.test(msg)) return "Too many tries. Please wait a few minutes.";
  return errMsg(err);
}

const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

export function AuthPage() {
  const params = useSearchParams();
  const search: Search = {
    redirect: params.get("redirect") ?? undefined,
    mode: params.get("mode") === "register" ? "register" : undefined,
  };
  const nav = useRouter();
  const { user, business, businessLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const { t, rich, server } = useT();

  useEffect(() => {
    if (search.redirect) sessionStorage.setItem(REDIRECT_KEY, safeRedirect(search.redirect));
  }, [search.redirect]);

  useEffect(() => {
    if (!user || businessLoading) return;
    const target = safeRedirect(search.redirect ?? sessionStorage.getItem(REDIRECT_KEY));
    sessionStorage.removeItem(REDIRECT_KEY);
    if (!business) nav.replace(`/onboarding?redirect=${encodeURIComponent(target)}`);
    else nav.replace(target);
  }, [user, business, businessLoading, nav, search.redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const login = phoneToLogin(phone);
    if (!login)
      return toast.error(t("Enter a valid South African mobile number, e.g. 072 123 4567"));
    if (!isValidPin(pin)) return toast.error(t("Your PIN must be 6 digits"));
    if (mode === "register" && pin !== pin2) return toast.error(t("The two PINs don't match"));
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: login, password: pin });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: login,
          password: pin,
          options: { data: { phone: login.split("@")[0] } },
        });
        if (error) throw error;
        // No session means Supabase still requires email confirmation, which can't arrive
        if (!data.session)
          throw new FriendlyError("You can't register right now. Please try again later.");
      }
    } catch (err) {
      toast.error(server(authError(err)));
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "register" : "login");
    setPin("");
    setPin2("");
    setForgot(false);
  }

  return (
    <Container className="max-w-md py-10">
      <div className="rounded-md border-2 border-ink bg-card p-6">
        <div className="text-center">
          <Logo />
        </div>
        <h1 className="mt-4 text-center font-headline text-4xl sm:text-5xl">
          {mode === "login" ? t("Welcome back") : t("Register your business")}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "login"
            ? t("Log in with your mobile number and PIN.")
            : t("Step 1 of 2: choose a PIN with 6 numbers.")}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <Label htmlFor="phone">{t("Mobile number")}</Label>
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
          <div>
            <Label htmlFor="pin">{mode === "login" ? "PIN" : t("Choose a PIN (6 numbers)")}</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              pattern="[0-9]{6}"
              required
              className="mt-1 h-12 tracking-[0.3em]"
              value={pin}
              onChange={(e) => setPin(digits(e.target.value))}
            />
          </div>
          {mode === "register" && (
            <div>
              <Label htmlFor="pin2">{t("Enter the PIN again")}</Label>
              <Input
                id="pin2"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{6}"
                required
                className="mt-1 h-12 tracking-[0.3em]"
                value={pin2}
                onChange={(e) => setPin2(digits(e.target.value))}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {t("Keep your PIN secret. Do not use your birthday or 123456.")}
              </p>
            </div>
          )}
          <Button type="submit" size="xl" variant="gold" className="w-full" disabled={busy}>
            {busy ? t("Please wait…") : mode === "login" ? t("Log in") : t("Create account")}
          </Button>
        </form>
        {mode === "login" &&
          (forgot ? (
            <ForgotPin />
          ) : (
            <button
              type="button"
              className="mt-3 w-full text-sm font-semibold text-ember underline underline-offset-4"
              onClick={() => setForgot(true)}
            >
              {t("Forgot your PIN?")}
            </button>
          ))}
        <p className="mt-4 text-center text-sm">
          {mode === "login" ? t("New to KasiPool?") : t("Already registered?")}{" "}
          <button
            type="button"
            className="font-semibold text-ember underline underline-offset-4"
            onClick={switchMode}
          >
            {mode === "login" ? t("Register") : t("Log in")}
          </button>
        </p>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {rich(
          "If you continue, you agree to the <terms>draft terms</terms> and <privacy>privacy notice</privacy> (in English).",
          {
            terms: (c) => (
              <Link href="/terms" className="underline">
                {c}
              </Link>
            ),
            privacy: (c) => (
              <Link href="/privacy" className="underline">
                {c}
              </Link>
            ),
          },
        )}
      </p>
    </Container>
  );
}

/** PIN resets are done by KasiPool staff for now, so point people at the contact details. */
function ForgotPin() {
  const { t, rich } = useT();
  const { data } = useQuery(settingsQuery);
  const c = data?.contact;
  const reach = c?.whatsapp
    ? { text: t("WhatsApp {n}", { n: c.whatsapp }), href: contactHref.whatsapp(c.whatsapp) }
    : c?.phone
      ? { text: t("call {n}", { n: c.phone }), href: contactHref.phone(c.phone) }
      : c?.email
        ? { text: t("email {n}", { n: c.email }), href: contactHref.email(c.email) }
        : null;
  // The button that opened this is gone, so move focus here and let screen readers read it
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <p
      ref={ref}
      tabIndex={-1}
      role="status"
      className="mt-3 rounded-md bg-muted p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ink"
    >
      {reach
        ? rich(
            "To get a new PIN, <b>{reach}</b> from the number you registered with. We will check it is you and give you a new PIN.",
            {
              b: (x) => (
                <a href={reach.href} className="font-semibold text-ember underline">
                  {x}
                </a>
              ),
            },
            { reach: reach.text },
          )
        : t(
            "To get a new PIN, contact KasiPool from the number you registered with. We will check it is you and give you a new PIN.",
          )}{" "}
      <Link href="/help" className="font-semibold text-ember underline">
        {t("Help & contact")}
      </Link>
    </p>
  );
}
