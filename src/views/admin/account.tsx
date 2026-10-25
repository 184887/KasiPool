"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Section } from "@/components/kp/ui";
import { useAuth } from "@/lib/auth";

export const MIN_PASSWORD = 8;

/** Why a new password can't be used, or null if it's fine */
export function passwordProblem(current: string, next: string, again: string): string | null {
  if (next.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`;
  if (next === current) return "Choose a password you haven't used here";
  if (next !== again) return "The new passwords don't match";
  return null;
}

/** Team member's own account: change password and log out. */
export function Account() {
  const { user, signOut } = useAuth();
  const nav = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    const problem = passwordProblem(current, next, again);
    if (problem) return toast.error(problem);
    setBusy(true);
    // Check the current password first, so an unlocked laptop can't be used to take the account
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (check.error) {
      setBusy(false);
      return toast.error("Your current password is wrong");
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return toast.error("Could not change your password. Please try again.");
    setCurrent("");
    setNext("");
    setAgain("");
    toast.success("Password changed");
  }

  return (
    <div className="max-w-lg space-y-4">
      <PageHeader title="Account" subtitle={user?.email ?? undefined} />
      <Section title="Change password">
        <form onSubmit={change} className="space-y-3">
          <div>
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 h-12"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="next">New password</Label>
            <Input
              id="next"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD}
              className="mt-1 h-12"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              At least {MIN_PASSWORD} characters. A short sentence is easy to remember and hard to
              guess.
            </p>
          </div>
          <div>
            <Label htmlFor="again">New password again</Label>
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
          <Button type="submit" disabled={busy}>
            {busy ? "Please wait…" : "Change password"}
          </Button>
        </form>
      </Section>
      <Button
        variant="outline"
        className="w-full"
        onClick={async () => {
          await signOut();
          nav.replace("/admin/login");
        }}
      >
        <LogOut /> Log out
      </Button>
    </div>
  );
}
