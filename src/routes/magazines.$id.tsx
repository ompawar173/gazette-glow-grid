import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { resolveStorageUrl } from "@/lib/storage";
import { BacklinkList } from "@/components/site/BacklinkList";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { getMagazinePage } from "@/lib/content.functions";
import { SITE_NAME, absoluteImageUrl, absoluteUrl, breadcrumbSchema, graph, pageMeta, truncate } from "@/lib/seo";

export const Route = createFileRoute("/magazines/$id")({
  loader: ({ params }) => getMagazinePage({ data: { id: params.id } }),
  head: ({ params, loaderData }) => {
    const m = loaderData?.magazine;
    if (!m) {
      return { meta: [{ title: `Issue not available — ${SITE_NAME}` }, { name: "robots", content: "noindex, follow" }] };
    }
    const path = `/magazines/${params.id}`;
    const issue = [m.issue_month, m.issue_year].filter(Boolean).join(" ");
    const description = truncate(
      `Read the ${issue} digital issue of ${SITE_NAME}: ${m.title}. Executive interviews, enterprise technology analysis and industry insight.`,
    );
    const base = pageMeta({
      title: `${m.title} — ${issue} Issue | ${SITE_NAME}`,
      description,
      path,
      image: m.cover_image_url,
      type: "article",
    });
    const image = absoluteImageUrl(m.cover_image_url);
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: graph(
            {
              "@type": "PublicationIssue",
              "@id": `${absoluteUrl(path)}#issue`,
              name: m.title,
              url: absoluteUrl(path),
              description,
              datePublished: m.created_at ?? undefined,
              ...(m.issue_month ? { issueNumber: `${m.issue_month} ${m.issue_year ?? ""}`.trim() } : {}),
              ...(image ? { image } : {}),
              isPartOf: {
                "@type": "Periodical",
                name: `${SITE_NAME} Magazine`,
                publisher: { "@id": `${absoluteUrl("/")}#organization` },
              },
            },
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Magazine", path: "/magazines" },
              { name: m.title, path },
            ]),
          ),
        },
      ],
    };
  },
  component: MagazineDetail,
});

function MagazineDetail() {
  const { id } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [m, setM] = useState<any>(loaderData?.magazine ?? null);
  const [issueArticles, setIssueArticles] = useState<ArticleLite[]>(loaderData?.articles ?? []);
  const [pdf, setPdf] = useState("");

  useEffect(() => {
    let alive = true;

    // Resolve PDF URL if pdf_file_url exists
    if (m?.pdf_file_url) {
      resolveStorageUrl(m.pdf_file_url).then((u) => alive && setPdf(u));
    }

    // Client-side fallback fetch for magazine and linked articles
    Promise.all([
      supabase.from("magazines").select("*").eq("id", id).eq("status", "published").maybeSingle(),
      supabase
        .from("magazine_articles")
        .select("article_id, sort_order")
        .eq("magazine_id", id)
        .order("sort_order", { ascending: true }),
    ]).then(async ([{ data: fetchedMag }, { data: rels }]) => {
      if (!alive) return;
      if (fetchedMag) {
        setM(fetchedMag);
        if (fetchedMag.pdf_file_url) {
          resolveStorageUrl(fetchedMag.pdf_file_url).then((u) => alive && setPdf(u));
        }
      }

      if (rels && rels.length > 0) {
        const articleIds = rels.map((r) => r.article_id);
        const { data: fetchedArticles } = await supabase
          .from("articles")
          .select("id,slug,title,category,subcategory,excerpt,featured_image_url,author_name,published_at")
          .in("id", articleIds)
          .eq("status", "published");

        if (fetchedArticles && alive) {
          const map = new Map(fetchedArticles.map((a) => [a.id, a as ArticleLite]));
          const ordered = articleIds.map((aid) => map.get(aid)).filter(Boolean) as ArticleLite[];
          setIssueArticles(ordered);
        }
      }
    });

    return () => {
      alive = false;
    };
  }, [id, m?.pdf_file_url]);

  if (!m) {
    return (
      <SiteLayout>
        <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-navy">Issue not available</h1>
          <p className="text-muted-foreground mt-2">This issue may be unpublished or no longer exists.</p>
          <Link
            to="/magazines"
            className="inline-block mt-6 bg-brand text-brand-foreground px-6 py-3 text-sm font-bold uppercase tracking-widest"
          >
            Browse all issues
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const rawHeyzine = m?.heyzine_url || m?.heyzineUrl;
  const heyzineUrl = typeof rawHeyzine === "string" ? rawHeyzine.trim() : "";
  const hasHeyzine = Boolean(heyzineUrl);

  const rawIssuu = m?.issuu_url || m?.issuuUrl || m?.flipbook_url;
  const issuuUrl = typeof rawIssuu === "string" ? rawIssuu.trim() : "";
  const hasIssuu = Boolean(issuuUrl);
  const hasPdf = Boolean(pdf);

  return (
    <SiteLayout>
      <div className="max-w-[1000px] mx-auto px-4 py-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <StorageImage
            src={m.cover_image_url}
            alt={`${m.title} — ${m.issue_month ?? ""} ${m.issue_year ?? ""} issue cover`}
            width={600}
            height={800}
            priority
            className="w-full aspect-[3/4] object-cover border border-border shadow-sm"
          />

          <div>
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
              <ol className="flex flex-wrap items-center gap-1">
                <li>
                  <Link to="/" className="hover:text-brand">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li>
                  <Link to="/magazines" className="hover:text-brand">
                    Magazine
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li aria-current="page" className="text-navy truncate max-w-[220px]">
                  {m.title}
                </li>
              </ol>
            </nav>

            <div className="tag-chip">
              {m.issue_month} {m.issue_year} Issue
            </div>
            <h1 className="text-4xl font-bold mt-1 text-navy">{m.title}</h1>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Read the full digital edition of this issue. Experience our executive reporting, technology leadership analysis, and special enterprise features.
            </p>

            <div className="mt-6 flex gap-3 flex-wrap items-center">
              {hasHeyzine ? (
                <a
                  href="#heyzine-reader"
                  className="bg-brand text-brand-foreground px-7 py-3.5 font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-brand/90 transition-colors shadow-sm"
                >
                  <span>READ FLIPBOOK</span>
                  <span aria-hidden="true">↓</span>
                </a>
              ) : hasIssuu ? (
                <a
                  href={issuuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand text-brand-foreground px-7 py-3.5 font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-brand/90 transition-colors shadow-sm"
                >
                  <span>READ MAGAZINE</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : hasPdf ? (
                <a
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand text-brand-foreground px-7 py-3.5 font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-brand/90 transition-colors shadow-sm"
                >
                  <span>READ MAGAZINE</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className="text-muted-foreground text-sm font-medium">Digital edition coming soon.</span>
              )}

              {hasPdf && (hasHeyzine || hasIssuu) && (
                <a
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-navy text-navy px-5 py-3 font-bold uppercase tracking-wider text-xs hover:bg-secondary transition-colors"
                >
                  Download PDF Edition ↗
                </a>
              )}

              <Link
                to="/magazines"
                className="border border-border text-muted-foreground hover:text-navy px-5 py-3 font-bold uppercase tracking-wider text-xs"
              >
                All Issues
              </Link>
            </div>

            <BacklinkList targetType="magazine" targetId={m.id} title="Related Links & Sources" />
          </div>
        </div>

        {/* Embedded Heyzine Flipbook Reader */}
        {hasHeyzine && (
          <section id="heyzine-reader" className="border border-border rounded overflow-hidden shadow-md bg-background scroll-mt-6">
            <div className="bg-navy text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-cyan">
                  Interactive Digital Edition
                </span>
              </div>
              <span className="text-xs font-semibold text-white/80 hidden sm:inline">
                {m.title} — {m.issue_month} {m.issue_year}
              </span>
            </div>
            <div className="w-full aspect-[4/3] min-h-[450px] max-h-[750px] md:h-[650px] bg-slate-100 relative">
              <iframe
                allowFullScreen
                allow="autoplay; fullscreen; clipboard-write"
                scrolling="no"
                className="w-full h-full border-0"
                src={heyzineUrl}
                title={`${m.title} — Heyzine Digital Flipbook`}
                loading="lazy"
              />
            </div>
          </section>
        )}

        {/* Embedded PDF Viewer Fallback when no Heyzine */}
        {hasPdf && !hasHeyzine && !hasIssuu && (
          <div className="border border-border">
            <iframe src={pdf} className="w-full h-[800px]" title={`${m.title} digital edition`} loading="lazy" />
          </div>
        )}

        {/* ARTICLES FROM THIS ISSUE */}
        {issueArticles.length > 0 && (
          <section className="mt-14 border-t-2 border-navy pt-8" aria-label="Articles from this issue">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <span className="text-brand text-[11px] font-bold uppercase tracking-[0.25em] block">
                  Edition Highlights
                </span>
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-navy mt-1">
                  Articles From This Issue
                </h2>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">
                {issueArticles.length} {issueArticles.length === 1 ? "story" : "stories"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
              {issueArticles.map((article) => (
                <ArticleCard key={article.id} a={article} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
