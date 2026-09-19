import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
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

const EXACT_BUCKET = "CEO MEDIA MAGZINE PUNE";

async function uploadToStorage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(EXACT_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(EXACT_BUCKET)
    .getPublicUrl(path);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Failed to retrieve public URL from Supabase Storage.");
  }

  return publicUrlData.publicUrl;
}

export function ArticleForm({ id }: Props) {
  const navigate = useNavigate();
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishingState, setPublishingState] = useState<"idle" | "uploading" | "saving">("idle");
  const [form, setForm] = useState<ArticleFormData>(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Please select a valid image file (JPG, PNG, or WEBP).");
      event.target.value = "";
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error("Image file size must be less than 10MB.");
      event.target.value = "";
      return;
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title.trim()) return toast.error("Title is required.");

    if (status === "published" && !selectedFile && !form.featured_image_url) {
      return toast.error("Please select a featured image before publishing.");
    }

    setLoading(true);
    setPublishingState(selectedFile ? "uploading" : "saving");

    let finalImageUrl = form.featured_image_url;

    if (selectedFile) {
      try {
        finalImageUrl = await uploadToStorage(selectedFile);
      } catch (err: any) {
        setLoading(false);
        setPublishingState("idle");
        console.error("Featured image upload error detail:", err);
        toast.error(`Featured image upload failed: ${err?.message || "Please check storage permissions"}`);
        return;
      }
    }



    setPublishingState("saving");

    const finalSlug = form.slug ? slugify(form.slug) : slugify(form.title);
    const payload = {
      title: form.title.trim(),
      slug: finalSlug,
      category: form.category,
      subcategory: form.subcategory,
      author_name: form.author_name,
      author_title: form.author_title,
      excerpt: form.excerpt,
      body: form.body,
      featured_image_url: finalImageUrl,
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
    setPublishingState("idle");

    if (error) {
      toast.error(`The image was uploaded, but the article could not be saved: ${error.message}`);
      return;
    }

    await logActivity(id ? "edited" : "created", "article", id ?? form.title);
    toast.success(status === "published" ? "Article published successfully!" : "Draft saved!");
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
            <button
              disabled={loading}
              onClick={() => save("draft")}
              className="w-full border border-border py-2 text-sm font-bold uppercase hover:bg-accent disabled:opacity-50"
            >
              {loading && publishingState === "uploading" ? "Uploading Image..." : loading ? "Saving..." : "Save Draft"}
            </button>
            <button
              disabled={loading}
              onClick={() => save("published")}
              className="w-full bg-brand text-brand-foreground py-2 text-sm font-bold uppercase hover:bg-primary disabled:opacity-50"
            >
              {loading && publishingState === "uploading" ? "Uploading Image..." : loading && publishingState === "saving" ? "Publishing..." : "Publish"}
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
              <label className="text-xs font-bold uppercase tracking-wider block mb-1">Featured Image</label>
              {previewUrl ? (
                <div className="mb-2">
                  <img src={previewUrl} alt="Selected preview" className="w-full aspect-[16/9] object-cover border border-border rounded-sm" />
                  <p className="text-[10px] text-muted-foreground mt-1">Local preview (will be uploaded on Publish)</p>
                </div>
              ) : form.featured_image_url ? (
                <div className="mb-2">
                  <StorageImage src={form.featured_image_url} className="w-full aspect-[16/9] object-cover border border-border rounded-sm" />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={loading}
                onChange={handleFileSelect}
                className="text-xs block w-full border border-border px-2 py-1 bg-background"
              />
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

