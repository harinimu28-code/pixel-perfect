import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { StageViewport } from "@/components/stage/StageViewport";
import { Inspector } from "@/components/stage/Inspector";
import { Timeline } from "@/components/stage/Timeline";
import { TopBar, AssetToolbar } from "@/components/stage/PlannerToolbars";
import { useStage } from "@/lib/stage-store";

export const Route = createFileRoute("/_authenticated/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Stage Planner — StageSync" },
      { name: "description", content: "Collaborative 3D stage planner for event production teams." },
      { property: "og:title", content: "Stage Planner — StageSync" },
      { property: "og:description", content: "Plan stage, lighting, sound, LED and props in one shared 3D workspace." },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      const s = useStage.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void s.save();
      } else if (e.key === "w") s.setTransformMode("translate");
      else if (e.key === "e") s.setTransformMode("rotate");
      else if (e.key === "r") s.setTransformMode("scale");
      else if (e.key === "Escape") s.select(null);
      else if ((e.key === "Delete" || e.key === "Backspace") && s.selectedId) s.deleteObject(s.selectedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <TopBar />
      <AssetToolbar />
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 bg-viewport">
          <StageViewport />
          <div className="pointer-events-none absolute left-2 top-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
            <div>LMB orbit · RMB pan · Wheel zoom</div>
            <div>W move · E rotate · R scale · Del delete</div>
          </div>
        </div>
        <Inspector />
      </div>
      <div className="h-[184px] shrink-0 border-t border-border">
        <Timeline />
      </div>
    </div>
  );
}
