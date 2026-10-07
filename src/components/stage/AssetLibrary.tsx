import { useEffect, useRef, useState } from "react";
import { Library, Upload, Trash2, Plus, X, Box, FileBox, RotateCcw } from "lucide-react";
import { useStage, type AssetType } from "@/lib/stage-store";
import {
  useLibrary, isSupported, formatBytes, MAX_BYTES, CATEGORIES, UPLOAD_DEPTS, toStageDept, extOf,
} from "@/lib/asset-library";

export const BUILTIN_CATALOG: { category: string; items: { type: AssetType; label: string }[] }[] = [
  { category: "Stage", items: [
    { type: "podium", label: "Podium" }, { type: "steps", label: "Stage Steps" },
    { type: "backdrop", label: "Backdrop" }, { type: "truss", label: "Truss" }, { type: "stage", label: "Riser" },
  ] },
  { category: "Seating & Furniture", items: [
    { type: "chair", label: "Chair" }, { type: "table", label: "Table" },
    { type: "sofa", label: "Sofa" }, { type: "stool", label: "High Stool" },
  ] },
  { category: "Lighting", items: [
    { type: "spot", label: "Spot Light" }, { type: "light", label: "Moving Head" },
    { type: "ledbar", label: "LED Bar" }, { type: "floorlight", label: "Floor Light" },
  ] },
  { category: "Sound", items: [
    { type: "speaker", label: "Speaker" }, { type: "sub", label: "Subwoofer" },
    { type: "mic", label: "Microphone" }, { type: "stand", label: "Speaker Stand" },
  ] },
  { category: "Screens", items: [
    { type: "led", label: "Main LED Screen" }, { type: "sideled", label: "Side LED Screen" }, { type: "panel", label: "Display Panel" },
  ] },
  { category: "Props", items: [
    { type: "plant", label: "Plant" }, { type: "vase", label: "Decorative Vase" },
    { type: "guitar", label: "Guitar" }, { type: "drum", label: "Drum" }, { type: "prop", label: "Pillar" },
  ] },
];

export function AssetLibraryButton() {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!importing && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open, importing]);
  return (
    <div ref={ref} className="relative">
      <button className="tool-btn" data-active={open} onClick={() => setOpen((o) => !o)} title="Asset Library">
        <Library className="h-3.5 w-3.5" /> Library
      </button>
      {open && <LibraryPanel onImport={() => setImporting(true)} onClose={() => setOpen(false)} />}
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </div>
  );
}

function LibraryPanel({ onImport, onClose }: { onImport: () => void; onClose: () => void }) {
  const add = useStage((s) => s.addObject);
  const addCustom = useStage((s) => s.addCustomObject);
  const { assets, loaded, error, remove } = useLibrary();
  const [busy, setBusy] = useState<string | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  return (
    <div className="absolute left-0 top-8 z-40 flex max-h-[70vh] w-80 flex-col overflow-hidden border border-border bg-panel shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="panel-label">Add Asset</span>
        <button className="text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Close library">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="overflow-auto">
        <div className="border-b border-border p-3">
          <button className="btn-primary w-full justify-center" onClick={onImport}>
            <Upload className="h-3 w-3" /> Import Asset
          </button>
        </div>

        <div className="border-b border-border">
          <div className="panel-label px-3 pt-2.5">My Assets</div>
          {!loaded && <p className="px-3 py-2 text-[11px] text-muted-foreground">Loading…</p>}
          {error && <p className="px-3 py-2 text-[11px] text-destructive">Could not load your assets: {error}</p>}
          {loaded && !error && !assets.length && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground">No imported assets yet. Import a GLB, GLTF or OBJ file.</p>
          )}
          <ul className="py-1">
            {assets.map((a) => (
              <li key={a.id} className="group flex items-center gap-2 px-3 py-1.5 hover:bg-panel-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-background">
                  <FileBox className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs">{a.name}</div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">
                    {a.fileType} · {a.category} · {formatBytes(a.sizeBytes)}
                  </div>
                </div>
                <button
                  className="tool-btn"
                  aria-label={`Add ${a.name}`}
                  onClick={() => addCustom({ id: a.id, name: a.name, department: toStageDept(a.department) })}
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
                <button
                  className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100 disabled:opacity-40"
                  aria-label={`Delete ${a.name} from library`}
                  disabled={busy === a.id}
                  onClick={async () => {
                    if (!confirm(`Remove "${a.name}" from the library? Placed copies will show as missing.`)) return;
                    setBusy(a.id);
                    setDelErr(null);
                    try {
                      await remove(a.id);
                    } catch (e) {
                      setDelErr(e instanceof Error ? e.message : "Delete failed");
                    }
                    setBusy(null);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
          {delErr && <p className="px-3 pb-2 text-[11px] text-destructive">{delErr}</p>}
        </div>

        <div className="panel-label px-3 pt-2.5">Built-in Assets</div>
        {BUILTIN_CATALOG.map((g) => (
          <div key={g.category} className="px-3 py-1.5">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{g.category}</div>
            <div className="grid grid-cols-2 gap-1">
              {g.items.map((it) => (
                <button key={it.type} className="tool-btn justify-start" onClick={() => add(it.type, it.label)}>
                  <Box className="h-3 w-3" /> {it.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="h-2" />
      </div>
    </div>
  );
}

type Phase = "idle" | "uploading" | "error";

function ImportDialog({ onClose }: { onClose: () => void }) {
  const upload = useLibrary((s) => s.upload);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Custom");
  const [dept, setDept] = useState<string>("Design");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const pick = (f: File | undefined) => {
    setMsg(null);
    setPhase("idle");
    if (!f) return;
    if (!isSupported(f.name)) {
      setFile(null);
      setMsg("Unsupported file type. Please upload a GLB or GLTF 3D model.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      setMsg(`File is too large (max ${formatBytes(MAX_BYTES)}).`);
      return;
    }
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  };

  const go = async () => {
    if (!file || !name.trim()) return;
    setPhase("uploading");
    setProgress(0);
    setMsg(null);
    try {
      await upload(file, { name: name.trim(), category, department: dept }, setProgress);
      onClose();
    } catch (e) {
      setPhase("error");
      setMsg(e instanceof Error ? e.message : "Upload failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70" role="dialog" aria-label="Import 3D Asset">
      <div className="w-[420px] border border-border bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-sm font-medium">Import 3D Asset</span>
          <button className="text-muted-foreground hover:text-foreground" onClick={onClose} disabled={phase === "uploading"} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-[11px] text-muted-foreground">
            Supported formats: <span className="font-mono">GLB, GLTF, OBJ</span> · up to {formatBytes(MAX_BYTES)}. GLTF files must have
            textures and buffers embedded.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.gltf,.obj"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <button className="btn w-fit" onClick={() => inputRef.current?.click()} disabled={phase === "uploading"}>
            <FileBox className="h-3 w-3" /> Choose File
          </button>

          {file && (
            <div className="border border-border bg-background px-3 py-2">
              <div className="truncate text-xs">{file.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {extOf(file.name).toUpperCase()} · {formatBytes(file.size)}
              </div>
              {phase !== "idle" && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-panel-2">
                    <div className="h-1 bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {phase === "uploading" ? (progress < 100 ? `Uploading… ${progress}%` : "Saving to library…") : "Upload failed"}
                  </div>
                </div>
              )}
            </div>
          )}

          {msg && <p className="text-[11px] text-destructive" role="alert">{msg}</p>}

          {file && (
            <>
              <label className="flex flex-col gap-1">
                <span className="panel-label">Display name</span>
                <input className="field font-sans" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="panel-label">Category</span>
                  <select className="field font-sans" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="panel-label">Department</span>
                  <select className="field font-sans" value={dept} onChange={(e) => setDept(e.target.value)}>
                    {UPLOAD_DEPTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </label>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-2.5">
          <button className="btn" onClick={onClose} disabled={phase === "uploading"}>Cancel</button>
          <button className="btn-primary" onClick={go} disabled={!file || !name.trim() || phase === "uploading"}>
            {phase === "error" ? <><RotateCcw className="h-3 w-3" /> Retry</> : <><Upload className="h-3 w-3" /> Upload Asset</>}
          </button>
        </div>
      </div>
    </div>
  );
}
