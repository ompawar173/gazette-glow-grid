import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { Sidebar } from "@/components/site/Sidebar";
import { BacklinkList } from "@/components/site/BacklinkList";

export const Route = createFileRoute("/article/$slug")({
  component: ArticlePage,
});

interface Article extends ArticleLite {
  author_title: string | null;
  body: string;
  subcategory: string | null;
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<ArticleLite[]>([]);
  const [magazines, setMagazines] = useState<any[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);
    setArticle(null);
    supabase.from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setNotFound(true); return; }
        setArticle(data as Article);
        supabase.rpc("increment_article_views", { _slug: slug });
        document.title = `${data.title} — CIO Times`;
        supabase.from("articles")
          .select("id,slug,title,category,excerpt,featured_image_url,author_name,published_at")
          .eq("status", "published")
          .eq("category", data.category)
          .neq("id", data.id)
          .order("published_at", { ascending: false })
          .limit(4)
          .then(({ data: r }) => setRelated((r as ArticleLite[]) ?? []));
      });
    supabase.from("magazines").select("id,title,cover_image_url,issue_month,issue_year").eq("status", "published").limit(4).then(({ data }) => setMagazines(data ?? []));
  }, [slug]);

  if (notFound) return <SiteLayout><div className="max-w-[900px] mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Article not found</h1><Link to="/" className="text-brand mt-3 inline-block">Back home</Link></div></SiteLayout>;
  if (!article) return <SiteLayout><div className="max-w-[900px] mx-auto px-4 py-16">Loading…</div></SiteLayout>;

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <article>
          <div className="tag-chip">{article.category}{article.subcategory ? ` · ${article.subcategory}` : ""}</div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-2">{article.title}</h1>
          {article.excerpt && <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>}
          <div className="mt-4 pb-4 border-b border-border text-sm">
            <span className="font-bold">{article.author_name}</span>
            {article.author_title && <span className="text-muted-foreground"> · {article.author_title}</span>}
            {article.published_at && <span className="text-muted-foreground"> · {new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}
          </div>
          {article.featured_image_url && (
            <StorageImage src={article.featured_image_url} alt={article.title} className="w-full aspect-[16/9] object-cover my-6" />
          )}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body }} />

          <BacklinkList targetType="article" targetId={article.id} title="Related Links & Sources" />

          {related.length > 0 && (
            <div className="mt-10">
              <div className="divider-thick mb-4" />
              <h3 className="text-xl font-bold uppercase tracking-wide mb-4">Related in {article.category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map((r) => <ArticleCard key={r.id} a={r} />)}
              </div>
            </div>
          )}
        </article>
        <Sidebar trending={related} mostRead={related} />
      </div>
    </SiteLayout>
  );
}
