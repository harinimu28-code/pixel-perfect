import { create } from "zustand";

export interface Notice {
  id: string;
  title: string;
  body: string;
  dept: string;
  at: string;
  read: boolean;
}

const now = Date.now();
const ago = (m: number) => new Date(now - m * 60000).toISOString();

export const useNotifications = create<{
  items: Notice[];
  push: (n: Omit<Notice, "id" | "at" | "read">) => void;
  markRead: (id: string) => void;
  markAll: () => void;
}>((set) => ({
  items: [
    { id: "n1", title: "Changes requested", body: "Moving Head Light 02 — beam angle clashes with LED sightline.", dept: "Lighting", at: ago(18), read: false },
    { id: "n2", title: "Review requested", body: "Right Speaker placement submitted for review by Audio Team.", dept: "Sound", at: ago(52), read: false },
    { id: "n3", title: "Approved", body: "Main LED Screen position approved by Production Manager.", dept: "LED Screen", at: ago(140), read: true },
    { id: "n4", title: "Requirement added", body: "Props: 2x decorative pillars with floral urns.", dept: "Props", at: ago(300), read: true },
  ],
  push: (n) =>
    set((s) => ({
      items: [{ ...n, id: Math.random().toString(36).slice(2), at: new Date().toISOString(), read: false }, ...s.items],
    })),
  markRead: (id) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)) })),
  markAll: () => set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
}));

export function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
