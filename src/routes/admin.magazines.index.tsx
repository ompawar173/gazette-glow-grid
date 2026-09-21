import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/magazines/")({
  ssr: false,
  component: MagsAdmin,
});

function MagsAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const load = () => supabase.from("magazines").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const toggle = async (r: any) => {
    const s = r.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("magazines").update({ status: s }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity(s === "published" ? "published" : "unpublished", "magazine", r.id);
    load();
  };
  const del = async () => {
    if (!confirmDel) return;
    const { error } = await supabase.from("magazines").delete().eq("id", confirmDel.id);
    if (error) return toast.error(error.message);
    await logActivity("deleted", "magazine", confirmDel.id);
    toast.success("Deleted"); setConfirmDel(null); load();
  };

  return (
    <AdminGate title="Magazine Issues">
      <div className="mb-4 flex">
        <Link to="/admin/magazines/new" className="ml-auto bg-brand text-brand-foreground px-4 py-2 text-sm font-bold uppercase inline-flex items-center gap-1">
          <Plus size={14} /> Upload Issue
        </Link>
      </div>
      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr><th className="px-3 py-2">Title</th><th className="px-3 py-2">Issue</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{r.title}</td>
                <td className="px-3 py-2">{r.issue_month} {r.issue_year}</td>
                <td className="px-3 py-2">
                  <button onClick={() => toggle(r)} className={`text-[10px] px-2 py-0.5 uppercase font-bold tracking-wider ${r.status === "published" ? "bg-brand text-brand-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {r.status}
                  </button>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right">
                  <Link to="/admin/magazines/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 text-brand mr-3"><Pencil size={14} /> Edit</Link>
                  <button onClick={() => setConfirmDel(r)} className="inline-flex items-center gap-1 text-destructive"><Trash2 size={14} /> Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No issues yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {confirmDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border p-6 max-w-md">
            <h3 className="text-lg font-bold">Delete issue?</h3>
            <p className="text-sm text-muted-foreground mt-2">"{confirmDel.title}" will be removed.</p>
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
