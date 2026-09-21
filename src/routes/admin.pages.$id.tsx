import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { StorageImage } from "@/components/site/StorageImage";
import { uploadFile } from "@/lib/upload";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pages/$id")({
  ssr: false,
  component: PageEditor,
});

function PageEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    supabase.from("pages").select("*").eq("id", id).maybeSingle().then(({ data }) => setForm(data));
  }, [id]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await uploadFile("article-images", f);
      set("hero_image_url", url);
      toast.success("Image uploaded");
    } catch (err: any) { toast.error(err.message); }
  };

  const save = async (status: "draft" | "published") => {
    setLoading(true);
    const { error } = await supabase.from("pages").update({
      title: form.title,
      content: form.content ?? "",
      hero_image_url: form.hero_image_url || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      status,
    }).eq("id", id);
    setLoading(false);
    if (error) {
      if ((error as any).code === "42501" || /row-level security/i.test(error.message)) {
        return toast.error("You don't have permission to edit pages.");
      }
      return toast.error(error.message);
    }
    await logActivity("edited", "page", form.slug);
    toast.success(status === "published" ? "Page published" : "Draft saved");
    navigate({ to: "/admin/pages" });
  };

  if (!form) return <AdminGate title="Edit Page"><div>Loading…</div></AdminGate>;

  return (
    <AdminGate title={`Edit Page — /${form.slug}`}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 max-w-6xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Title</label>
            <input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} className="admin-input mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Content</label>
            <div className="mt-1">
              <RichTextEditor value={form.content ?? ""} onChange={(v) => set("content", v)} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="admin-card p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Publish</div>
            <div className="text-xs">Status: <b>{form.status}</b></div>
            <div className="flex gap-2">
              <button disabled={loading} onClick={() => save("draft")} className="admin-btn admin-btn-ghost flex-1">Save draft</button>
              <button disabled={loading} onClick={() => save("published")} className="admin-btn admin-btn-primary flex-1">Publish</button>
            </div>
          </div>
          <div className="admin-card p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">SEO</div>
            <input value={form.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} placeholder="SEO title" className="admin-input" />
            <textarea value={form.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value)} rows={3} placeholder="Meta description" className="admin-input" />
          </div>
          <div className="admin-card p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Hero image</div>
            {form.hero_image_url && <StorageImage src={form.hero_image_url} className="w-full aspect-video object-cover" />}
            <input type="file" accept="image/*" onChange={handleImage} className="text-xs" />
          </div>
        </div>
      </div>
    </AdminGate>
  );
}
