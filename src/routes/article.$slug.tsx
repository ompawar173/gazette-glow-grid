import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { Sidebar } from "@/components/site/Sidebar";
import { BacklinkList } from "@/components/site/BacklinkList";
import { getArticlePage } from "@/lib/content.functions";
import {
  SITE_URL,
  SITE_NAME,
  absoluteImageUrl,
  absoluteUrl,
  breadcrumbSchema,
  graph,
  keywordsFrom,
  metaDescription,
  organizationSchema,
  pageMeta,
  readingTimeMinutes,
  stripHtml,
  websiteSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/article/$slug")({
  loader: ({ params }) => getArticlePage({ data: { slug: params.slug } }),
  head: ({ params, loaderData }) => {
    const article = loaderData?.article;
    if (!article) {
      return {
        meta: [{ title: `Article not found — ${SITE_NAME}` }, { name: "robots", content: "noindex, follow" }],
      };
    }
    const path = `/article/${params.slug}`;
    const description = metaDescription(article.excerpt, article.body);
    const tags = keywordsFrom(article.category, article.subcategory);
    const base = pageMeta({
      title: `${article.title} — ${SITE_NAME}`,
      description,
      path,
      image: article.featured_image_url,
      type: "article",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at ?? article.published_at,
      section: article.category,
      tags,
    });

    const image = absoluteImageUrl(article.featured_image_url);
    const crumbs = [
      { name: "Home", path: "/" },
      { name: "Industry", path: "/industry" },
      ...(loaderData.categorySlug
        ? [{ name: article.category, path: `/industry/${loaderData.categorySlug}` }]
        : []),
      { name: article.title, path },
    ];

    return {
      ...base,
      meta: [...base.meta, { name: "keywords", content: tags.join(", ") }, { name: "author", content: article.author_name }],
      scripts: [
        {
          type: "application/ld+json",
          children: graph(
            organizationSchema,
            websiteSchema,
            {
              "@type": "NewsArticle",
              "@id": `${absoluteUrl(path)}#article`,
              headline: article.title.slice(0, 110),
              name: article.title,
              description,
              url: absoluteUrl(path),
              mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
              datePublished: article.published_at,
              dateModified: article.updated_at ?? article.published_at,
              articleSection: article.category,
              keywords: tags.join(", "),
              inLanguage: "en-US",
              wordCount: stripHtml(article.body).split(/\s+/).filter(Boolean).length,
              author: {
                "@type": "Person",
                name: article.author_name,
                ...(article.author_title ? { jobTitle: article.author_title } : {}),
              },
              publisher: { "@id": `${SITE_URL}/#organization` },
              ...(image
                ? { image: { "@type": "ImageObject", url: image, caption: article.title } }
                : {}),
            },
            breadcrumbSchema(crumbs),
          ),
        },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { article, related, categorySlug, subSlug } = Route.useLoaderData();

  useEffect(() => {
    if (article) supabase.rpc("increment_article_views", { _slug: slug });
  }, [slug, article]);

  const body = useMemo(
    () => (article?.body ?? "").replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2"),
    [article?.body],
  );

  if (!article) {
    return (
      <SiteLayout>
        <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <Link to="/" className="text-brand mt-3 inline-block">Back home</Link>
        </div>
      </SiteLayout>
    );
  }

  const minutes = readingTimeMinutes(article.body);
  const published = article.published_at ? new Date(article.published_at) : null;
  const updated = article.updated_at ? new Date(article.updated_at) : null;
  const showUpdated = published && updated && updated.getTime() - published.getTime() > 86_400_000;

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <article>
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link to="/" className="hover:text-brand">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/industry" className="hover:text-brand">Industry</Link></li>
              {categorySlug && (
                <>
                  <li aria-hidden="true">›</li>
                  <li>
                    <Link to="/industry/$slug" params={{ slug: categorySlug }} className="hover:text-brand">
                      {article.category}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="truncate max-w-[220px] text-navy">{article.title}</li>
            </ol>
          </nav>

          <div className="tag-chip">{article.category}{article.subcategory ? ` · ${article.subcategory}` : ""}</div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-2">{article.title}</h1>
          {article.excerpt && <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>}
          <div className="mt-4 pb-4 border-b border-border text-sm">
            <span className="font-bold">{article.author_name}</span>
            {article.author_title && <span className="text-muted-foreground"> · {article.author_title}</span>}
            {published && (
              <span className="text-muted-foreground">
                {" · "}
                <time dateTime={published.toISOString()}>
                  {published.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </span>
            )}
            <span className="text-muted-foreground"> · {minutes} min read</span>
            {showUpdated && updated && (
              <span className="text-muted-foreground">
                {" · Updated "}
                <time dateTime={updated.toISOString()}>
                  {updated.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </span>
            )}
          </div>
          {article.featured_image_url && (
            <StorageImage
              src={article.featured_image_url}
              alt={article.title}
              width={1200}
              height={675}
              priority
              className="w-full aspect-[16/9] object-cover my-6"
            />
          )}
          <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />

          <section aria-label="Topics" className="mt-8 flex flex-wrap gap-2">
            {categorySlug && (
              <Link to="/industry/$slug" params={{ slug: categorySlug }} className="tag-chip hover:text-brand">
                {article.category}
              </Link>
            )}
            {categorySlug && subSlug && article.subcategory && (
              <Link
                to="/industry/$slug/$sub"
                params={{ slug: categorySlug, sub: subSlug }}
                className="tag-chip hover:text-brand"
              >
                {article.subcategory}
              </Link>
            )}
            <Link to="/articles" className="tag-chip hover:text-brand">All articles</Link>
          </section>

          <BacklinkList targetType="article" targetId={article.id} title="Related Links & Sources" />

          {related.length > 0 && (
            <section className="mt-10" aria-label={`Related articles in ${article.category}`}>
              <div className="divider-thick mb-4" />
              <h2 className="text-xl font-bold uppercase tracking-wide mb-4">Related in {article.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(related as ArticleLite[]).map((r) => <ArticleCard key={r.id} a={r} />)}
              </div>
            </section>
          )}
        </article>
        <Sidebar trending={related as ArticleLite[]} mostRead={related as ArticleLite[]} />
      </div>
    </SiteLayout>
  );
}
