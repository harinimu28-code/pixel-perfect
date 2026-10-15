import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/shell/Sidebar";
import { useStage, type Department } from "@/lib/stage-store";

export const Route = createFileRoute("/_authenticated/requirements")({
  head: () => ({
    meta: [
      { title: "Requirements — StageSync" },
      { name: "description", content: "Technical requirements per department for the event." },
      { property: "og:title", content: "Requirements — StageSync" },
      { property: "og:description", content: "Track stage, lighting, sound, LED and props requirements." },
    ],
  }),
  component: Requirements,
});

const DEPTS: Department[] = ["Stage", "Lighting", "Sound", "LED Screen", "Props"];

function Requirements() {
  const items = useStage((s) => s.requirements);
  const toggle = useStage((s) => s.toggleRequirement);
  const add = useStage((s) => s.addRequirement);
  const remove = useStage((s) => s.removeRequirement);
  const save = useStage((s) => s.save);
  const saved = useStage((s) => s.saved);
  const [dept, setDept] = useState<Department>("Stage");
  const [text, setText] = useState("");
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <PageHeader title="Requirements" sub={`${items.filter((i) => i.done).length}/${items.length} confirmed`} />
      <div className="flex flex-col gap-4 overflow-auto p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            add({ dept, text: text.trim() });
            setText("");
          }}
        >
          <select className="field w-36 font-sans" value={dept} onChange={(e) => setDept(e.target.value as Department)}>
            {DEPTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <input className="field flex-1 font-sans" placeholder="New requirement…" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-primary">Add</button>
          <button type="button" className="btn" disabled={saved} onClick={() => void save()}>{saved ? "Saved" : "Save"}</button>
        </form>
        {DEPTS.map((d) => (
          <section key={d} className="border border-border">
            <div className="panel-label border-b border-border bg-panel px-3 py-1.5">{d}</div>
            {items.filter((i) => i.dept === d).map((i) => (
              <div key={i.id} className="group flex items-center gap-3 border-b border-border/60 px-3 py-2 last:border-0">
                <input type="checkbox" className="accent-primary" checked={i.done} onChange={() => toggle(i.id)} />
                <span className={`flex-1 text-xs ${i.done ? "text-muted-foreground line-through" : ""}`}>{i.text}</span>
                <button className="text-[10px] text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100" onClick={() => remove(i.id)}>Remove</button>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
