import { useEffect, useState } from "react";
import { Pencil, MessageSquare, Trash2, Check } from "lucide-react";
import { useStage, type Department, type Status, type Vec3 } from "@/lib/stage-store";
import { useNotifications, timeAgo } from "@/lib/notifications";

const DEPTS: Department[] = ["Stage", "Lighting", "Sound", "LED Screen", "Props"];
const STATUSES: Status[] = ["Draft", "In Review", "Approved", "Changes Requested"];

export const STATUS_CLS: Record<Status, string> = {
  Draft: "text-muted-foreground border-border",
  "In Review": "text-info border-info/40",
  Approved: "text-success border-success/40",
  "Changes Requested": "text-warning border-warning/40",
};

function NumField({ label, value, onCommit, step = 0.1 }: { label: string; value: number; onCommit: (n: number) => void; step?: number }) {
  const [v, setV] = useState(value.toFixed(2));
  useEffect(() => setV(value.toFixed(2)), [value]);
  const commit = () => {
    const n = parseFloat(v);
    if (!Number.isNaN(n) && n !== value) onCommit(n);
    else setV(value.toFixed(2));
  };
  return (
    <label className="flex items-center gap-1">
      <span className="w-3 font-mono text-[10px] text-muted-foreground">{label}</span>
      <input
        className="field"
        type="number"
        step={step}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-3 py-2.5">
      <div className="panel-label mb-1.5">{title}</div>
      {children}
    </div>
  );
}

export function StageSettings() {
  const dims = useStage((s) => s.dims);
  const setDims = useStage((s) => s.setDims);
  return (
    <Section title="Stage Dimensions (m)">
      <div className="grid grid-cols-3 gap-1.5">
        {(["width", "depth", "height"] as const).map((k) => (
          <div key={k}>
            <div className="mb-0.5 text-[10px] capitalize text-muted-foreground">{k}</div>
            <NumField
              label={k.charAt(0).toUpperCase()}
              value={dims[k]}
              step={k === "height" ? 0.1 : 0.5}
              onCommit={(n) => {
                const min = k === "height" ? 0.1 : 2;
                const max = k === "height" ? 3 : 40;
                setDims({ [k]: Math.min(max, Math.max(min, n)) });
              }}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Inspector() {
  const obj = useStage((s) => s.objects.find((o) => o.id === s.selectedId));
  const update = useStage((s) => s.updateObject);
  const del = useStage((s) => s.deleteObject);
  const addComment = useStage((s) => s.addComment);
  const objects = useStage((s) => s.objects);
  const select = useStage((s) => s.select);
  const push = useNotifications((s) => s.push);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setEditing(false);
    setCommenting(false);
    setName(obj?.name ?? "");
  }, [obj?.id]);

  return (
    <aside className="flex w-[264px] shrink-0 flex-col overflow-y-auto border-l border-border bg-panel">
      <div className="flex h-8 shrink-0 items-center border-b border-border px-3">
        <span className="panel-label">Properties</span>
      </div>
      {!obj ? (
        <>
          <StageSettings />
          <Section title={`Scene Objects (${objects.length})`}>
            <div className="-mx-1 flex flex-col">
              {objects.map((o) => (
                <button
                  key={o.id}
                  onClick={() => select(o.id)}
                  className="flex h-6 items-center justify-between rounded-sm px-1 text-left text-xs hover:bg-secondary"
                >
                  <span className="truncate">{o.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{o.department}</span>
                </button>
              ))}
            </div>
          </Section>
          <div className="px-3 py-2 text-[11px] text-muted-foreground">Click an object in the viewport to inspect it.</div>
        </>
      ) : (
        <>
          <Section title="Selected Object">
            {editing ? (
              <div className="flex gap-1">
                <input className="field font-sans" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <button
                  className="btn-primary px-2"
                  onClick={() => {
                    if (name.trim()) update(obj.id, { name: name.trim() });
                    setEditing(false);
                  }}
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="text-sm font-medium">{obj.name}</div>
            )}
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {obj.type.toUpperCase()} · {obj.id}
            </div>
          </Section>
          <Section title="Department">
            <select className="field font-sans" value={obj.department} onChange={(e) => update(obj.id, { department: e.target.value as Department })}>
              {DEPTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Section>
          <Section title="Position (m)">
            <div className="grid grid-cols-3 gap-1">
              {(["X", "Y", "Z"] as const).map((l, i) => (
                <NumField
                  key={l}
                  label={l}
                  value={obj.position[i] ?? 0}
                  onCommit={(n) => {
                    const p = [...obj.position] as Vec3;
                    p[i] = n;
                    update(obj.id, { position: p });
                  }}
                />
              ))}
            </div>
          </Section>
          <Section title="Rotation (°)">
            <div className="grid grid-cols-3 gap-1">
              {(["X", "Y", "Z"] as const).map((l, i) => (
                <NumField
                  key={l}
                  label={l}
                  step={5}
                  value={obj.rotation[i] ?? 0}
                  onCommit={(n) => {
                    const r = [...obj.rotation] as Vec3;
                    r[i] = n;
                    update(obj.id, { rotation: r });
                  }}
                />
              ))}
            </div>
          </Section>
          <Section title="Scale">
            <NumField label="S" value={obj.scale} onCommit={(n) => update(obj.id, { scale: Math.max(0.1, Math.min(5, n)) })} />
          </Section>
          <Section title="Status">
            <select
              className={`field font-sans ${STATUS_CLS[obj.status]}`}
              value={obj.status}
              onChange={(e) => {
                const status = e.target.value as Status;
                update(obj.id, { status });
                push({ title: `Status → ${status}`, body: obj.name, dept: obj.department });
              }}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Section>
          <Section title="Owner">
            <input
              className="field font-sans"
              defaultValue={obj.owner}
              key={obj.id}
              onBlur={(e) => e.target.value !== obj.owner && update(obj.id, { owner: e.target.value })}
            />
          </Section>
          <div className="flex gap-1.5 border-b border-border px-3 py-2.5">
            <button className="btn flex-1" data-active={editing} onClick={() => setEditing((v) => !v)}>
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button className="btn flex-1" onClick={() => setCommenting((v) => !v)}>
              <MessageSquare className="h-3 w-3" /> Comment
            </button>
            <button className="btn-danger flex-1" onClick={() => del(obj.id)}>
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
          <Section title={`Comments (${obj.comments.length})`}>
            {commenting && (
              <div className="mb-2 flex flex-col gap-1">
                <textarea
                  className="field h-16 resize-none py-1 font-sans"
                  placeholder="Add a note for the team…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  autoFocus
                />
                <button
                  className="btn-primary self-end"
                  disabled={!comment.trim()}
                  onClick={() => {
                    addComment(obj.id, comment.trim());
                    push({ title: "New comment", body: `${obj.name}: ${comment.trim()}`, dept: obj.department });
                    setComment("");
                    setCommenting(false);
                  }}
                >
                  Post
                </button>
              </div>
            )}
            {obj.comments.length === 0 && !commenting && <div className="text-[11px] text-muted-foreground">No comments yet.</div>}
            {obj.comments.map((c) => (
              <div key={c.id} className="mb-1.5 border-l-2 border-primary/50 pl-2">
                <div className="text-xs">{c.text}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {c.author} · {timeAgo(c.at)}
                </div>
              </div>
            ))}
          </Section>
        </>
      )}
    </aside>
  );
}
