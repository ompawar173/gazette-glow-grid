import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate } from "@/components/admin/AdminGate";
import { uploadFile } from "@/lib/upload";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import { StorageImage } from "@/components/site/StorageImage";
import { triggerPublicationEmail } from "@/lib/newsletter.server";

interface ArticleItem {
  id: string;
  title: string;
  category: string;
}

export function MagazineForm({ id }: { id?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    issue_month: "",
    issue_year: new Date().getFullYear(),
    cover_image_url: "",
    pdf_file_url: "",
    heyzine_url: "",
    issuu_url: "",
    status: "draft",
  });

  const [allArticles, setAllArticles] = useState<ArticleItem[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<ArticleItem[]>([]);
  const [articleQuery, setArticleQuery] = useState("");

  useEffect(() => {
    // Fetch all published articles for selection
    supabase
      .from("articles")
      .select("id,title,category")
      .eq("status", "published")
      .order("title")
      .then(({ data }) => {
        if (data) setAllArticles(data as ArticleItem[]);
      });

    // If editing existing magazine, load magazine fields & related articles
    if (id) {
      supabase
        .from("magazines")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setForm(data);
        });

      supabase
        .from("magazine_articles")
        .select("article_id, sort_order")
        .eq("magazine_id", id)
        .order("sort_order", { ascending: true })
        .then(async ({ data: rels }) => {
          if (rels && rels.length > 0) {
            const articleIds = rels.map((r) => r.article_id);
            const { data: arts } = await supabase
              .from("articles")
              .select("id,title,category")
              .in("id", articleIds);

            if (arts) {
              const map = new Map(arts.map((a) => [a.id, a as ArticleItem]));
              const ordered = articleIds.map((aid) => map.get(aid)).filter(Boolean) as ArticleItem[];
              setSelectedArticles(ordered);
            }
          }
        });
    }
  }, [id]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const upload = async (bucket: string, e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadFile(bucket, f);
      set(field, url);
      toast.success("Uploaded");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const addArticle = (article: ArticleItem) => {
    if (selectedArticles.some((a) => a.id === article.id)) {
      return toast.info("Article already selected");
    }
    setSelectedArticles((prev) => [...prev, article]);
    setArticleQuery("");
  };

  const removeArticle = (index: number) => {
    setSelectedArticles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveArticle = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= selectedArticles.length) return;
    const copy = [...selectedArticles];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setSelectedArticles(copy);
  };

  const filteredArticles = useMemo(() => {
    if (!articleQuery.trim()) return [];
    const q = articleQuery.toLowerCase();
    const selectedSet = new Set(selectedArticles.map((a) => a.id));
    return allArticles.filter(
      (a) => !selectedSet.has(a.id) && (a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
    );
  }, [allArticles, selectedArticles, articleQuery]);

  const save = async (status: "draft" | "published") => {
    if (!form.title) return toast.error("Title required");

    if (form.heyzine_url && form.heyzine_url.trim() !== "") {
      const trimmedUrl = form.heyzine_url.trim();
      try {
        const parsed = new URL(trimmedUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return toast.error("Heyzine URL must be a valid http or https web address");
        }
      } catch {
        return toast.error("Invalid Heyzine Flipbook URL format");
      }
    }

    setLoading(true);

    const payload: any = {
      title: form.title,
      issue_month: form.issue_month || null,
      issue_year: Number(form.issue_year),
      cover_image_url: form.cover_image_url || null,
      pdf_file_url: form.pdf_file_url || null,
      status: status,
    };

    if (form.heyzine_url && form.heyzine_url.trim() !== "") {
      payload.heyzine_url = form.heyzine_url.trim();
    } else {
      payload.heyzine_url = null;
    }

    if (form.issuu_url && form.issuu_url.trim() !== "") {
      payload.issuu_url = form.issuu_url.trim();
    } else {
      payload.issuu_url = null;
    }

    let error;
    let savedMagId = id;

    if (id) {
      const res = await supabase.from("magazines").update(payload).eq("id", id);
      error = res.error;

      if (error && error.message.includes("heyzine_url")) {
        delete payload.heyzine_url;
        const retryRes = await supabase.from("magazines").update(payload).eq("id", id);
        error = retryRes.error;
      }
      if (error && error.message.includes("issuu_url")) {
        delete payload.issuu_url;
        const retryRes = await supabase.from("magazines").update(payload).eq("id", id);
        error = retryRes.error;
      }
    } else {
      let res = await supabase.from("magazines").insert(payload).select("id").single();
      error = res.error;

      if (error && error.message.includes("heyzine_url")) {
        delete payload.heyzine_url;
        res = await supabase.from("magazines").insert(payload).select("id").single();
        error = res.error;
      }
      if (error && error.message.includes("issuu_url")) {
        delete payload.issuu_url;
        res = await supabase.from("magazines").insert(payload).select("id").single();
        error = res.error;
      }
      if (res.data?.id) savedMagId = res.data.id;
    }

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    // Sync related articles in magazine_articles table
    if (savedMagId) {
      try {
        await supabase.from("magazine_articles").delete().eq("magazine_id", savedMagId);
        if (selectedArticles.length > 0) {
          const relRows = selectedArticles.map((art, idx) => ({
            magazine_id: savedMagId,
            article_id: art.id,
            sort_order: idx,
          }));
          await supabase.from("magazine_articles").insert(relRows);
        }
      } catch (relErr) {
        console.error("Error saving magazine_articles relations:", relErr);
      }
    }

    setLoading(false);

    if (status === "published") {
      const result = await triggerPublicationEmail({
        type: "magazine",
        id: savedMagId || form.title,
        title: form.title,
        excerpt: `New issue published: ${form.issue_month || ""} ${form.issue_year || ""}`,
        imageUrl: form.cover_image_url,
        issue_month: form.issue_month,
        issue_year: form.issue_year,
      });

      if (result.duplicate) {
        toast.info("Duplicate send prevented: Magazine newsletter was already sent.");
      } else if (result.success) {
        toast.success(`Newsletter broadcast prepared for ${result.recipientCount} active subscriber(s).`);
      }
    }

    await logActivity(id ? "edited" : "created", "magazine", id ?? form.title);
    toast.success("Magazine saved successfully");
    navigate({ to: "/admin/magazines" });
  };

  return (
    <AdminGate title={id ? "Edit Magazine Issue" : "Upload Magazine Issue"}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        <div className="md:col-span-2 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Title</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full px-3 py-2 border border-border mt-1 text-sm bg-background focus:border-navy outline-none"
              placeholder="e.g. The AI Leadership Issue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Issue Month</label>
              <input
                value={form.issue_month ?? ""}
                onChange={(e) => set("issue_month", e.target.value)}
                placeholder="e.g. November"
                className="w-full px-3 py-2 border border-border mt-1 text-sm bg-background focus:border-navy outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Issue Year</label>
              <input
                type="number"
                value={form.issue_year ?? ""}
                onChange={(e) => set("issue_year", e.target.value)}
                className="w-full px-3 py-2 border border-border mt-1 text-sm bg-background focus:border-navy outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Cover Image</label>
            {form.cover_image_url && (
              <StorageImage src={form.cover_image_url} className="w-32 aspect-[3/4] object-cover border border-border mt-2" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload("magazine-covers", e, "cover_image_url")}
              className="text-xs mt-2 block"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy">PDF File (Existing Storage Upload)</label>
            {form.pdf_file_url && (
              <a href={form.pdf_file_url} target="_blank" rel="noreferrer" className="block text-brand text-xs font-bold mt-1">
                Current PDF Document ↗
              </a>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => upload("magazine-pdfs", e, "pdf_file_url")}
              className="text-xs mt-2 block"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Heyzine Flipbook URL (Embedded Reader)</label>
              <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 border border-brand/20">RECOMMENDED</span>
            </div>
            <input
              type="url"
              value={form.heyzine_url ?? ""}
              onChange={(e) => set("heyzine_url", e.target.value)}
              placeholder="https://heyzine.com/flip-book/e44ce7f9b7.html"
              className="w-full px-3 py-2 border border-border mt-1 text-sm bg-background focus:border-navy outline-none font-mono text-navy"
            />
            {form.heyzine_url && form.heyzine_url.trim() !== "" && (
              <div className="mt-2 p-2 bg-secondary/30 border border-border text-xs break-all">
                <span className="font-bold text-navy block text-[10px] uppercase tracking-wider">Heyzine Embedded URL Preview:</span>
                <a
                  href={form.heyzine_url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline font-mono text-[11px] font-medium inline-block mt-0.5"
                >
                  {form.heyzine_url.trim()} ↗
                </a>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              Enter your Heyzine flipbook URL (e.g. https://heyzine.com/flip-book/e44ce7f9b7.html). This will render an interactive embedded flipbook directly on the magazine detail page.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Issue.com Flipbook URL (Optional Fallback)</label>
            <input
              type="url"
              value={form.issuu_url ?? ""}
              onChange={(e) => set("issuu_url", e.target.value)}
              placeholder="https://issuu.com/username/docs/magazine-title"
              className="w-full px-3 py-2 border border-border mt-1 text-sm bg-background focus:border-navy outline-none font-mono text-navy"
            />
            {form.issuu_url && form.issuu_url.trim() !== "" && (
              <div className="mt-2 p-2 bg-secondary/30 border border-border text-xs break-all">
                <span className="font-bold text-navy block text-[10px] uppercase tracking-wider">Full Stored URL Preview:</span>
                <a
                  href={form.issuu_url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline font-mono text-[11px] font-medium inline-block mt-0.5"
                >
                  {form.issuu_url.trim()} ↗
                </a>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              Enter your complete Issue.com (Issuu) digital reader link. This exact full URL will be used for the public reader.
            </p>
          </div>

          {/* Related Articles Selector */}
          <div className="border border-border p-4 bg-secondary/20 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Articles From This Issue (Related Articles)</h3>
            <p className="text-xs text-muted-foreground">
              Select existing articles to display under this magazine edition.
            </p>

            <div className="relative">
              <input
                value={articleQuery}
                onChange={(e) => setArticleQuery(e.target.value)}
                placeholder="Search articles by title or category..."
                className="w-full px-3 py-2 border border-border text-xs bg-background focus:border-navy outline-none"
              />
              {filteredArticles.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-border shadow-lg max-h-48 overflow-y-auto z-20">
                  {filteredArticles.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => addArticle(art)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-brand/10 border-b border-border/50 flex justify-between items-center"
                    >
                      <span className="font-medium truncate pr-2">{art.title}</span>
                      <span className="text-[10px] text-brand font-bold uppercase">{art.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedArticles.length > 0 ? (
              <div className="space-y-2 mt-3">
                <div className="text-[11px] font-bold text-muted-foreground uppercase">Selected Articles ({selectedArticles.length}):</div>
                {selectedArticles.map((art, idx) => (
                  <div key={art.id} className="flex items-center justify-between bg-background border border-border px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-bold mr-2 text-navy">{idx + 1}.</span>
                      <span className="truncate">{art.title}</span>
                      <span className="ml-2 text-[10px] tag-chip">{art.category}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveArticle(idx, "up")}
                        className="px-2 py-0.5 border border-border text-[10px] disabled:opacity-30"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={idx === selectedArticles.length - 1}
                        onClick={() => moveArticle(idx, "down")}
                        className="px-2 py-0.5 border border-border text-[10px] disabled:opacity-30"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeArticle(idx)}
                        className="px-2 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic py-2">No articles linked to this issue yet.</div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-background border border-border p-4 space-y-3 sticky top-4">
            <div className="text-xs font-bold uppercase tracking-wider text-navy">Publishing Control</div>
            <div className="text-xs">
              Status: <b className="uppercase">{form.status}</b>
            </div>
            <button
              disabled={loading}
              onClick={() => save("draft")}
              className="w-full border border-navy text-navy py-2 text-sm font-bold uppercase tracking-wider hover:bg-secondary"
            >
              Save Draft
            </button>
            <button
              disabled={loading}
              onClick={() => save("published")}
              className="w-full bg-brand text-brand-foreground py-2 text-sm font-bold uppercase tracking-wider hover:bg-brand/90"
            >
              Publish Magazine
            </button>
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
