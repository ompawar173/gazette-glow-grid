import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Ticker } from "@/components/site/Ticker";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { Sidebar } from "@/components/site/Sidebar";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { Link } from "@tanstack/react-router";

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

interface Magazine { id: string; title: string; cover_image_url: string | null; issue_month: string | null; issue_year: number | null; }

function Home() {
  const [articles, setArticles] = useState<ArticleLite[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    setQ(url.searchParams.get("q") ?? "");
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
      .then(({ data }) => data && setMagazines(data));
  }, []);

  const filtered = useMemo(
    () => q ? articles.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())) : articles,
    [q, articles]
  );

  const trending = articles.slice(0, 5);
  const mostRead = [...articles].sort((a: any, b: any) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 4);
  const grouped = useMemo(() => {
    const m: Record<string, ArticleLite[]> = {};
    for (const a of articles) (m[a.category] ??= []).push(a);
    return m;
  }, [articles]);

  const featured = filtered[0];
  const secondary = filtered.slice(1, 5);
  const grid = filtered.slice(5, 17);

  return (
    <SiteLayout>
      <Ticker items={articles.slice(0, 8).map((a) => ({ slug: a.slug, title: a.title, category: a.category, featured_image_url: a.featured_image_url }))} />

      {/* Mobile search */}
      <div className="md:hidden max-w-[1200px] mx-auto px-4 py-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); navigate({ to: "/", search: {} }); }}
          placeholder="Search articles..."
          className="w-full px-3 py-2 border border-border text-sm"
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          {q && <div className="mb-4 text-sm text-muted-foreground">Showing {filtered.length} results for "{q}"</div>}

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

          <div className="divider-thick mt-8 mb-4" />
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">Latest News</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            {grid.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>

          {magazines.length > 0 && (
            <>
              <div className="divider-thick mt-10 mb-4" />
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide">Digital Magazine Issues</h2>
                <Link to="/magazines" className="text-xs uppercase tracking-widest text-brand font-bold">View all →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {magazines.slice(0, 4).map((m) => (
                  <Link key={m.id} to="/magazines/$id" params={{ id: m.id }} className="block group">
                    {m.cover_image_url && (
                      <img src={m.cover_image_url} alt={m.title} className="w-full aspect-[3/4] object-cover border border-border group-hover:opacity-90" />
                    )}
                    <div className="tag-chip mt-2">{m.issue_month} {m.issue_year}</div>
                    <div className="text-sm font-bold headline-link group-hover:text-brand">{m.title}</div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mt-10">
              <div className="divider-thick mb-4" />
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide">{cat}</h2>
                <Link to="/category/$slug" params={{ slug: slugFor(cat) }} className="text-xs uppercase tracking-widest text-brand font-bold">
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
    </SiteLayout>
  );
}

function slugFor(name: string) {
  return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}
