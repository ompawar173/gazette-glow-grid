import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { getIndustryPage } from "@/lib/content.functions";
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbSchema,
  graph,
  keywordsFrom,
  pageMeta,
  truncate,
} from "@/lib/seo";

export const Route = createFileRoute("/industry/$slug/")({
  loader: ({ params }) => getIndustryPage({ data: { slug: params.slug } }),
  head: ({ params, loaderData }) => {
    const parent = loaderData?.parent;
    const path = `/industry/${params.slug}`;
    if (!parent) {
      return { meta: [{ title: `Industry — ${SITE_NAME}` }, { name: "robots", content: "noindex, follow" }] };
    }
    const subs = loaderData.subs.map((s) => s.name);
    const description = truncate(
      `${parent.name} news, analysis and executive interviews from ${SITE_NAME}${subs.length ? `, covering ${subs.slice(0, 4).join(", ")}` : ""}.`,
    );
    const base = pageMeta({
      title: `${parent.name} News & Analysis — ${SITE_NAME}`,
      description,
      path,
      image: loaderData.articles[0]?.featured_image_url ?? null,
    });
    return {
      ...base,
      meta: [...base.meta, { name: "keywords", content: keywordsFrom(parent.name, ...subs).join(", ") }],
      scripts: [
        {
          type: "application/ld+json",
          children: graph(
            {
              "@type": "CollectionPage",
              "@id": `${absoluteUrl(path)}#webpage`,
              url: absoluteUrl(path),
              name: `${parent.name} — ${SITE_NAME}`,
              description,
              mainEntity: {
                "@type": "ItemList",
                itemListElement: loaderData.articles.slice(0, 10).map((a, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  url: absoluteUrl(`/article/${a.slug}`),
                  name: a.title,
                })),
              },
            },
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Industry", path: "/industry" },
              { name: parent.name, path },
            ]),
          ),
        },
      ],
    };
  },
  component: IndustryPage,
});

function IndustryPage() {
  const { slug } = Route.useParams();
  const { parent, subs, articles } = Route.useLoaderData();

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link to="/industry" className="hover:text-brand">Industry</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">{parent?.name ?? slug}</li>
          </ol>
        </nav>
        <div className="divider-thick mb-3" />
        <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">Industry</p>
        <h1 className="text-4xl font-bold text-navy">{parent?.name ?? "Industry"}</h1>

        {subs.length > 0 && (
          <nav aria-label="Sub-industries" className="flex flex-wrap gap-2 mt-4">
            {subs.map((s) => (
              <Link key={s.slug} to="/industry/$slug/$sub" params={{ slug, sub: s.slug }}
                className="border-2 border-navy text-navy px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-navy hover:text-navy-foreground">
                {s.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 mt-8">
          {(articles as unknown as ArticleLite[]).map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
        {articles.length === 0 && <p className="text-muted-foreground mt-8">No stories published in this industry yet.</p>}
      </div>
    </SiteLayout>
  );
}
