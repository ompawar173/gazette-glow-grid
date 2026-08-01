import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/backlinks")({
  ssr: false,
  component: BacklinksAdmin,
});

function BacklinksAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [magazines, setMagazines] = useState<any[]>([]);
  const [targetType, setTargetType] = useState("site");
  const [targetId, setTargetId] = useState("");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const load = () =>
    supabase.from("backlinks").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));

  useEffect(() => {
    load();
    supabase.from("articles").select("id,title").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setArticles(data ?? []));
    supabase.from("magazines").select("id,title").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setMagazines(data ?? []));
  }, []);

  const add = async () => {
    if (!label.trim() || !url.trim()) return toast.error("Label and URL are required");
    if (!/^https?:\/\//i.test(url.trim())) return toast.error("URL must start with http:// or https://");
    if (targetType !== "site" && !targetId) return toast.error("Pick a target");
    const { error } = await supabase.from("backlinks").insert({
      target_type: targetType,
      target_id: targetType === "site" ? null : targetId,
      label: label.trim(),
      url: url.trim(),
      note: note.trim() || null,
    });
    if (error) return toast.error(error.message);
    await logActivity("created", "backlink", label.trim());
    setLabel(""); setUrl(""); setNote(""); setTargetId("");
    load();
  };

  const del = async (r: any) => {
    if (!confirm(`Delete backlink "${r.label}"?`)) return;
    const { error } = await supabase.from("backlinks").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity("deleted", "backlink", r.id);
    load();
  };

  const nameFor = (r: any) => {
    if (r.target_type === "article") return articles.find((a) => a.id === r.target_id)?.title ?? "Article";
    if (r.target_type === "magazine") return magazines.find((m) => m.id === r.target_id)?.title ?? "Magazine";
    return "Site-wide";
  };

  return (
    <AdminGate title="Backlinks">
      <div className="bg-background border border-border p-4 mb-6 max-w-4xl">
        <div className="font-bold mb-3 flex items-center gap-2"><Plus size={16} /> Add a backlink</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Attach to</label>
            <select value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(""); }} className="w-full px-3 py-2 border border-border mt-1 bg-background">
              <option value="site">Site-wide</option>
              <option value="article">Article</option>
              <option value="magazine">Magazine</option>
            </select>
          </div>
          {targetType !== "site" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider">Target</label>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-3 py-2 border border-border mt-1 bg-background">
                <option value="">Select…</option>
                {(targetType === "article" ? articles : magazines).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
        </div>
        <button onClick={add} className="mt-4 bg-brand text-brand-foreground px-5 py-2 text-sm font-bold uppercase tracking-wide">Add backlink</button>
      </div>

      <div className="bg-background border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2">Label</th><th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Attached to</th><th className="px-3 py-2">Clicks</th><th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{r.label}</td>
                <td className="px-3 py-2 text-xs">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-brand inline-flex items-center gap-1 break-all">
                    {r.url} <ExternalLink size={11} />
                  </a>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{nameFor(r)}</td>
                <td className="px-3 py-2">{r.click_count}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => del(r)} className="text-destructive"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No backlinks yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
