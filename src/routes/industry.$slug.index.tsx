import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";

export const Route = createFileRoute("/industry/$slug/")({
  head: () => ({
    meta: [
      { title: "Industry Section — CIO Times" },
      { name: "description", content: "Latest reporting and analysis from this CIO Times industry section." },
      { property: "og:title", content: "Industry Section — CIO Times" },
      { property: "og:description", content: "Latest reporting and analysis from this CIO Times industry section." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndustryPage,
});

interface Cat { name: string; slug: string; parent_category: string | null; }

function IndustryPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<Cat | null>(null);
  const [subs, setSubs] = useState<Cat[]>([]);
  const [articles, setArticles] = useState<ArticleLite[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: c } = await supabase.from("categories").select("name,slug,parent_category").eq("slug", slug).maybeSingle();
      if (!alive) return;
      setCat(c as Cat | null);
      const { data: s } = await supabase.from("categories").select("name,slug,parent_category").eq("parent_category", slug).order("name");
      if (!alive) return;
      setSubs((s ?? []) as Cat[]);
      if (c) {
        const { data: a } = await supabase
          .from("articles")
          .select("id,slug,title,category,excerpt,featured_image_url,author_name,published_at")
          .eq("status", "published")
          .eq("category", c.name)
          .order("published_at", { ascending: false })
          .limit(30);
        if (alive) setArticles((a ?? []) as ArticleLite[]);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <div className="text-xs uppercase tracking-[0.25em] text-brand font-bold">Industry</div>
        <h1 className="text-4xl font-bold text-navy">{cat?.name ?? "Industry"}</h1>

        {subs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {subs.map((s) => (
              <Link key={s.slug} to="/industry/$slug/$sub" params={{ slug, sub: s.slug }}
                className="border-2 border-navy text-navy px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-navy hover:text-navy-foreground">
                {s.name}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 mt-8">
          {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
        {articles.length === 0 && <p className="text-muted-foreground mt-8">No stories published in this industry yet.</p>}
      </div>
    </SiteLayout>
  );
}
