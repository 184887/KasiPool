import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/kp/AppShell";
import { BusinessForm } from "@/components/kp/BusinessForm";
import { Loading, PageHeader, Section } from "@/components/kp/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { errMsg } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Business profile — KasiPool" },
      { name: "description", content: "Manage your business details and preferences." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, business, businessLoading, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const adminExists = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => (await supabase.rpc("admin_exists")).data ?? true,
  });
  if (!user || businessLoading) return <Loading />;

  async function claim() {
    if (!confirm("Make this account the first KasiPool administrator? This can only be done once."))
      return;
    const { error } = await supabase.rpc("claim_first_admin");
    if (error) return toast.error(errMsg(error));
    toast.success("You are now an administrator");
    qc.invalidateQueries();
  }

  return (
    <Container className="max-w-2xl space-y-4">
      <PageHeader title="Profile" subtitle={user.email ?? undefined} />
      <Section title="Business details">
        {business ? (
          <BusinessForm userId={user.id} existing={business} onDone={() => {}} />
        ) : (
          <p className="text-sm">
            <Link to="/onboarding" className="font-semibold text-primary underline">
              Add your business details
            </Link>{" "}
            to start joining pools.
          </p>
        )}
      </Section>
      {isAdmin && (
        <Section title="Administrator">
          <p className="text-sm text-muted-foreground">
            You have administrator access. Your customer view and admin view use the same live data.
          </p>
          <Button asChild className="mt-3">
            <Link to="/admin">
              <Shield /> Open admin dashboard
            </Link>
          </Button>
        </Section>
      )}
      {!isAdmin && adminExists.data === false && (
        <Section title="Set up KasiPool">
          <p className="text-sm text-muted-foreground">
            No administrator has been set up yet. The project owner can claim the first
            administrator role for this account. After that, only administrators can grant admin
            access.
          </p>
          <Button variant="gold" className="mt-3" onClick={claim}>
            <Shield /> Become first administrator
          </Button>
        </Section>
      )}
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={async () => {
          await signOut();
          nav({ to: "/auth", replace: true });
        }}
      >
        <LogOut /> Log out
      </Button>
    </Container>
  );
}
