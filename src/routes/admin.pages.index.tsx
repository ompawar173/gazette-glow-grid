import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { MANAGED_PAGES } from "@/lib/pages.functions";
import { logActivity } from "@/lib/activity";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/pages/")({
  ssr: false,
  component: PagesAdmin,
});

function PagesAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [slug, setSlug] = useState("about");
  const [custom, setCustom] = useState("");
  const [title, setTitle] = useState("");

  const load = () =>
    supabase.from("pages").select("*").order("slug").then(({ data }) => setRows(data ?? []));

  useEffect(() => { load(); }, []);

  const add = async () => {
    const finalSlug = slug === "__custom" ? slugify(custom) : slug;
    if (!finalSlug) return toast.error("Enter a page URL");
    const finalTitle = title.trim() || (MANAGED_PAGES.find((p) => p.slug === finalSlug)?.label ?? finalSlug);
    const { error } = await supabase.from("pages").insert({ slug: finalSlug, title: finalTitle, status: "draft" });
    if (error) {
      if ((error as any).code === "23505") return toast.error("That page already exists");
      return toast.error(error.message);
    }
    await logActivity("created", "page", finalSlug);
    setTitle(""); setCustom("");
    load();
  };

  const del = async (r: any) => {
    if (!confirm(`Delete page "${r.title}"?`)) return;
    const { error } = await supabase.from("pages").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity("deleted", "page", r.slug);
    load();
  };

  return (
    <AdminGate title="Pages">
      <div className="admin-card p-4 mb-6 max-w-3xl">
        <div className="font-bold mb-3 flex items-center gap-2"><Plus size={16} /> Add a page</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className="admin-input">
            {MANAGED_PAGES.map((p) => <option key={p.slug} value={p.slug}>{p.label} ({p.path})</option>)}
            <option value="__custom">Custom page…</option>
          </select>
          {slug === "__custom" && (
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="page-url" className="admin-input" />
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="admin-input" />
        </div>
        <button onClick={add} className="admin-btn admin-btn-primary mt-4">Add page</button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f9fafb] text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Title</th><th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Status</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{r.title}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">/{r.slug}</td>
                <td className="px-3 py-2 text-xs">
                  <span className={r.status === "published" ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>{r.status}</span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link to="/admin/pages/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 text-brand mr-4"><Pencil size={14} /> Edit</Link>
                  <button onClick={() => del(r)} className="text-destructive"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No pages yet — add one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
