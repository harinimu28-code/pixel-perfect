import { create } from "zustand";
import { loadProjectFromDb, saveProjectToDb } from "./stage-db";

export type AssetType =
  | "stage" | "led" | "podium" | "speaker" | "light" | "chair" | "prop"
  | "steps" | "backdrop" | "truss" | "table" | "sofa" | "stool" | "spot" | "ledbar" | "floorlight"
  | "sub" | "mic" | "stand" | "sideled" | "panel" | "plant" | "vase" | "guitar" | "drum"
  | "custom";
export type Department = "Stage" | "Lighting" | "Sound" | "LED Screen" | "Props" | "Design";
export type Status = "Draft" | "In Review" | "Approved" | "Changes Requested";
export type Vec3 = [number, number, number];

export interface StageComment {
  id: string;
  text: string;
  author: string;
  at: string;
}

export interface StageObject {
  id: string;
  name: string;
  type: AssetType;
  department: Department;
  position: Vec3;
  rotation: Vec3; // degrees
  scale: number;
  status: Status;
  owner: string;
  comments: StageComment[];
  /** Asset library item this instance was placed from (imported models only). */
  assetId?: string | null | undefined;
}

export interface StageDims {
  width: number;
  depth: number;
  height: number;
}

export type TransformMode = "translate" | "rotate" | "scale";
export type CameraView = "perspective" | "top" | "front" | "side";

export interface Requirement {
  id: string;
  dept: Department;
  text: string;
  done: boolean;
  owner?: string | null | undefined;
  priority?: string | undefined;
  dueDate?: string | null | undefined;
}

export const DEFAULT_REQUIREMENTS: Requirement[] = [
  { id: "r1", dept: "Stage", text: "12×8 m deck at 0.6 m height, black marley finish", done: true },
  { id: "r2", dept: "Stage", text: "Wheelchair ramp stage-left, 1:12 gradient", done: false },
  { id: "r3", dept: "Lighting", text: "2× moving heads on downstage edge, DMX universe 1", done: true },
  { id: "r4", dept: "Lighting", text: "Front truss warm wash, 6× LED pars", done: false },
  { id: "r5", dept: "Sound", text: "L/R mains + 2 wireless lapel, 1 podium mic", done: false },
  { id: "r6", dept: "LED Screen", text: "6×3.4 m LED wall, P3.9, 16:9 input via HDMI", done: true },
  { id: "r7", dept: "Props", text: "2× decorative pillars with floral urns", done: false },
];

interface Snapshot {
  objects: StageObject[];
  dims: StageDims;
}

export const ASSET_DEFAULTS: Record<AssetType, { label: string; department: Department; owner: string; y: number }> = {
  stage: { label: "Riser", department: "Stage", owner: "Stage Team", y: 0 },
  led: { label: "LED Screen", department: "LED Screen", owner: "Video Team", y: 0 },
  podium: { label: "Podium", department: "Stage", owner: "Stage Team", y: 0 },
  speaker: { label: "Speaker", department: "Sound", owner: "Audio Team", y: 0 },
  light: { label: "Moving Head Light", department: "Lighting", owner: "Lighting Team", y: 0 },
  chair: { label: "Chair", department: "Stage", owner: "Stage Team", y: 0 },
  prop: { label: "Prop", department: "Props", owner: "Props Team", y: 0 },
  steps: { label: "Stage Steps", department: "Stage", owner: "Stage Team", y: 0 },
  backdrop: { label: "Backdrop", department: "Stage", owner: "Stage Team", y: 0 },
  truss: { label: "Truss", department: "Stage", owner: "Stage Team", y: 0 },
  table: { label: "Table", department: "Props", owner: "Props Team", y: 0 },
  sofa: { label: "Sofa", department: "Props", owner: "Props Team", y: 0 },
  stool: { label: "High Stool", department: "Props", owner: "Props Team", y: 0 },
  spot: { label: "Spot Light", department: "Lighting", owner: "Lighting Team", y: 0 },
  ledbar: { label: "LED Bar", department: "Lighting", owner: "Lighting Team", y: 0 },
  floorlight: { label: "Floor Light", department: "Lighting", owner: "Lighting Team", y: 0 },
  sub: { label: "Subwoofer", department: "Sound", owner: "Audio Team", y: 0 },
  mic: { label: "Microphone", department: "Sound", owner: "Audio Team", y: 0 },
  stand: { label: "Speaker Stand", department: "Sound", owner: "Audio Team", y: 0 },
  sideled: { label: "Side LED Screen", department: "LED Screen", owner: "Video Team", y: 0 },
  panel: { label: "Display Panel", department: "LED Screen", owner: "Video Team", y: 0 },
  plant: { label: "Plant", department: "Props", owner: "Props Team", y: 0 },
  vase: { label: "Decorative Vase", department: "Props", owner: "Props Team", y: 0 },
  guitar: { label: "Guitar", department: "Props", owner: "Props Team", y: 0 },
  drum: { label: "Drum", department: "Props", owner: "Props Team", y: 0 },
  custom: { label: "Imported Asset", department: "Design", owner: "Design Team", y: 0 },
};

const uid = () => Math.random().toString(36).slice(2, 10);

const o = (
  name: string,
  type: AssetType,
  position: Vec3,
  status: Status,
  extra: Partial<StageObject> = {},
): StageObject => ({
  id: uid(),
  name,
  type,
  department: ASSET_DEFAULTS[type].department,
  owner: ASSET_DEFAULTS[type].owner,
  position,
  rotation: [0, 0, 0],
  scale: 1,
  status,
  comments: [],
  ...extra,
});

export const DEMO_OBJECTS: StageObject[] = [
  o("Main LED Screen", "led", [0, 0.6, -3.4], "Approved"),
  o("Left Speaker", "speaker", [-5, 0.6, -1.5], "Approved", { rotation: [0, 15, 0] }),
  o("Right Speaker", "speaker", [5, 0.6, -1.5], "In Review", { rotation: [0, -15, 0] }),
  o("Moving Head Light 01", "light", [-3, 0.6, 1.8], "Approved"),
  o("Moving Head Light 02", "light", [3, 0.6, 1.8], "Changes Requested"),
  o("Presenter Podium", "podium", [3.2, 0.6, 0.2], "Approved", { rotation: [0, -20, 0] }),
  o("Chair 01", "chair", [-2.2, 0.6, 0.4], "Draft", { rotation: [0, 20, 0] }),
  o("Chair 02", "chair", [-1.2, 0.6, 0.6], "Draft", { rotation: [0, 10, 0] }),
  o("Chair 03", "chair", [-0.2, 0.6, 0.7], "Draft"),
  o("Backdrop Prop A", "prop", [-4.6, 0.6, -2.8], "In Review"),
  o("Backdrop Prop B", "prop", [4.6, 0.6, -2.8], "Draft"),
];

const DEFAULT_DIMS: StageDims = { width: 12, depth: 8, height: 0.6 };
const STORAGE_KEY = "stagesync:annual-cultural-event-2026";

interface StageState {
  projectName: string;
  objects: StageObject[];
  dims: StageDims;
  selectedId: string | null;
  transformMode: TransformMode;
  cameraView: CameraView;
  cameraNonce: number;
  showGrid: boolean;
  saved: boolean;
  lastSavedAt: string | null;
  past: Snapshot[];
  future: Snapshot[];
  playhead: number; // minutes
  timelineEvents: TimelineEvent[];
  requirements: Requirement[];
  saving: boolean;
  saveError: string | null;
  loaded: boolean;
  toggleRequirement: (id: string) => void;
  addRequirement: (r: { dept: Department; text: string }) => void;
  removeRequirement: (id: string) => void;
  select: (id: string | null) => void;
  setTransformMode: (m: TransformMode) => void;
  setCameraView: (v: CameraView) => void;
  toggleGrid: () => void;
  addObject: (type: AssetType, label?: string) => void;
  addCustomObject: (asset: { id: string; name: string; department: Department }) => void;
  updateObject: (id: string, patch: Partial<StageObject>) => void;
  deleteObject: (id: string) => void;
  addComment: (id: string, text: string) => void;
  setDims: (d: Partial<StageDims>) => void;
  undo: () => void;
  redo: () => void;
  save: () => Promise<void>;
  load: () => Promise<void>;
  setPlayhead: (t: number) => void;
}

/* ---------- Timeline demo data ---------- */
export const TIMELINE_LENGTH = 120; // minutes
export interface TimelineEvent {
  id: string;
  track: Department;
  label: string;
  start: number;
  end: number;
}
export const TRACKS: Department[] = ["Stage", "Lighting", "Sound", "LED Screen", "Props"];
export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: "e1", track: "Stage", label: "Doors / Preset", start: 0, end: 10 },
  { id: "e2", track: "Stage", label: "Welcome Address", start: 10, end: 25 },
  { id: "e3", track: "Stage", label: "Classical Dance", start: 25, end: 55 },
  { id: "e4", track: "Stage", label: "Awards", start: 60, end: 90 },
  { id: "e5", track: "Stage", label: "Finale", start: 95, end: 120 },
  { id: "e6", track: "Lighting", label: "Warm Wash", start: 0, end: 25 },
  { id: "e7", track: "Lighting", label: "Chase FX", start: 25, end: 55 },
  { id: "e8", track: "Lighting", label: "Spot Podium", start: 60, end: 90 },
  { id: "e9", track: "Lighting", label: "Strobe Finale", start: 95, end: 120 },
  { id: "e10", track: "Sound", label: "Walk-in Playlist", start: 0, end: 10 },
  { id: "e11", track: "Sound", label: "Lapel Mic", start: 10, end: 25 },
  { id: "e12", track: "Sound", label: "Playback Track", start: 25, end: 55 },
  { id: "e13", track: "Sound", label: "Podium Mic", start: 60, end: 90 },
  { id: "e14", track: "LED Screen", label: "Event Loop", start: 0, end: 25 },
  { id: "e15", track: "LED Screen", label: "Dance Visuals", start: 25, end: 55 },
  { id: "e16", track: "LED Screen", label: "Award Slides", start: 60, end: 90 },
  { id: "e17", track: "LED Screen", label: "Sponsor Reel", start: 90, end: 95 },
  { id: "e18", track: "Props", label: "Set Backdrop A", start: 20, end: 25 },
  { id: "e19", track: "Props", label: "Trophy Table", start: 58, end: 60 },
  { id: "e20", track: "Props", label: "Confetti Cue", start: 115, end: 117 },
];
export const MARKERS = [
  { t: 10, label: "Show Start" },
  { t: 57, label: "Intermission" },
  { t: 115, label: "Confetti" },
];

export const useStage = create<StageState>((set, get) => {
  const commit = (next: Partial<Snapshot>) => {
    const { objects, dims, past } = get();
    set({
      past: [...past.slice(-49), { objects, dims }],
      future: [],
      saved: false,
      ...next,
    });
  };

  return {
    projectName: "Annual Cultural Event 2026",
    objects: DEMO_OBJECTS,
    dims: DEFAULT_DIMS,
    selectedId: null,
    transformMode: "translate",
    cameraView: "perspective",
    cameraNonce: 0,
    showGrid: true,
    saved: true,
    lastSavedAt: null,
    past: [],
    future: [],
    playhead: 12,
    timelineEvents: TIMELINE_EVENTS,
    requirements: DEFAULT_REQUIREMENTS,
    saving: false,
    saveError: null,
    loaded: false,
    toggleRequirement: (id) =>
      set((s) => ({ saved: false, requirements: s.requirements.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })),
    addRequirement: (r) =>
      set((s) => ({ saved: false, requirements: [...s.requirements, { ...r, id: uid(), done: false }] })),
    removeRequirement: (id) =>
      set((s) => ({ saved: false, requirements: s.requirements.filter((r) => r.id !== id) })),
    select: (id) => set({ selectedId: id }),
    setTransformMode: (m) => set({ transformMode: m }),
    setCameraView: (v) => set((s) => ({ cameraView: v, cameraNonce: s.cameraNonce + 1 })),
    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    addObject: (type, label) => {
      const d = ASSET_DEFAULTS[type];
      const base = label ?? d.label;
      const count = get().objects.filter((x) => x.name.startsWith(base)).length + 1;
      const obj = o(`${base} ${String(count).padStart(2, "0")}`, type, [
        (Math.random() - 0.5) * 4,
        get().dims.height,
        (Math.random() - 0.5) * 2,
      ], "Draft");
      commit({ objects: [...get().objects, obj] });
      set({ selectedId: obj.id });
    },
    addCustomObject: (asset) => {
      const count = get().objects.filter((x) => x.assetId === asset.id).length + 1;
      const obj = o(`${asset.name} ${String(count).padStart(2, "0")}`, "custom", [
        (Math.random() - 0.5) * 4,
        get().dims.height,
        (Math.random() - 0.5) * 2,
      ], "Draft", { assetId: asset.id, department: asset.department, owner: "Design Team" });
      commit({ objects: [...get().objects, obj] });
      set({ selectedId: obj.id });
    },
    updateObject: (id, patch) =>
      commit({ objects: get().objects.map((x) => (x.id === id ? { ...x, ...patch } : x)) }),
    deleteObject: (id) => {
      commit({ objects: get().objects.filter((x) => x.id !== id) });
      if (get().selectedId === id) set({ selectedId: null });
    },
    addComment: (id, text) =>
      commit({
        objects: get().objects.map((x) =>
          x.id === id
            ? {
                ...x,
                comments: [
                  ...x.comments,
                  { id: uid(), text, author: "You", at: new Date().toISOString() },
                ],
              }
            : x,
        ),
      }),
    setDims: (d) => {
      const prev = get().dims;
      const dims = { ...prev, ...d };
      const dy = dims.height - prev.height;
      // keep objects resting on top of the deck when height changes
      const objects = dy
        ? get().objects.map((x) =>
            Math.abs(x.position[1] - prev.height) < 0.05
              ? { ...x, position: [x.position[0], dims.height, x.position[2]] as Vec3 }
              : x,
          )
        : get().objects;
      commit({ dims, objects });
    },
    undo: () => {
      const { past, future, objects, dims } = get();
      const prev = past[past.length - 1];
      if (!prev) return;
      set({ ...prev, past: past.slice(0, -1), future: [{ objects, dims }, ...future], saved: false });
    },
    redo: () => {
      const { past, future, objects, dims } = get();
      const next = future[0];
      if (!next) return;
      set({ ...next, future: future.slice(1), past: [...past, { objects, dims }], saved: false });
    },
    save: async () => {
      const { objects, dims, projectName, timelineEvents, requirements } = get();
      set({ saving: true, saveError: null });
      try {
        const at = await saveProjectToDb({ name: projectName, dims, objects, timeline: timelineEvents, requirements });
        set({ saved: true, lastSavedAt: at, saving: false });
      } catch (e) {
        // fallback: keep a local copy so work isn't lost
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ objects, dims, at: new Date().toISOString() }));
        set({ saving: false, saveError: e instanceof Error ? e.message : "Save failed" });
      }
    },
    load: async () => {
      try {
        const data = await loadProjectFromDb();
        if (data) {
          set({
            projectName: data.name, objects: data.objects, dims: data.dims,
            timelineEvents: data.timeline.length ? data.timeline : TIMELINE_EVENTS,
            requirements: data.requirements, lastSavedAt: data.updatedAt, saved: true,
            past: [], future: [], selectedId: null,
          });
        }
      } catch {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const data = JSON.parse(raw);
            set({ objects: data.objects, dims: data.dims, lastSavedAt: data.at, saved: true });
          }
        } catch {
          /* ignore corrupted save */
        }
      }
      set({ loaded: true });
    },
    setPlayhead: (t) => set({ playhead: Math.max(0, Math.min(TIMELINE_LENGTH, t)) }),
  };
});

