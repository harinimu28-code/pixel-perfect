import { Link } from "@tanstack/react-router";
import { FolderKanban, Box, ClipboardList, GanttChart, CheckSquare, Bell, Users, LogOut } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import { canAccess, roleLabel, type AppRole } from "@/lib/access";

const NAV = [
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/", label: "Stage Planner", icon: Box },
  { to: "/requirements", label: "Requirements", icon: ClipboardList },
  { to: "/timeline", label: "Timeline", icon: GanttChart },
  { to: "/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/users", label: "Team", icon: Users },
] as const;

export function Sidebar({ role, email, onLogout }: { role: AppRole; email: string; onLogout: () => void }) {
  const unread = useNotifications((s) => s.items.filter((i) => !i.read).length);
  return (
    <aside className="flex w-[184px] shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex h-11 items-center gap-2 border-b border-border px-3">
        <div className="grid h-5 w-5 place-items-center rounded-sm bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
          S
        </div>
        <span className="text-[13px] font-semibold tracking-tight">StageSync</span>
      </div>
      <nav className="flex flex-col gap-px p-1.5">
        {NAV.filter((n) => canAccess(role, n.to)).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex h-8 items-center gap-2.5 rounded-sm border-l-2 border-transparent px-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "!border-primary bg-accent !text-foreground" }}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="flex-1">{label}</span>
            {label === "Notifications" && unread > 0 && (
              <span className="rounded-sm bg-primary px-1 font-mono text-[10px] text-primary-foreground">{unread}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-border p-3">
        <div className="panel-label mb-1">{roleLabel(role)}</div>
        <div className="truncate text-xs" title={email}>{email}</div>
        <button onClick={onLogout} className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-3.5 w-3.5" /> Log out
        </button>
      </div>
    </aside>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-panel px-4">
      <h1 className="text-[13px] font-semibold">{title}</h1>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
