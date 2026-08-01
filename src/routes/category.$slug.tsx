import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { Sidebar } from "@/components/site/Sidebar";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — CIO Times` },
      { name: "description", content: `Latest ${prettify(params.slug)} news and analysis from CIO Times.` },
      { property: "og:title", content: `${prettify(params.slug)} — CIO Times` },
      { property: "og:description", content: `Latest ${prettify(params.slug)} coverage.` },
    ],
  }),
  component: CategoryPage,
});

function prettify(slug: string) {
  return slug.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const [category, setCategory] = useState<{ name: string; slug: string } | null>(null);
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [page, setPage] = useState(0);
  const perPage = 12;

  useEffect(() => {
    supabase.from("categories").select("name,slug").eq("slug", slug).maybeSingle().then(({ data }) => {
      if (data) setCategory(data);
    });
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    supabase.from("articles")
      .select("id,slug,title,category,excerpt,featured_image_url,author_name,published_at")
      .eq("status", "published")
      .eq("category", category.name)
      .order("published_at", { ascending: false })
      .range(page * perPage, page * perPage + perPage - 1)
      .then(({ data }) => setArticles(data as ArticleLite[] ?? []));
  }, [category, page]);

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="divider-thick mb-3" />
          <h1 className="text-4xl font-bold">{category?.name ?? prettify(slug)}</h1>
          <p className="text-muted-foreground mt-1 mb-6">Latest analysis and reporting</p>
          {articles.length === 0 && <p className="text-muted-foreground">No articles yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
          <div className="flex justify-between mt-8">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="text-sm font-bold uppercase tracking-wide text-brand disabled:opacity-30">← Previous</button>
            <button disabled={articles.length < perPage} onClick={() => setPage(page + 1)} className="text-sm font-bold uppercase tracking-wide text-brand disabled:opacity-30">Next →</button>
          </div>
          <div className="mt-8">
            <Link to="/" className="text-xs uppercase tracking-widest text-brand font-bold">← Back to home</Link>
          </div>
        </div>
        <Sidebar trending={articles.slice(0, 12)} mostRead={articles.slice(0, 12)} />
      </div>
    </SiteLayout>
  );
}
