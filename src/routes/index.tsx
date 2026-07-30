import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Ticker } from "@/components/site/Ticker";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { Sidebar } from "@/components/site/Sidebar";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { MagazineCarousel, type MagazineLite } from "@/components/site/MagazineCarousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CIO Times — Business & Technology Journal for Enterprise Leaders" },
      { name: "description", content: "In-depth reporting on AI, cloud, cybersecurity, and IT leadership for CIOs and enterprise executives." },
      { property: "og:title", content: "CIO Times — Business & Technology Journal" },
      { property: "og:description", content: "In-depth reporting for CIOs and enterprise technology leaders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [magazines, setMagazines] = useState<MagazineLite[]>([]);

  useEffect(() => {
    supabase
      .from("articles")
      .select("id,slug,title,category,excerpt,featured_image_url,author_name,published_at,view_count")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(50)
      .then(({ data }) => data && setArticles(data as ArticleLite[]));
    supabase
      .from("magazines")
      .select("id,title,cover_image_url,issue_month,issue_year")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => data && setMagazines(data as MagazineLite[]));
  }, []);

  const trending = articles.slice(0, 5);
  const mostRead = [...articles].sort((a: any, b: any) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 4);
  const grouped = useMemo(() => {
    const m: Record<string, ArticleLite[]> = {};
    for (const a of articles) (m[a.category] ??= []).push(a);
    return m;
  }, [articles]);

  const featured = articles[0];
  const secondary = articles.slice(1, 5);
  const grid = articles.slice(5, 17);

  return (
    <SiteLayout>
      <Ticker items={articles.slice(0, 8).map((a) => ({ slug: a.slug, title: a.title, category: a.category, featured_image_url: a.featured_image_url }))} />

      {/* Hero band */}
      <div className="bg-navy text-navy-foreground">
        <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-brand text-[11px] font-bold uppercase tracking-[0.3em]">The Enterprise Edition</div>
            <h1 className="text-2xl md:text-4xl font-black mt-1" style={{ fontFamily: "Georgia, serif" }}>
              Stories of leaders shaping the digital economy
            </h1>
          </div>
          <Link to="/magazines" className="self-start bg-brand text-brand-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.2em]">
            Latest Issue
          </Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div>
          {featured && (
            <>
              <div className="divider-thick mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                <ArticleCard a={featured} size="lg" />
                <div className="space-y-0">
                  {secondary.map((a) => <ArticleCard key={a.id} a={a} size="sm" />)}
                </div>
              </div>
            </>
          )}

          <div className="divider-thick mt-10 mb-4" />
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy mb-4">Latest News</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            {grid.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>

          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mt-12">
              <div className="divider-thick mb-4" />
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide text-navy">{cat}</h2>
                <Link to="/industry/$slug" params={{ slug: slugFor(cat) }} className="text-xs uppercase tracking-widest text-brand font-bold">
                  More →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                {items.slice(0, 3).map((a) => <ArticleCard key={a.id} a={a} />)}
              </div>
            </div>
          ))}

          <NewsletterSignup />
        </div>

        <Sidebar trending={trending} mostRead={mostRead} magazines={magazines} />
      </div>

      <MagazineCarousel items={magazines} />
    </SiteLayout>
  );
}

function slugFor(name: string) {
  return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}
