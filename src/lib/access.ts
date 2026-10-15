import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLES: AppRole[] = ["admin", "art_director", "design", "props", "lighting", "modeling", "animation"];

const TEAM = ["/", "/projects", "/requirements", "/timeline", "/notifications"];

/** Sections each role may open. Database RLS enforces the data side. */
export const ROLE_SECTIONS: Record<AppRole, string[]> = {
  admin: [...TEAM, "/approvals", "/users"],
  art_director: [...TEAM, "/approvals"],
  design: TEAM,
  props: TEAM,
  lighting: TEAM,
  modeling: TEAM,
  animation: TEAM,
};

export function canAccess(role: AppRole | null | undefined, path: string) {
  if (!role) return false;
  const p = path.length > 1 ? path.replace(/\/$/, "") : path;
  return ROLE_SECTIONS[role].includes(p);
}

export const roleLabel = (r: AppRole) => r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
