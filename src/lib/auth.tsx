import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  business: Tables<"businesses"> | null;
  businessLoading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  isAdmin: false,
  business: null,
  businessLoading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") qc.clear();
      else qc.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const roles = useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.role);
    },
  });
  const biz = useQuery({
    queryKey: ["my-business", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        isAdmin: !!roles.data?.includes("admin"),
        business: biz.data ?? null,
        businessLoading: !!user && biz.isLoading,
        signOut: async () => {
          await qc.cancelQueries();
          qc.clear();
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

/** Sanitise a same-origin redirect path */
export function safeRedirect(r: unknown): string {
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/my-pools";
}
