import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { uploadFile } from "@/lib/upload";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";

interface Props { id?: string; }

export function ArticleForm({ id }: Props) {
  const navigate = useNavigate();
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", slug: "", category: "", subcategory: "",
    author_name: "Editorial Team", author_title: "",
    excerpt: "", body: "", featured_image_url: "", status: "draft",
  });

  useEffect(() => {
    supabase.from("categories").select("name").order("name").then(({ data }) => setCats((data ?? []).map((c) => c.name)));
    if (id) {
      supabase.from("articles").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (data) setForm(data);
      });
    }
  }, [id]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const url = await uploadFile("article-images", f);
      set("featured_image_url", url);
      toast.success("Image uploaded");
    } catch (err: any) { toast.error(err.message); }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title || !form.category) return toast.error("Title and category required");
    setLoading(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      status,
      published_at: status === "published" ? (form.published_at ?? new Date().toISOString()) : null,
    };
    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.view_count;
    let error;
    if (id) {
      ({ error } = await supabase.from("articles").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("articles").insert(payload));
    }
    setLoading(false);
    if (error) return toast.error(error.message);
    await logActivity(id ? "edited" : "created", "article", id ?? payload.slug);
    toast.success("Saved");
    navigate({ to: "/admin/articles" });
  };

  return (
    <AdminGate title={id ? "Edit Article" : "New Article"}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 max-w-6xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Slug (URL)</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Excerpt</label>
            <textarea value={form.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} rows={2} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Body</label>
            <div className="mt-1">
              <RichTextEditor value={form.body ?? ""} onChange={(v) => set("body", v)} />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-background border border-border p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Publish</div>
            <div className="text-xs">Status: <b>{form.status}</b></div>
            <div className="flex gap-2">
              <button disabled={loading} onClick={() => save("draft")} className="flex-1 border border-border py-2 text-sm font-bold uppercase">Save Draft</button>
              <button disabled={loading} onClick={() => save("published")} className="flex-1 bg-brand text-brand-foreground py-2 text-sm font-bold uppercase">Publish</button>
            </div>
          </div>
          <div className="bg-background border border-border p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Category</div>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full px-2 py-1.5 border border-border text-sm">
              <option value="">— Select —</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.subcategory ?? ""} onChange={(e) => set("subcategory", e.target.value)} placeholder="Subcategory (optional)" className="w-full px-2 py-1.5 border border-border text-sm" />
          </div>
          <div className="bg-background border border-border p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Author</div>
            <input value={form.author_name} onChange={(e) => set("author_name", e.target.value)} placeholder="Name" className="w-full px-2 py-1.5 border border-border text-sm" />
            <input value={form.author_title ?? ""} onChange={(e) => set("author_title", e.target.value)} placeholder="Title" className="w-full px-2 py-1.5 border border-border text-sm" />
          </div>
          <div className="bg-background border border-border p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Featured Image</div>
            {form.featured_image_url && <img src={form.featured_image_url} alt="" className="w-full aspect-video object-cover" />}
            <input type="file" accept="image/*" onChange={handleImage} className="text-xs" />
            <input value={form.featured_image_url ?? ""} onChange={(e) => set("featured_image_url", e.target.value)} placeholder="Or paste URL" className="w-full px-2 py-1.5 border border-border text-xs" />
          </div>
        </div>
      </div>
    </AdminGate>
  );
}

export const Route = createFileRoute("/admin/articles/new")({
  ssr: false,
  component: () => <ArticleForm />,
});
