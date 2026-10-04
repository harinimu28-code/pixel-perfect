import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { create } from "zustand";
import { PageHeader } from "@/components/shell/Sidebar";
import type { Department } from "@/lib/stage-store";

export const Route = createFileRoute("/requirements")({
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

interface Req { id: string; dept: Department; text: string; done: boolean }
const DEPTS: Department[] = ["Stage", "Lighting", "Sound", "LED Screen", "Props"];

const useReqs = create<{ items: Req[]; toggle: (id: string) => void; add: (r: Omit<Req, "id" | "done">) => void; remove: (id: string) => void }>((set) => ({
  items: [
    { id: "r1", dept: "Stage", text: "12×8 m deck at 0.6 m height, black marley finish", done: true },
    { id: "r2", dept: "Stage", text: "Wheelchair ramp stage-left, 1:12 gradient", done: false },
    { id: "r3", dept: "Lighting", text: "2× moving heads on downstage edge, DMX universe 1", done: true },
    { id: "r4", dept: "Lighting", text: "Front truss warm wash, 6× LED pars", done: false },
    { id: "r5", dept: "Sound", text: "L/R mains + 2 wireless lapel, 1 podium mic", done: false },
    { id: "r6", dept: "LED Screen", text: "6×3.4 m LED wall, P3.9, 16:9 input via HDMI", done: true },
    { id: "r7", dept: "Props", text: "2× decorative pillars with floral urns", done: false },
  ],
  toggle: (id) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
  add: (r) => set((s) => ({ items: [...s.items, { ...r, id: Math.random().toString(36).slice(2), done: false }] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

function Requirements() {
  const { items, toggle, add, remove } = useReqs();
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
