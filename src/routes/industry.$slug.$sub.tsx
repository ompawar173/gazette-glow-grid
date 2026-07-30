import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";

export const Route = createFileRoute("/industry/$slug/$sub")({
  head: () => ({
    meta: [
      { title: "Sub-Industry Coverage — CIO Times" },
      { name: "description", content: "Focused reporting from a CIO Times sub-industry branch." },
      { property: "og:title", content: "Sub-Industry Coverage — CIO Times" },
      { property: "og:description", content: "Focused reporting from a CIO Times sub-industry branch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubIndustryPage,
});

function SubIndustryPage() {
  const { slug, sub } = Route.useParams();
  const [names, setNames] = useState<{ parent: string; child: string }>({ parent: "", child: "" });
  const [articles, setArticles] = useState<ArticleLite[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: cs } = await supabase.from("categories").select("name,slug").in("slug", [slug, sub]);
      if (!alive) return;
      const parent = cs?.find((c) => c.slug === slug)?.name ?? "";
      const child = cs?.find((c) => c.slug === sub)?.name ?? "";
      setNames({ parent, child });
      if (child) {
        const { data: a } = await supabase
          .from("articles")
          .select("id,slug,title,category,excerpt,featured_image_url,author_name,published_at")
          .eq("status", "published")
          .eq("subcategory", child)
          .order("published_at", { ascending: false })
          .limit(30);
        if (alive) setArticles((a ?? []) as ArticleLite[]);
      }
    })();
    return () => { alive = false; };
  }, [slug, sub]);

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <div className="text-xs uppercase tracking-[0.25em] text-brand font-bold">
          <Link to="/industry/$slug" params={{ slug }} className="hover:underline">{names.parent || "Industry"}</Link>
        </div>
        <h1 className="text-4xl font-bold text-navy">{names.child || "Sub-industry"}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 mt-8">
          {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
        {articles.length === 0 && <p className="text-muted-foreground mt-8">No stories published in this sub-industry yet.</p>}
      </div>
    </SiteLayout>
  );
}
