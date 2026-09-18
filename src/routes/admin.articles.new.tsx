```tsx
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

const MEDIA_BUCKET = "CEO MEDIA MAGZINE PUNE";

export function ArticleForm({ id }: Props) {
  const navigate = useNavigate();

  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(Boolean(id));
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState<ArticleFormData>(INITIAL_FORM);

  /**
   * Update a single form field.
   */
  const setField = <K extends keyof ArticleFormData>(
    key: K,
    value: ArticleFormData[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /**
   * Load categories.
   */
  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("name")
      .order("name");

    if (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
      return;
    }

    setCats((data ?? []).map((category) => category.name));
  };

  /**
   * Load article when editing.
   */
  const loadArticle = async () => {
    if (!id) {
      setLoadingArticle(false);
      return;
    }

    setLoadingArticle(true);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    setLoadingArticle(false);

    if (error) {
      console.error("Failed to load article:", error);
      toast.error("Failed to load article");
      return;
    }

    if (!data) {
      toast.error("Article not found");
      navigate({ to: "/admin/articles" });
      return;
    }

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
  };

  /**
   * Initial data loading.
   */
  useEffect(() => {
    void loadCategories();
    void loadArticle();
  }, [id]);

  /**
   * Upload featured image.
   */
  const handleImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploadingImage(true);

    try {
      /*
       * Pass the selected file to uploadFile.
       * If your uploadFile helper uses a different signature,
       * adjust this call to match that helper.
       */
      const url = await uploadFile(MEDIA_BUCKET, file);

      setField("featured_image_url", url);

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Image upload failed:", error);

      toast.error(
        error?.message || "Failed to upload image",
      );
    } finally {
      setUploadingImage(false);

      // Allow selecting the same file again.
      event.target.value = "";
    }
  };

  /**
   * Generate a unique article slug.
   */
  const getUniqueSlug = async (value: string) => {
    const base =
      slugify
```
