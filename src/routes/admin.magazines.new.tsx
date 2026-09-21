import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { uploadFile } from "@/lib/upload";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { StorageImage } from "@/components/site/StorageImage";

export function MagazineForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", issue_month: "", issue_year: new Date().getFullYear(),
    cover_image_url: "", pdf_file_url: "", status: "draft",
  });

  useEffect(() => {
    if (id) supabase.from("magazines").select("*").eq("id", id).maybeSingle().then(({ data }) => data && setForm(data));
  }, [id]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const upload = async (bucket: string, e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { const url = await uploadFile(bucket, f); set(field, url); toast.success("Uploaded"); }
    catch (err: any) { toast.error(err.message); }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title) return toast.error("Title required");
    setLoading(true);
    const payload = { ...form, status, issue_year: Number(form.issue_year) };
    delete payload.id; delete payload.created_at;
    let error;
    if (id) ({ error } = await supabase.from("magazines").update(payload).eq("id", id));
    else ({ error } = await supabase.from("magazines").insert(payload));
    setLoading(false);
    if (error) return toast.error(error.message);
    await logActivity(id ? "edited" : "created", "magazine", id ?? form.title);
    toast.success("Saved");
    navigate({ to: "/admin/magazines" });
  };

  return (
    <AdminGate title={id ? "Edit Magazine Issue" : "Upload Magazine Issue"}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider">Issue Month</label>
              <input value={form.issue_month ?? ""} onChange={(e) => set("issue_month", e.target.value)} placeholder="e.g. November" className="w-full px-3 py-2 border border-border mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider">Issue Year</label>
              <input type="number" value={form.issue_year ?? ""} onChange={(e) => set("issue_year", e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Cover Image</label>
            {form.cover_image_url && <StorageImage src={form.cover_image_url} className="w-32 aspect-[3/4] object-cover border border-border mt-1" />}
            <input type="file" accept="image/*" onChange={(e) => upload("magazine-covers", e, "cover_image_url")} className="text-xs mt-2 block" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">PDF File</label>
            {form.pdf_file_url && <a href={form.pdf_file_url} target="_blank" rel="noreferrer" className="block text-brand text-sm mt-1">Current PDF ↗</a>}
            <input type="file" accept="application/pdf" onChange={(e) => upload("magazine-pdfs", e, "pdf_file_url")} className="text-xs mt-2 block" />
          </div>
        </div>
        <div>
          <div className="bg-background border border-border p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Publish</div>
            <div className="text-xs">Status: <b>{form.status}</b></div>
            <button disabled={loading} onClick={() => save("draft")} className="w-full border border-border py-2 text-sm font-bold uppercase">Save Draft</button>
            <button disabled={loading} onClick={() => save("published")} className="w-full bg-brand text-brand-foreground py-2 text-sm font-bold uppercase">Publish</button>
          </div>
        </div>
      </div>
    </AdminGate>
  );
}

export const Route = createFileRoute("/admin/magazines/new")({
  ssr: false,
  component: () => <MagazineForm />,
});
