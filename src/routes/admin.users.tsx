import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  listTeam,
  createTeamUser,
  updateTeamMember,
  resetTeamPassword,
  deleteTeamUser,
} from "@/lib/team.functions";
import {
  MAX_ADMIN_CREATED_USERS,
  PREDEFINED_COMPANIES,
  PREDEFINED_DESIGNATIONS,
  PREDEFINED_ROLES,
  type PredefinedCompany,
  type PredefinedDesignation,
  type PredefinedRole,
} from "@/lib/team.constants";
import {
  PERMISSION_AREAS,
  PERMISSION_ACTIONS,
  emptyPermissions,
  normalizePermissions,
  summarize,
  type PermissionMap,
} from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { Trash2, KeyRound, Save, UserPlus, Building, Briefcase, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  component: UsersAdmin,
});

function PermGrid({ perms, onChange }: { perms: PermissionMap; onChange: (p: PermissionMap) => void }) {
  const toggle = (area: string, action: string) => {
    const next: PermissionMap = JSON.parse(JSON.stringify(perms));
    next[area] = next[area] ?? {};
    next[area][action] = !next[area][action];
    if (action !== "view" && next[area][action]) next[area]["view"] = true;
    onChange(next);
  };
  return (
    <table className="w-full text-xs border border-border">
      <thead className="bg-secondary">
        <tr>
          <th className="text-left px-2 py-1">Area</th>
          {PERMISSION_ACTIONS.map((a) => (
            <th key={a} className="px-2 py-1 capitalize">{a}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PERMISSION_AREAS.map((area) => (
          <tr key={area.key} className="border-t border-border">
            <td className="px-2 py-1 font-semibold">{area.label}</td>
            {PERMISSION_ACTIONS.map((act) => (
              <td key={act} className="px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={Boolean(perms[area.key]?.[act])}
                  onChange={() => toggle(area.key, act)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsersAdmin() {
  const load = useServerFn(listTeam);
  const create = useServerFn(createTeamUser);
  const update = useServerFn(updateTeamMember);
  const resetPw = useServerFn(resetTeamPassword);
  const remove = useServerFn(deleteTeamUser);

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User creation form states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState<PredefinedCompany>("CIO Media World");
  const [designation, setDesignation] = useState<PredefinedDesignation>("Content Writer");
  const [role, setRole] = useState<PredefinedRole>("Writer");
  const [perms, setPerms] = useState<PermissionMap>(emptyPermissions());

  // Editing state
  const [editing, setEditing] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<PermissionMap>(emptyPermissions());
  const [editCompany, setEditCompany] = useState<PredefinedCompany>("CIO Media World");
  const [editDesignation, setEditDesignation] = useState<PredefinedDesignation>("Content Writer");
  const [editRole, setEditRole] = useState<PredefinedRole>("Writer");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await load({});
      setMembers(res.members);
    } catch (e: any) {
      toast.error(e.message ?? "Could not load users");
    }
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const submit = async () => {
    if (!email.includes("@")) return toast.error("Enter a valid email");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (!PREDEFINED_COMPANIES.includes(companyName as any)) return toast.error("Please select a valid Company");
    if (!PREDEFINED_DESIGNATIONS.includes(designation as any)) return toast.error("Please select a valid Designation");
    if (!PREDEFINED_ROLES.includes(role as any)) return toast.error("Please select a valid Role");

    if (members.length >= MAX_ADMIN_CREATED_USERS) {
      return toast.error(`You have reached the maximum limit of ${MAX_ADMIN_CREATED_USERS} users.`);
    }
    setBusy(true);
    try {
      await create({
        data: {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          company_name: companyName,
          designation,
          role,
          permissions: perms,
        },
      });
      await logActivity("created user", "user", `${fullName.trim()} (${email.trim()}) - ${designation} [${role}]`);
      toast.success("User created successfully");
      setEmail("");
      setFullName("");
      setPassword("");
      setCompanyName("CIO Media World");
      setDesignation("Content Writer");
      setRole("Writer");
      setPerms(emptyPermissions());
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Could not create user");
    }
    setBusy(false);
  };

  const startEdit = (m: any) => {
    if (editing === m.id) {
      setEditing(null);
    } else {
      setEditing(m.id);
      setEditPerms(normalizePermissions(m.permissions));
      setEditCompany(m.company_name || "CIO Media World");
      setEditDesignation(m.designation || "Content Writer");
      setEditRole(m.role || "Writer");
    }
  };

  const saveEdit = async (m: any) => {
    try {
      await update({
        data: {
          id: m.id,
          company_name: editCompany,
          designation: editDesignation,
          role: editRole,
          permissions: editPerms,
        },
      });
      await logActivity("updated user details", "user", m.email);
      toast.success("User profile updated");
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (m: any) => {
    try {
      await update({ data: { id: m.id, active: !m.active } });
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const doReset = async (m: any) => {
    const pw = prompt(`New password for ${m.email} (min 8 chars)`);
    if (!pw) return;
    try {
      await resetPw({ data: { id: m.id, password: pw } });
      toast.success("Password updated");
    } catch (e: any) { toast.error(e.message); }
  };

  const doDelete = async (m: any) => {
    if (!confirm(`Delete ${m.email}? Their login will be removed.`)) return;
    try {
      await remove({ data: { id: m.id } });
      await logActivity("deleted", "user", m.email);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminGate title="Users & Permissions">
      <div className="mb-4 text-sm text-muted-foreground">
        <span className="font-bold text-navy">{members.length}</span> of {MAX_ADMIN_CREATED_USERS} team users created
      </div>

      <div className="bg-background border border-border p-5 mb-8 max-w-4xl shadow-sm">
        <div className="font-bold mb-4 flex items-center gap-2 text-navy text-base">
          <UserPlus size={18} className="text-brand" /> Create a new user
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-border mt-1 bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="e.g. Chetan Sharma"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border mt-1 bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="editor@ciomediaworld.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border mt-1 bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="min 8 characters"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Building size={12} /> Company Name
            </label>
            <select
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value as PredefinedCompany)}
              className="w-full px-3 py-2 border border-border mt-1 bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {PREDEFINED_COMPANIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Briefcase size={12} /> Designation (Job Title)
            </label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value as PredefinedDesignation)}
              className="w-full px-3 py-2 border border-border mt-1 bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {PREDEFINED_DESIGNATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Shield size={12} /> System Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PredefinedRole)}
              className="w-full px-3 py-2 border border-border mt-1 bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {PREDEFINED_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="text-xs font-bold uppercase tracking-wider mb-2 text-navy">Area Permissions</div>
          <PermGrid perms={perms} onChange={setPerms} />
        </div>

        <button
          onClick={submit}
          disabled={busy || members.length >= MAX_ADMIN_CREATED_USERS}
          className="mt-5 bg-brand text-brand-foreground px-6 py-2.5 text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {busy ? "Creating User…" : members.length >= MAX_ADMIN_CREATED_USERS ? `Limit Reached (${MAX_ADMIN_CREATED_USERS}/${MAX_ADMIN_CREATED_USERS})` : "Create User"}
        </button>
      </div>

      <div className="bg-background border border-border shadow-sm">
        <div className="px-4 py-3 border-b border-border font-bold text-navy">Team Members ({members.length})</div>
        {loading ? (
          <div className="p-6 text-muted-foreground">Loading team members…</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No team users yet.</div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="border-t border-border px-4 py-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy text-base">{m.full_name || m.email}</span>
                    {m.company_name && (
                      <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-brand border border-brand/20 font-medium rounded-sm">
                        {m.company_name}
                      </span>
                    )}
                    {m.designation && (
                      <span className="text-[11px] px-2 py-0.5 bg-secondary text-navy font-semibold border border-border rounded-sm">
                        {m.designation}
                      </span>
                    )}
                    {m.role && (
                      <span className="text-[11px] px-2 py-0.5 bg-navy text-white font-bold rounded-sm">
                        {m.role}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.email}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Permissions: {summarize(normalizePermissions(m.permissions))}
                  </div>
                </div>

                <button
                  onClick={() => toggleActive(m)}
                  className={`text-xs px-2.5 py-1 border font-medium ${m.active ? "border-green-600 text-green-700 bg-green-50" : "border-border text-muted-foreground bg-gray-50"}`}
                >
                  {m.active ? "Active" : "Disabled"}
                </button>

                <button
                  onClick={() => startEdit(m)}
                  className="text-xs px-3 py-1 border border-border hover:bg-secondary font-medium"
                >
                  {editing === m.id ? "Close" : "Edit details"}
                </button>
                <button
                  onClick={() => doReset(m)}
                  className="text-xs px-3 py-1 border border-border hover:bg-secondary font-medium flex items-center gap-1"
                >
                  <KeyRound size={12} /> Password
                </button>
                <button
                  onClick={() => doDelete(m)}
                  className="text-xs px-3 py-1 border border-destructive text-destructive hover:bg-red-50 font-medium flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>

              {editing === m.id && (
                <div className="mt-4 p-4 border border-border bg-white">
                  <div className="text-xs font-bold uppercase tracking-wider text-navy mb-3">Edit User Profile</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Name</label>
                      <select
                        value={editCompany}
                        onChange={(e) => setEditCompany(e.target.value as PredefinedCompany)}
                        className="w-full px-2.5 py-1.5 border border-border mt-1 bg-background text-xs font-medium"
                      >
                        {PREDEFINED_COMPANIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Designation</label>
                      <select
                        value={editDesignation}
                        onChange={(e) => setEditDesignation(e.target.value as PredefinedDesignation)}
                        className="w-full px-2.5 py-1.5 border border-border mt-1 bg-background text-xs font-medium"
                      >
                        {PREDEFINED_DESIGNATIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as PredefinedRole)}
                        className="w-full px-2.5 py-1.5 border border-border mt-1 bg-background text-xs font-medium"
                      >
                        {PREDEFINED_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-navy mb-2">Area Permissions</div>
                  <PermGrid perms={editPerms} onChange={setEditPerms} />

                  <button
                    onClick={() => saveEdit(m)}
                    className="mt-3 bg-navy text-navy-foreground px-4 py-2 text-xs font-bold uppercase flex items-center gap-1 hover:opacity-90"
                  >
                    <Save size={12} /> Save changes
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </AdminGate>
  );
}
