import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Ticker } from "@/components/site/Ticker";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { Sidebar } from "@/components/site/Sidebar";
import { MagazineCarousel, type MagazineLite } from "@/components/site/MagazineCarousel";
import { getHomePage } from "@/lib/content.functions";
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteImageUrl,
  absoluteUrl,
  graph,
  pageMeta,
} from "@/lib/seo";

const TITLE = "CIO Media World | Enterprise Technology News & Insights";
const DESCRIPTION =
  "CIO Media World delivers insight and reporting on AI, cybersecurity, cloud infrastructure, and the technology leaders shaping the digital economy.";

export const Route = createFileRoute("/")({
  loader: () => getHomePage().catch(() => ({ articles: [], latestArticles: [], magazines: [], categories: [] })),
  head: ({ loaderData }) => {
    const articles = loaderData?.articles ?? [];
    const base = pageMeta({
      title: TITLE,
      description: DESCRIPTION,
      path: "/",
      image: articles[0]?.featured_image_url ?? null,
    });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: graph({
            "@type": "CollectionPage",
            "@id": `${SITE_URL}/#webpage`,
            url: SITE_URL,
            name: TITLE,
            description: DESCRIPTION,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: articles.slice(0, 10).map((a, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/article/${a.slug}`),
                name: a.title,
                ...(a.featured_image_url ? { image: absoluteImageUrl(a.featured_image_url) } : {}),
              })),
            },
          }),
        },
      ],
    };
  },
  component: Home,
});

function Home() {
  const loaderData = Route.useLoaderData();
  const [articles, setArticles] = useState<(ArticleLite & { view_count?: number; is_latest?: boolean })[]>(
    ((loaderData?.articles ?? []) as (ArticleLite & { view_count?: number; is_latest?: boolean })[])
  );
  const [magazines, setMagazines] = useState<MagazineLite[]>(
    ((loaderData?.magazines ?? []) as MagazineLite[])
  );
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>(
    ((loaderData?.categories ?? []) as { name: string; slug: string }[])
  );

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      supabase
        .from("articles")
        .select("id,slug,title,category,subcategory,excerpt,featured_image_url,author_name,published_at,view_count,is_latest")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50),
      supabase
        .from("magazines")
        .select("id,title,cover_image_url,issue_month,issue_year")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("name,slug,parent_category").order("name"),
    ])
      .then(([{ data: fetchedArts }, { data: fetchedMags }, { data: fetchedCats }]) => {
        if (!isMounted) return;
        if (fetchedArts && fetchedArts.length > 0) {
          setArticles(fetchedArts as (ArticleLite & { view_count?: number; is_latest?: boolean })[]);
        }
        if (fetchedMags && fetchedMags.length > 0) {
          setMagazines(fetchedMags as MagazineLite[]);
        }
        if (fetchedCats && fetchedCats.length > 0) {
          setCategories(fetchedCats as { name: string; slug: string }[]);
        }
      })
      .catch((err) => {
        console.error("Error fetching homepage data client-side:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const latestArticles = useMemo(() => {
    const selectedLatest = articles.filter((a) => a.is_latest);
    return selectedLatest.length > 0 ? selectedLatest : articles.slice(0, 8);
  }, [articles]);

  const slugFor = (name: string) =>
    categories.find((c) => c.name === name)?.slug ??
    name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

  const trending = useMemo(() => articles.slice(0, 12), [articles]);
  const mostRead = useMemo(
    () => [...articles].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0)).slice(0, 12),
    [articles]
  );
  const grouped = useMemo(() => {
    const m: Record<string, ArticleLite[]> = {};
    for (const a of articles) (m[a.category] ??= []).push(a);
    return m;
  }, [articles]);

  const featured = articles[0];
  const secondary = useMemo(() => articles.slice(1, 5), [articles]);
  const grid = useMemo(() => articles.slice(5, 17), [articles]);

  return (
    <SiteLayout>
      <Ticker items={latestArticles.map((a) => ({ slug: a.slug, title: a.title, category: a.category, featured_image_url: a.featured_image_url }))} />

      {/* Hero band */}
      <div className="bg-navy text-navy-foreground">
        <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-brand text-[11px] font-bold uppercase tracking-[0.3em]">The Enterprise Edition</p>
            <h1 className="text-2xl md:text-4xl font-black mt-1">
              Enterprise Technology News &amp; Insights for CIOs and Business Leaders
            </h1>
          </div>
          <Link to="/magazines" className="self-start bg-brand text-brand-foreground px-6 py-3 text-xs font-bold uppercase tracking-[0.2em]">
            Latest Issue
          </Link>
        </div>
      </div>

      <MagazineCarousel items={magazines} />

      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div>
          {featured && (
            <section aria-label="Top story">
              <div className="divider-thick mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                <ArticleCard a={featured} size="lg" priority />
                <div className="space-y-0">
                  {secondary.map((a) => <ArticleCard key={a.id} a={a} size="sm" />)}
                </div>
              </div>
            </section>
          )}

          <section aria-label="Latest news">
            <div className="divider-thick mt-10 mb-4" />
            <h2 className="text-xl font-bold uppercase tracking-wide text-navy mb-4">Latest News</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
              {grid.map((a) => <ArticleCard key={a.id} a={a} />)}
            </div>
          </section>

          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} className="mt-12" aria-label={cat}>
              <div className="divider-thick mb-4" />
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide text-navy">{cat}</h2>
                <Link to="/industry/$slug" params={{ slug: slugFor(cat) }} className="text-xs uppercase tracking-widest text-brand font-bold">
                  More <span aria-hidden="true">→</span>
                  <span className="sr-only">{`stories in ${cat}`}</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                {items.slice(0, 3).map((a) => <ArticleCard key={a.id} a={a} />)}
              </div>
            </section>
          ))}
        </div>

        <Sidebar trending={trending} mostRead={mostRead} />
      </div>
    </SiteLayout>
  );
}
