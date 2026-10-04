import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/Sidebar";
import { STATUS_CLS } from "@/components/stage/Inspector";
import { useStage, type Status } from "@/lib/stage-store";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals — StageSync" },
      { name: "description", content: "Review and approve stage objects by department." },
      { property: "og:title", content: "Approvals — StageSync" },
      { property: "og:description", content: "Approve or request changes on stage plan items." },
    ],
  }),
  component: Approvals,
});

const ORDER: Status[] = ["In Review", "Changes Requested", "Draft", "Approved"];

function Approvals() {
  const objects = useStage((s) => s.objects);
  const update = useStage((s) => s.updateObject);
  const select = useStage((s) => s.select);
  const push = useNotifications((s) => s.push);
  const nav = useNavigate();
  const set = (id: string, status: Status) => {
    const o = objects.find((x) => x.id === id)!;
    update(id, { status });
    push({ title: status, body: o.name, dept: o.department });
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageHeader title="Approvals" sub={`${objects.filter((o) => o.status === "In Review").length} awaiting review`} />
      <div className="overflow-auto p-4">
        <table className="w-full border border-border text-xs">
          <thead className="bg-panel text-left">
            <tr>
              {["Object", "Department", "Owner", "Status", "Comments", ""].map((h) => (
                <th key={h} className="panel-label border-b border-border px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...objects].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)).map((o) => (
              <tr key={o.id} className="border-b border-border hover:bg-panel">
                <td className="px-3 py-2">
                  <button className="hover:text-primary" onClick={() => { select(o.id); nav({ to: "/" }); }}>{o.name}</button>
                </td>
                <td className="px-3 text-muted-foreground">{o.department}</td>
                <td className="px-3 text-muted-foreground">{o.owner}</td>
                <td className="px-3">
                  <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${STATUS_CLS[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-3 font-mono text-muted-foreground">{o.comments.length}</td>
                <td className="px-3 py-1.5 text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn" disabled={o.status === "Approved"} onClick={() => set(o.id, "Approved")}>Approve</button>
                    <button className="btn" disabled={o.status === "Changes Requested"} onClick={() => set(o.id, "Changes Requested")}>Request changes</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
