import {
  Undo2, Redo2, Save, Send, MousePointer2, Square, Monitor, Mic2, Speaker, Lightbulb, Armchair, Flower2,
  Move3d, Rotate3d, Scaling, Grid3x3, Box, ArrowDownToLine, Eye, PanelTop,
} from "lucide-react";
import { useStage, type AssetType, type CameraView } from "@/lib/stage-store";
import { useNotifications, timeAgo } from "@/lib/notifications";

export function TopBar() {
  const s = useStage();
  const push = useNotifications((n) => n.push);
  const drafts = s.objects.filter((o) => o.status === "Draft");
  const views: { v: CameraView; label: string; icon: typeof Box }[] = [
    { v: "perspective", label: "Persp", icon: Box },
    { v: "top", label: "Top", icon: ArrowDownToLine },
    { v: "front", label: "Front", icon: Eye },
    { v: "side", label: "Side", icon: PanelTop },
  ];
  return (
    <header className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-panel px-3">
      <div className="mr-3 flex flex-col leading-tight">
        <span className="text-[13px] font-semibold">{s.projectName}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {s.saved ? (
            <span className="text-success">● Saved{s.lastSavedAt ? ` · ${timeAgo(s.lastSavedAt)}` : ""}</span>
          ) : (
            <span className="text-warning">● Unsaved changes</span>
          )}
        </span>
      </div>
      <div className="mx-1 h-5 w-px bg-border" />
      <button className="tool-btn" onClick={s.undo} disabled={!s.past.length} title="Undo (Ctrl+Z)">
        <Undo2 className="h-3.5 w-3.5" /> Undo
      </button>
      <button className="tool-btn" onClick={s.redo} disabled={!s.future.length} title="Redo (Ctrl+Shift+Z)">
        <Redo2 className="h-3.5 w-3.5" /> Redo
      </button>
      <div className="mx-1 h-5 w-px bg-border" />
      <span className="panel-label mx-1">View</span>
      {views.map(({ v, label, icon: I }) => (
        <button key={v} className="tool-btn" data-active={s.cameraView === v} onClick={() => s.setCameraView(v)}>
          <I className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
      <button className="tool-btn" data-active={s.showGrid} onClick={s.toggleGrid} title="Toggle grid">
        <Grid3x3 className="h-3.5 w-3.5" /> Grid
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          className="btn"
          disabled={!drafts.length}
          title="Submit all draft objects for department review"
          onClick={() => {
            drafts.forEach((d) => s.updateObject(d.id, { status: "In Review" }));
            push({ title: "Submitted for review", body: `${drafts.length} draft object(s) sent to review.`, dept: "Production" });
          }}
        >
          <Send className="h-3 w-3" /> Review{drafts.length ? ` (${drafts.length})` : ""}
        </button>
        <button className="btn-primary" onClick={s.save} title="Save (Ctrl+S)">
          <Save className="h-3 w-3" /> Save
        </button>
      </div>
    </header>
  );
}

const ASSETS: { type: AssetType; label: string; icon: typeof Box }[] = [
  { type: "stage", label: "Stage", icon: Square },
  { type: "led", label: "LED Screen", icon: Monitor },
  { type: "podium", label: "Podium", icon: Mic2 },
  { type: "speaker", label: "Speaker", icon: Speaker },
  { type: "light", label: "Light", icon: Lightbulb },
  { type: "chair", label: "Chair", icon: Armchair },
  { type: "prop", label: "Prop", icon: Flower2 },
];

export function AssetToolbar() {
  const add = useStage((s) => s.addObject);
  const mode = useStage((s) => s.transformMode);
  const setMode = useStage((s) => s.setTransformMode);
  const select = useStage((s) => s.select);
  const selectedId = useStage((s) => s.selectedId);
  return (
    <div className="flex h-9 shrink-0 items-center gap-0.5 border-b border-border bg-panel-2 px-2">
      <button className="tool-btn" data-active={!selectedId} onClick={() => select(null)} title="Select (Esc clears)">
        <MousePointer2 className="h-3.5 w-3.5" /> Select
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <span className="panel-label mx-1">Add</span>
      {ASSETS.map(({ type, label, icon: I }) => (
        <button key={type} className="tool-btn" onClick={() => add(type)} title={`Add ${label}`}>
          <I className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-0.5">
        <span className="panel-label mx-1">Transform</span>
        <button className="tool-btn" data-active={mode === "translate"} onClick={() => setMode("translate")} title="Move (W)">
          <Move3d className="h-3.5 w-3.5" /> Move
        </button>
        <button className="tool-btn" data-active={mode === "rotate"} onClick={() => setMode("rotate")} title="Rotate (E)">
          <Rotate3d className="h-3.5 w-3.5" /> Rotate
        </button>
        <button className="tool-btn" data-active={mode === "scale"} onClick={() => setMode("scale")} title="Scale (R)">
          <Scaling className="h-3.5 w-3.5" /> Scale
        </button>
      </div>
    </div>
  );
}
