import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, type AppRole } from "@/lib/access";
import { Sidebar } from "@/components/shell/Sidebar";
import { useLibrary } from "@/lib/asset-library";
import { useStage } from "@/lib/stage-store";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
    const role = (r?.role ?? null) as AppRole | null;
    if (role && !canAccess(role, location.pathname)) throw redirect({ to: "/" });
    return { user: data.user, role };
  },
  component: AuthedLayout,
});

export function useSignOut() {
  const navigate = useNavigate();
  return async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };
}

function AuthedLayout() {
  const { role, user } = Route.useRouteContext();
  const signOut = useSignOut();

  useEffect(() => {
    if (!role) return;
    void useStage.getState().load();
    void useLibrary.getState().fetch();
  }, [role]);

  if (!role) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="w-[320px] rounded-sm border border-border bg-panel p-5 text-center">
          <h1 className="text-[13px] font-semibold">Waiting for role assignment</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Signed in as {user.email}. An admin needs to assign your team role before you can open StageSync.
          </p>
          <button className="btn mt-4" onClick={() => void signOut()}>Log out</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar role={role} email={user.email ?? ""} onLogout={() => void signOut()} />
      <Outlet />
    </>
  );
}
