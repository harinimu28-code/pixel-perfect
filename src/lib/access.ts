
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLES: AppRole[] = [
  "admin",
  "art_director",
  "design",
  "props",
  "lighting",
  "modeling",
  "animation",
];

const TEAM = ["/", "/projects", "/requirements", "/timeline", "/notifications"];

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

/**
 * StageSync team permissions.
 * These rules will be used by the UI and stage store.
 * Database RLS must enforce the same rules separately.
 */

export type TeamPermission =
  | "manage_all"
  | "edit_screens"
  | "edit_lighting"
  | "edit_props"
  | "view_only";

export const ROLE_PERMISSIONS: Record<AppRole, TeamPermission> = {
  admin: "manage_all",
  art_director: "manage_all",
  design: "edit_screens",
  lighting: "edit_lighting",
  props: "edit_props",
  modeling: "view_only",
  animation: "view_only",
};

export function getRolePermission(
  role: AppRole | null | undefined
): TeamPermission {
  if (!role) return "view_only";
  return ROLE_PERMISSIONS[role] ?? "view_only";
}

export function canEditStage(role: AppRole | null | undefined) {
  return getRolePermission(role) === "manage_all";
}

export function canEditObject(
  role: AppRole | null | undefined,
  department: string
) {
  const permission = getRolePermission(role);

  if (permission === "manage_all") return true;

  if (permission === "edit_screens") {
    return department === "LED Screen";
  }

  if (permission === "edit_lighting") {
    return department === "Lighting";
  }

  if (permission === "edit_props") {
    return department === "Props";
  }

  return false;
}

export const roleLabel = (r: AppRole) =>
  r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
