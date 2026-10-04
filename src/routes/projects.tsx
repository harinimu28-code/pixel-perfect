import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/Sidebar";
import { useStage } from "@/lib/stage-store";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — StageSync" },
      { name: "description", content: "All event production projects in your StageSync workspace." },
      { property: "og:title", content: "Projects — StageSync" },
      { property: "og:description", content: "Browse and open event stage projects." },
    ],
  }),
  component: Projects,
});

function Projects() {
  const objects = useStage((s) => s.objects);
  const dims = useStage((s) => s.dims);
  const approved = objects.filter((o) => o.status === "Approved").length;
  const rows = [
    { name: "Annual Cultural Event 2026", venue: "City Auditorium, Hall A", date: "14 Nov 2026", stage: `${dims.width}×${dims.depth} m`, progress: Math.round((approved / Math.max(1, objects.length)) * 100), open: true },
    { name: "Tech Summit Keynote", venue: "Convention Centre", date: "02 Dec 2026", stage: "16×10 m", progress: 12, open: false },
    { name: "Winter Gala Dinner", venue: "Grand Hotel Ballroom", date: "20 Dec 2026", stage: "8×5 m", progress: 0, open: false },
  ];
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageHeader title="Projects" sub={`${rows.length} projects`} />
      <div className="p-4">
        <table className="w-full border border-border text-xs">
          <thead className="bg-panel text-left">
            <tr>
              {["Project", "Venue", "Event date", "Stage", "Approved", ""].map((h) => (
                <th key={h} className="panel-label border-b border-border px-3 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-border hover:bg-panel">
                <td className="px-3 py-2.5 font-medium">{r.name}</td>
                <td className="px-3 text-muted-foreground">{r.venue}</td>
                <td className="px-3 font-mono">{r.date}</td>
                <td className="px-3 font-mono">{r.stage}</td>
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-24 bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{r.progress}%</span>
                  </div>
                </td>
                <td className="px-3 text-right">
                  {r.open ? (
                    <Link to="/" className="btn-primary">Open planner</Link>
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground">Not started</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
