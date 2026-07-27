import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/articles/")({
  ssr: false,
  component: ArticlesAdmin,
});

function ArticlesAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [confirmDel, setConfirmDel] = useState<any>(null);

  const load = async () => {
    let query = supabase.from("articles").select("*").order("created_at", { ascending: false });
    if (statusFilter) query = query.eq("status", statusFilter);
    if (catFilter) query = query.eq("category", catFilter);
    const { data } = await query;
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [statusFilter, catFilter]);
  useEffect(() => {
    supabase.from("categories").select("name").then(({ data }) => setCats((data ?? []).map((c) => c.name)));
  }, []);

  const togglePublish = async (row: any) => {
    const newStatus = row.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("articles").update({
      status: newStatus,
      published_at: newStatus === "published" ? new Date().toISOString() : null,
    }).eq("id", row.id);
    if (error) return toast.error(error.message);
    await logActivity(newStatus === "published" ? "published" : "unpublished", "article", row.id);
    toast.success(newStatus === "published" ? "Published" : "Unpublished");
    load();
  };

  const del = async () => {
    if (!confirmDel) return;
    const { error } = await supabase.from("articles").delete().eq("id", confirmDel.id);
    if (error) return toast.error(error.message);
    await logActivity("deleted", "article", confirmDel.id);
    toast.success("Deleted");
    setConfirmDel(null);
    load();
  };

  const filtered = rows.filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminGate title="Articles">
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} className="px-3 py-2 border border-border text-sm" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 border border-border text-sm">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Link to="/admin/articles/new" className="ml-auto bg-brand text-brand-foreground px-4 py-2 text-sm font-bold uppercase inline-flex items-center gap-1">
          <Plus size={14} /> New Article
        </Link>
      </div>

      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Author</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold max-w-[300px] truncate">{r.title}</td>
                <td className="px-3 py-2">{r.category}</td>
                <td className="px-3 py-2">{r.author_name}</td>
                <td className="px-3 py-2">
                  <button onClick={() => togglePublish(r)} className={`text-[10px] px-2 py-0.5 uppercase font-bold tracking-wider ${r.status === "published" ? "bg-brand text-brand-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {r.status}
                  </button>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right">
                  <Link to="/admin/articles/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 text-brand mr-3"><Pencil size={14} /> Edit</Link>
                  <button onClick={() => setConfirmDel(r)} className="inline-flex items-center gap-1 text-destructive"><Trash2 size={14} /> Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No articles.</td></tr>}
          </tbody>
        </table>
      </div>

      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border p-6 max-w-md">
            <h3 className="text-lg font-bold">Delete article?</h3>
            <p className="text-sm text-muted-foreground mt-2">"{confirmDel.title}" will be permanently removed.</p>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 border border-border text-sm">Cancel</button>
              <button onClick={del} className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminGate>
  );
}
