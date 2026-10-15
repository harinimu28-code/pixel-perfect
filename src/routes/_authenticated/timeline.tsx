import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/Sidebar";
import { Timeline } from "@/components/stage/Timeline";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({
    meta: [
      { title: "Production Timeline — StageSync" },
      { name: "description", content: "Run-of-show timeline across stage, lighting, sound, LED and props." },
      { property: "og:title", content: "Production Timeline — StageSync" },
      { property: "og:description", content: "See how every stage system changes during the event." },
    ],
  }),
  component: () => (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageHeader title="Production Timeline" sub="Run of show · 18:00 – 20:00" />
      <div className="min-h-0 flex-1">
        <Timeline tall />
      </div>
    </div>
  ),
});
