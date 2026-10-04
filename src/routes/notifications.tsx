import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/Sidebar";
import { useNotifications, timeAgo } from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — StageSync" },
      { name: "description", content: "Activity across your stage production team." },
      { property: "og:title", content: "Notifications — StageSync" },
      { property: "og:description", content: "Reviews, approvals and comments from every department." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { items, markRead, markAll } = useNotifications();
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageHeader title="Notifications" sub={`${items.filter((i) => !i.read).length} unread`}>
        <button className="btn" onClick={markAll}>Mark all read</button>
      </PageHeader>
      <div className="overflow-auto p-4">
        <div className="border border-border">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className="flex w-full items-start gap-3 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-panel"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium">{n.title}</div>
                <div className="truncate text-xs text-muted-foreground">{n.body}</div>
              </div>
              <span className="panel-label shrink-0">{n.dept}</span>
              <span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground">{timeAgo(n.at)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
