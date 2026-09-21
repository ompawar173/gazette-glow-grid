import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  ssr: false,
  component: CatsAdmin,
});

function CatsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const load = () => supabase.from("categories").select("*").order("name").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    const slug = slugify(name);
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug, parent_category: parent || null });
    if (error) return toast.error(error.message);
    await logActivity("created", "category", slug);
    setName(""); setParent(""); load();
  };
  const rename = async (r: any, newName: string) => {
    const { error } = await supabase.from("categories").update({ name: newName, slug: slugify(newName) }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity("edited", "category", r.id); load();
  };
  const del = async (r: any) => {
    if (!confirm(`Delete ${r.name}?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity("deleted", "category", r.id); load();
  };

  return (
    <AdminGate title="Categories">
      <div className="bg-background border border-border p-4 mb-4 flex gap-2 items-end max-w-2xl">
        <div className="flex-1">
          <label className="text-xs font-bold uppercase tracking-wider">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold uppercase tracking-wider">Parent (opt.)</label>
          <input value={parent} onChange={(e) => setParent(e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
        </div>
        <button onClick={add} className="bg-brand text-brand-foreground px-4 py-2 text-sm font-bold uppercase inline-flex items-center gap-1"><Plus size={14} /> Add</button>
      </div>
      <div className="bg-background border border-border max-w-2xl">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Slug</th><th className="px-3 py-2">Parent</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <input defaultValue={r.name} onBlur={(e) => e.target.value !== r.name && rename(r, e.target.value)} className="w-full px-2 py-1 border border-transparent hover:border-border" />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{r.slug}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.parent_category ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => del(r)} className="text-destructive inline-flex items-center gap-1"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
