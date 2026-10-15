import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shell/Sidebar";
import { ROLES, roleLabel, type AppRole } from "@/lib/access";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Team — StageSync" },
      { name: "description", content: "Assign team roles in StageSync." },
      { property: "og:title", content: "Team — StageSync" },
      { property: "og:description", content: "Assign team roles in StageSync." },
    ],
  }),
  component: UsersPage,
});

type Row = { id: string; name: string; email: string; role: AppRole | null };

function UsersPage() {
  const me = Route.useRouteContext().user.id;
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id,name,email").order("created_at"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const roles = new Map((r.data ?? []).map((x) => [x.user_id, x.role]));
    setRows((p.data ?? []).map((x) => ({ ...x, role: roles.get(x.id) ?? null })));
  };
  useEffect(() => { void load(); }, []);

  const setRole = async (id: string, role: string) => {
    setErr(null);
    const { error } = role
      ? await supabase.from("user_roles").upsert({ user_id: id, role: role as AppRole }, { onConflict: "user_id" })
      : await supabase.from("user_roles").delete().eq("user_id", id);
    if (error) setErr(error.message);
    void load();
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageHeader title="Team" sub="Assign one role per member" />
      <div className="overflow-auto p-4">
        {err && <p className="mb-2 text-xs text-destructive">{err}</p>}
        <table className="w-full text-xs">
          <thead><tr className="panel-label text-left"><th className="py-2">Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="py-2">{u.name || "—"}</td>
                <td className="font-mono text-muted-foreground">{u.email}</td>
                <td>
                  <select className="field" value={u.role ?? ""} disabled={u.id === me}
                    onChange={(e) => void setRole(u.id, e.target.value)}>
                    <option value="">No role (waiting)</option>
                    {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
