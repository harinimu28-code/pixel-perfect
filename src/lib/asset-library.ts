import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Department } from "./stage-store";

export const BUCKET = "stage-assets";
export const MAX_BYTES = 50 * 1024 * 1024;
export const SUPPORTED_EXT = ["glb", "gltf", "obj"] as const;
export type ModelExt = (typeof SUPPORTED_EXT)[number];
export const CATEGORIES = ["Stage", "Seating & Furniture", "Lighting", "Sound", "Screens", "Props", "Custom"] as const;
export const UPLOAD_DEPTS = ["Design", "Props", "Lighting", "Sound", "Screens", "Stage"] as const;

/** Upload-dialog department label → stage department. */
export const toStageDept = (d: string): Department => (d === "Screens" ? "LED Screen" : (d as Department));

export interface LibraryAsset {
  id: string;
  name: string;
  originalFilename: string;
  storagePath: string;
  fileType: ModelExt;
  category: string;
  department: string;
  sizeBytes: number;
  createdAt: string;
}

export const extOf = (filename: string) => filename.split(".").pop()?.toLowerCase() ?? "";
export const isSupported = (filename: string): boolean => (SUPPORTED_EXT as readonly string[]).includes(extOf(filename));

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`;

/* Signed URLs are cached per storage path so each model downloads once per session. */
const urlCache = new Map<string, Promise<string>>();
export function signedModelUrl(path: string): Promise<string> {
  let p = urlCache.get(path);
  if (!p) {
    p = supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 12)
      .then(({ data, error }) => {
        if (error || !data) throw new Error(error?.message ?? "No URL");
        return data.signedUrl;
      });
    p.catch(() => urlCache.delete(path));
    urlCache.set(path, p);
  }
  return p;
}

/** Upload with progress (supabase-js has no progress callback). */
function uploadWithProgress(path: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  const base = import.meta.env["VITE_SUPABASE_URL"] as string;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(safeMsg(xhr.responseText) ?? `Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
const safeMsg = (t: string) => {
  try {
    return (JSON.parse(t) as { message?: string }).message;
  } catch {
    return undefined;
  }
};

interface LibState {
  assets: LibraryAsset[];
  loaded: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  upload: (
    file: File,
    meta: { name: string; category: string; department: string },
    onProgress: (pct: number) => void,
  ) => Promise<LibraryAsset>;
  remove: (id: string) => Promise<void>;
}

export const useLibrary = create<LibState>((set, get) => ({
  assets: [],
  loaded: false,
  error: null,
  fetch: async () => {
    const { data, error } = await supabase.from("asset_library").select("*").order("created_at", { ascending: false });
    if (error) return set({ error: error.message, loaded: true });
    set({
      loaded: true,
      error: null,
      assets: data.map((r) => ({
        id: r.id, name: r.name, originalFilename: r.original_filename, storagePath: r.storage_path,
        fileType: r.file_type as ModelExt, category: r.category, department: r.department,
        sizeBytes: r.size_bytes, createdAt: r.created_at,
      })),
    });
  },
  upload: async (file, meta, onProgress) => {
    const ext = extOf(file.name);
    if (!isSupported(file.name)) throw new Error("Unsupported file type. Please upload a GLB or GLTF 3D model.");
    if (file.size > MAX_BYTES) throw new Error(`File is too large (max ${formatBytes(MAX_BYTES)}).`);
    const path = `models/${crypto.randomUUID()}.${ext}`;
    await uploadWithProgress(path, file, onProgress);
    const { data, error } = await supabase
      .from("asset_library")
      .insert({
        name: meta.name, original_filename: file.name, storage_path: path, file_url: path, file_type: ext,
        category: meta.category, department: meta.department, size_bytes: file.size,
      })
      .select()
      .single();
    if (error || !data) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(error?.message ?? "Could not save asset details");
    }
    const asset: LibraryAsset = {
      id: data.id, name: data.name, originalFilename: data.original_filename, storagePath: data.storage_path,
      fileType: ext as ModelExt, category: data.category, department: data.department,
      sizeBytes: data.size_bytes, createdAt: data.created_at,
    };
    set({ assets: [asset, ...get().assets] });
    return asset;
  },
  remove: async (id) => {
    const a = get().assets.find((x) => x.id === id);
    if (!a) return;
    const { error } = await supabase.from("asset_library").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await supabase.storage.from(BUCKET).remove([a.storagePath]);
    set({ assets: get().assets.filter((x) => x.id !== id) });
  },
}));
