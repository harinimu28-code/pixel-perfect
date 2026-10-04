import { supabase } from "@/integrations/supabase/client";
import type { AssetType, Department, Requirement, StageDims, StageObject, Status, TimelineEvent } from "./stage-store";

export const PROJECT_ID = "annual-cultural-event-2026";

export interface ProjectData {
  name: string;
  dims: StageDims;
  objects: StageObject[];
  timeline: TimelineEvent[];
  requirements: Requirement[];
  updatedAt: string;
}

const chk = <T,>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

export async function saveProjectToDb(d: Omit<ProjectData, "updatedAt">): Promise<string> {
  const at = new Date().toISOString();
  chk(await supabase.from("projects").upsert({
    id: PROJECT_ID, name: d.name, stage_width: d.dims.width, stage_depth: d.dims.depth,
    stage_height: d.dims.height, updated_at: at,
  }));
  // Replace children: deleting objects cascades their comments.
  for (const t of ["comments", "stage_objects", "timeline_events", "requirements"] as const) {
    chk(await supabase.from(t).delete().eq("project_id", PROJECT_ID));
  }
  if (d.objects.length)
    chk(await supabase.from("stage_objects").insert(d.objects.map((o, i) => ({
      id: o.id, project_id: PROJECT_ID, asset_name: o.name, asset_type: o.type, department: o.department,
      position_x: o.position[0], position_y: o.position[1], position_z: o.position[2],
      rotation_x: o.rotation[0], rotation_y: o.rotation[1], rotation_z: o.rotation[2],
      scale_x: o.scale, scale_y: o.scale, scale_z: o.scale,
      status: o.status, owner: o.owner, sort_order: i, updated_at: at,
    }))));
  const comments = d.objects.flatMap((o) => o.comments.map((c) => ({
    id: c.id, project_id: PROJECT_ID, object_id: o.id, author: c.author, message: c.text, status: "Open", created_at: c.at,
  })));
  if (comments.length) chk(await supabase.from("comments").insert(comments));
  if (d.timeline.length)
    chk(await supabase.from("timeline_events").insert(d.timeline.map((e) => ({
      id: e.id, project_id: PROJECT_ID, event_time: e.start, end_time: e.end, department: e.track,
      action: e.label, value: String(e.end - e.start), updated_at: at,
    }))));
  if (d.requirements.length)
    chk(await supabase.from("requirements").insert(d.requirements.map((r, i) => ({
      id: r.id, project_id: PROJECT_ID, name: r.text, department: r.dept, owner: r.owner ?? null,
      priority: r.priority ?? "Medium", status: r.done ? "Done" : "Open", due_date: r.dueDate ?? null,
      sort_order: i, updated_at: at,
    }))));
  return at;
}

export async function loadProjectFromDb(): Promise<ProjectData | null> {
  const p = chk(await supabase.from("projects").select("*").eq("id", PROJECT_ID).maybeSingle());
  if (!p) return null;
  const [objs, cmts, evts, reqs] = await Promise.all([
    supabase.from("stage_objects").select("*").eq("project_id", PROJECT_ID).order("sort_order"),
    supabase.from("comments").select("*").eq("project_id", PROJECT_ID).order("created_at"),
    supabase.from("timeline_events").select("*").eq("project_id", PROJECT_ID).order("event_time"),
    supabase.from("requirements").select("*").eq("project_id", PROJECT_ID).order("sort_order"),
  ]);
  const comments = chk(cmts);
  return {
    name: p.name,
    dims: { width: p.stage_width, depth: p.stage_depth, height: p.stage_height },
    updatedAt: p.updated_at,
    objects: chk(objs).map((o) => ({
      id: o.id, name: o.asset_name, type: o.asset_type as AssetType, department: o.department as Department,
      position: [o.position_x, o.position_y, o.position_z],
      rotation: [o.rotation_x, o.rotation_y, o.rotation_z],
      scale: o.scale_x, status: o.status as Status, owner: o.owner,
      comments: comments.filter((c) => c.object_id === o.id).map((c) => ({ id: c.id, text: c.message, author: c.author, at: c.created_at })),
    })),
    timeline: chk(evts).map((e) => ({ id: e.id, track: e.department as Department, label: e.action, start: e.event_time, end: e.end_time })),
    requirements: chk(reqs).map((r) => ({
      id: r.id, dept: r.department as Department, text: r.name, done: r.status === "Done",
      owner: r.owner, priority: r.priority, dueDate: r.due_date,
    })),
  };
}
