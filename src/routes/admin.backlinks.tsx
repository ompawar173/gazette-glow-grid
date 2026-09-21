import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink, MousePointerClick } from "lucide-react";

export const Route = createFileRoute("/admin/backlinks")({
  ssr: false,
  component: BacklinksAdmin,
});

/** Trim, add https:// when missing, drop tracking params, strip trailing slash. */
function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const u = new URL(value);
    for (const p of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_cid|mc_eid)/i.test(p)) u.searchParams.delete(p);
    }
    u.hash = "";
    let out = u.toString();
    if (out.endsWith("/") && u.pathname !== "/") out = out.slice(0, -1);
    return out;
  } catch {
    return null;
  }
}

function BacklinksAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [magazines, setMagazines] = useState<any[]>([]);
  const [targetType, setTargetType] = useState("site");
  const [targetId, setTargetId] = useState("");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [nofollow, setNofollow] = useState(true);
  const [sponsored, setSponsored] = useState(false);
  const [sort, setSort] = useState<"clicks" | "recent">("clicks");

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

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === "clicks") copy.sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0));
    else copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return copy;
  }, [rows, sort]);

  const totalClicks = rows.reduce((s, r) => s + (r.click_count ?? 0), 0);

  const add = async () => {
    const clean = normalizeUrl(url);
    if (!label.trim() || !clean) return toast.error("Label and a valid URL are required");
    if (targetType !== "site" && !targetId) return toast.error("Pick a target");
    const dup = rows.find(
      (r) => r.url === clean && r.target_type === targetType && (r.target_id ?? null) === (targetType === "site" ? null : targetId),
    );
    if (dup) return toast.error("That link is already attached to this target");

    const { error } = await supabase.from("backlinks").insert({
      target_type: targetType,
      target_id: targetType === "site" ? null : targetId,
      label: label.trim(),
      url: clean,
      note: note.trim() || null,
      rel_nofollow: nofollow,
      rel_sponsored: sponsored,
    });
    if (error) return toast.error(error.message);
    await logActivity("created", "backlink", label.trim());
    setLabel(""); setUrl(""); setNote(""); setTargetId(""); setSponsored(false); setNofollow(true);
    load();
  };

  const toggleRel = async (r: any, field: "rel_nofollow" | "rel_sponsored") => {
    const { error } = await supabase.from("backlinks").update({ [field]: !r[field] } as any).eq("id", r.id);
    if (error) return toast.error(error.message);
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-3xl">
        <div className="admin-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Links</div>
          <div className="text-2xl font-bold">{rows.length}</div>
        </div>
        <div className="admin-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total clicks</div>
          <div className="text-2xl font-bold text-brand">{totalClicks}</div>
        </div>
        <div className="admin-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Top link</div>
          <div className="text-sm font-semibold truncate">{sorted[0]?.label ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{sorted[0]?.click_count ?? 0} clicks</div>
        </div>
      </div>

      <div className="admin-card p-4 mb-6 max-w-4xl">
        <div className="font-bold mb-3 flex items-center gap-2"><Plus size={16} /> Add a backlink</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Attach to</label>
            <select value={targetType} onChange={(e) => { setTargetType(e.target.value); setTargetId(""); }} className="admin-input mt-1">
              <option value="site">Site-wide</option>
              <option value="article">Article</option>
              <option value="magazine">Magazine</option>
            </select>
          </div>
          {targetType !== "site" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider">Target</label>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="admin-input mt-1">
                <option value="">Select…</option>
                {(targetType === "article" ? articles : magazines).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="admin-input mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="admin-input mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="admin-input mt-1" />
          </div>
          <div className="md:col-span-2 flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={nofollow} onChange={(e) => setNofollow(e.target.checked)} /> rel="nofollow"
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sponsored} onChange={(e) => setSponsored(e.target.checked)} /> rel="sponsored" (paid)
            </label>
          </div>
        </div>
        <button onClick={add} className="admin-btn admin-btn-primary mt-4">Add backlink</button>
      </div>

      <div className="flex items-center gap-2 mb-2 text-xs">
        <span className="text-muted-foreground">Sort:</span>
        <button onClick={() => setSort("clicks")} className={`admin-btn ${sort === "clicks" ? "admin-btn-primary" : "admin-btn-ghost"}`}>Most clicked</button>
        <button onClick={() => setSort("recent")} className={`admin-btn ${sort === "recent" ? "admin-btn-primary" : "admin-btn-ghost"}`}>Newest</button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f9fafb] text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Label</th><th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Attached to</th><th className="px-3 py-2">Rel</th>
              <th className="px-3 py-2">Clicks</th><th className="px-3 py-2">Last click</th><th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{r.label}</td>
                <td className="px-3 py-2 text-xs max-w-[280px]">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-brand inline-flex items-center gap-1 break-all">
                    {r.url} <ExternalLink size={11} />
                  </a>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{nameFor(r)}</td>
                <td className="px-3 py-2 text-[11px] whitespace-nowrap">
                  <button onClick={() => toggleRel(r, "rel_nofollow")} className={r.rel_nofollow ? "text-brand font-semibold" : "text-muted-foreground"}>nofollow</button>
                  {" · "}
                  <button onClick={() => toggleRel(r, "rel_sponsored")} className={r.rel_sponsored ? "text-brand font-semibold" : "text-muted-foreground"}>sponsored</button>
                </td>
                <td className="px-3 py-2 font-semibold inline-flex items-center gap-1"><MousePointerClick size={12} /> {r.click_count}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {r.last_clicked_at ? new Date(r.last_clicked_at).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => del(r)} className="text-destructive"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No backlinks yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminGate>
  );
}
