export const PERMISSION_AREAS = [
  { key: "articles", label: "Articles" },
  { key: "magazines", label: "Magazines" },
  { key: "industries", label: "Industries" },
  { key: "pages", label: "Pages" },
  { key: "backlinks", label: "Backlinks" },
  { key: "subscribers", label: "Subscribers" },
  { key: "messages", label: "Messages" },
  { key: "analytics", label: "Analytics" },
] as const;

export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"] as const;

export type PermissionMap = Record<string, Record<string, boolean>>;

export function emptyPermissions(): PermissionMap {
  const out: PermissionMap = {};
  for (const a of PERMISSION_AREAS) {
    out[a.key] = { view: false, create: false, edit: false, delete: false };
  }
  return out;
}

export function normalizePermissions(raw: unknown): PermissionMap {
  const base = emptyPermissions();
  if (raw && typeof raw === "object") {
    for (const [area, actions] of Object.entries(raw as Record<string, any>)) {
      if (!base[area]) base[area] = { view: false, create: false, edit: false, delete: false };
      if (actions && typeof actions === "object") {
        for (const act of PERMISSION_ACTIONS) {
          base[area][act] = Boolean((actions as any)[act]);
        }
      }
    }
  }
  return base;
}

export function summarize(perms: PermissionMap): string {
  const parts: string[] = [];
  for (const a of PERMISSION_AREAS) {
    const acts = PERMISSION_ACTIONS.filter((x) => perms[a.key]?.[x]);
    if (acts.length) parts.push(`${a.label}: ${acts.join("/")}`);
  }
  return parts.length ? parts.join(" · ") : "No permissions";
}
