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
  PERMISSION_AREAS,
  PERMISSION_ACTIONS,
  emptyPermissions,
  normalizePermissions,
  summarize,
  type PermissionMap,
} from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { Trash2, KeyRound, Save, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  component: UsersAdmin,
});

const LIMIT = 10;

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
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState<PermissionMap>(emptyPermissions());
  const [editing, setEditing] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<PermissionMap>(emptyPermissions());
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
    if (members.length >= LIMIT) return toast.error(`Limit of ${LIMIT} users reached`);
    setBusy(true);
    try {
      await create({ data: { email: email.trim(), password, full_name: fullName.trim(), permissions: perms } });
      await logActivity("created", "user", email.trim());
      toast.success("User created");
      setEmail(""); setFullName(""); setPassword(""); setPerms(emptyPermissions());
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Could not create user");
    }
    setBusy(false);
  };

  const savePerms = async (m: any) => {
    try {
      await update({ data: { id: m.id, permissions: editPerms } });
      await logActivity("updated permissions", "user", m.email);
      toast.success("Permissions saved");
      setEditing(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
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
        <span className="font-bold text-navy">{members.length}</span> of {LIMIT} team users created
      </div>

      <div className="bg-background border border-border p-4 mb-8 max-w-3xl">
        <div className="font-bold mb-3 flex items-center gap-2"><UserPlus size={16} /> Create a new user</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-border mt-1" placeholder="editor@ciotimes.com" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-border mt-1" placeholder="min 8 characters" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider mb-1">Permissions</div>
          <PermGrid perms={perms} onChange={setPerms} />
        </div>
        <button
          onClick={submit}
          disabled={busy || members.length >= LIMIT}
          className="mt-4 bg-brand text-brand-foreground px-5 py-2 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create user"}
        </button>
      </div>

      <div className="bg-background border border-border">
        <div className="px-4 py-3 border-b border-border font-bold">Team members</div>
        {loading ? (
          <div className="p-6 text-muted-foreground">Loading…</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No team users yet.</div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="border-t border-border px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold">{m.full_name || m.email}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{summarize(normalizePermissions(m.permissions))}</div>
                </div>
                <button onClick={() => toggleActive(m)} className={`text-xs px-2 py-1 border ${m.active ? "border-green-600 text-green-700" : "border-border text-muted-foreground"}`}>
                  {m.active ? "Active" : "Disabled"}
                </button>
                <button
                  onClick={() => { setEditing(editing === m.id ? null : m.id); setEditPerms(normalizePermissions(m.permissions)); }}
                  className="text-xs px-2 py-1 border border-border hover:bg-secondary"
                >
                  {editing === m.id ? "Close" : "Edit permissions"}
                </button>
                <button onClick={() => doReset(m)} className="text-xs px-2 py-1 border border-border hover:bg-secondary flex items-center gap-1"><KeyRound size={12} /> Password</button>
                <button onClick={() => doDelete(m)} className="text-xs px-2 py-1 border border-destructive text-destructive flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
              {editing === m.id && (
                <div className="mt-3">
                  <PermGrid perms={editPerms} onChange={setEditPerms} />
                  <button onClick={() => savePerms(m)} className="mt-2 bg-navy text-navy-foreground px-4 py-2 text-xs font-bold uppercase flex items-center gap-1">
                    <Save size={12} /> Save permissions
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
