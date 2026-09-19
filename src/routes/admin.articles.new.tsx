import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { uploadFile } from "@/lib/upload";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { StorageImage } from "@/components/site/StorageImage";

interface Props {
  id?: string;
}

interface ArticleFormData {
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  author_name: string;
  author_title: string;
  excerpt: string;
  body: string;
  featured_image_url: string;
  status: "draft" | "published";
  published_at?: string | null;
}

const INITIAL_FORM: ArticleFormData = {
  title: "",
  slug: "",
  category: "",
  subcategory: "",
  author_name: "Editorial Team",
  author_title: "",
  excerpt: "",
  body: "",
  featured_image_url: "",
  status: "draft",
  published_at: null,
};

const MEDIA_BUCKET = "article-images";

export function ArticleForm({ id }: Props) {
  const navigate = useNavigate();
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState<ArticleFormData>(INITIAL_FORM);

  const setField = <K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    supabase.from("categories").select("name").order("name").then(({ data }) => {
      if (data) setCats(data.map((c) => c.name));
    });
    if (id) {
      supabase.from("articles").select("*").eq("id", id).maybeSingle().then(({ data }) => {
        if (data) {
          setForm({
            title: data.title ?? "",
            slug: data.slug ?? "",
            category: data.category ?? "",
            subcategory: data.subcategory ?? "",
            author_name: data.author_name ?? "Editorial Team",
            author_title: data.author_title ?? "",
            excerpt: data.excerpt ?? "",
            body: data.body ?? "",
            featured_image_url: data.featured_image_url ?? "",
            status: data.status === "published" ? "published" : "draft",
            published_at: data.published_at ?? null,
          });
        }
      });
    }
  }, [id]);

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFile(MEDIA_BUCKET, file);
      setField("featured_image_url", url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title) return toast.error("Title required");
    setLoading(true);
    const finalSlug = form.slug || slugify(form.title);
    const payload = {
      ...form,
      slug: finalSlug,
      status,
      published_at: status === "published" ? (form.published_at || new Date().toISOString()) : form.published_at,
    };
    let error;
    if (id) {
      ({ error } = await supabase.from("articles").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("articles").insert(payload));
    }
    setLoading(false);
    if (error) return toast.error(error.message);
    await logActivity(id ? "edited" : "created", "article", id ?? form.title);
    toast.success("Saved");
    navigate({ to: "/admin/articles" });
  };

  return (
    <AdminGate title={id ? "Edit Article" : "New Article"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Title</label>
            <input
              value={form.title}
              onChange={(e) => {
                setField("title", e.target.value);
                if (!id && !form.slug) setField("slug", slugify(e.target.value));
              }}
              className="w-full px-3 py-2 border border-border mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Slug</label>
            <input value={form.slug} onChange={(e) => setField("slug", e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider">Excerpt</label>
            <textarea value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} rows={3} className="w-full px-3 py-2 border border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block">Body</label>
            <RichTextEditor value={form.body} onChange={(v) => setField("body", v)} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-border p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider">Publish</div>
            <div className="text-xs">Status: <b>{form.status}</b></div>
            <button disabled={loading} onClick={() => save("draft")} className="w-full border border-border py-2 text-sm font-bold uppercase hover:bg-accent">
              Save Draft
            </button>
            <button disabled={loading} onClick={() => save("published")} className="w-full bg-brand text-brand-foreground py-2 text-sm font-bold uppercase hover:bg-primary">
              Publish
            </button>
          </div>
          <div className="bg-card border border-border p-4 space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider">Category</label>
              <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="w-full px-3 py-2 border border-border mt-1 bg-background">
                <option value="">Select Category</option>
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider">Author Name</label>
              <input value={form.author_name} onChange={(e) => setField("author_name", e.target.value)} className="w-full px-3 py-2 border border-border mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider">Featured Image</label>
              {form.featured_image_url && <StorageImage src={form.featured_image_url} className="w-full aspect-[16/9] object-cover border border-border mt-1 mb-2" />}
              <input type="file" accept="image/*" disabled={uploadingImage} onChange={handleImage} className="text-xs block w-full" />
            </div>
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
