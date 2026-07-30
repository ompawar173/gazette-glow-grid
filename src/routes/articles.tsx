import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";

export const Route = createFileRoute("/articles")({
  head: () => ({
    meta: [
      { title: "All Articles — CIO Times" },
      { name: "description", content: "Browse and search every published story from the CIO Times newsroom." },
      { property: "og:title", content: "All Articles — CIO Times" },
      { property: "og:description", content: "Browse and search every published story from CIO Times." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setQ(new URL(window.location.href).searchParams.get("q") ?? "");
    supabase
      .from("articles")
      .select("id,slug,title,category,excerpt,featured_image_url,author_name,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setArticles((data ?? []) as ArticleLite[]));
  }, []);

  const filtered = useMemo(() => {
    if (!q) return articles;
    const s = q.toLowerCase();
    return articles.filter((a) => a.title.toLowerCase().includes(s) || (a.excerpt ?? "").toLowerCase().includes(s));
  }, [q, articles]);

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">Articles</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles..."
          className="w-full md:w-96 mt-4 px-3 py-2 border-2 border-border focus:border-navy outline-none bg-background text-sm"
        />
        <div className="text-sm text-muted-foreground mt-2">{filtered.length} stories</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8 mt-8">
          {filtered.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      </div>
    </SiteLayout>
  );
}
