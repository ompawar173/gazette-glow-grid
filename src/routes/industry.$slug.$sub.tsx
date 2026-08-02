import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { getIndustryPage } from "@/lib/content.functions";
import { SITE_NAME, absoluteUrl, breadcrumbSchema, graph, pageMeta, truncate } from "@/lib/seo";

export const Route = createFileRoute("/industry/$slug/$sub")({
  loader: ({ params }) => getIndustryPage({ data: { slug: params.slug, sub: params.sub } }),
  head: ({ params, loaderData }) => {
    const { parent, child } = loaderData ?? {};
    const path = `/industry/${params.slug}/${params.sub}`;
    if (!parent || !child) {
      return { meta: [{ title: `Industry — ${SITE_NAME}` }, { name: "robots", content: "noindex, follow" }] };
    }
    const description = truncate(
      `${child.name} coverage within ${parent.name}: news, analysis and enterprise case studies from ${SITE_NAME}.`,
    );
    const base = pageMeta({
      title: `${child.name} — ${parent.name} | ${SITE_NAME}`,
      description,
      path,
      image: loaderData.articles[0]?.featured_image_url ?? null,
    });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: graph(
            {
              "@type": "CollectionPage",
              "@id": `${absoluteUrl(path)}#webpage`,
              url: absoluteUrl(path),
              name: `${child.name} — ${SITE_NAME}`,
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
              { name: parent.name, path: `/industry/${params.slug}` },
              { name: child.name, path },
            ]),
          ),
        },
      ],
    };
  },
  component: SubIndustryPage,
});

function SubIndustryPage() {
  const { slug } = Route.useParams();
  const { parent, child, articles } = Route.useLoaderData();

  return (
    <SiteLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link to="/industry" className="hover:text-brand">Industry</Link></li>
            <li aria-hidden="true">›</li>
            <li>
              <Link to="/industry/$slug" params={{ slug }} className="hover:text-brand">{parent?.name ?? slug}</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">{child?.name}</li>
          </ol>
        </nav>
        <div className="divider-thick mb-3" />
        <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">{parent?.name ?? "Industry"}</p>
        <h1 className="text-4xl font-bold text-navy">{child?.name ?? "Sub-industry"}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 mt-8">
          {(articles as unknown as ArticleLite[]).map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
        {articles.length === 0 && <p className="text-muted-foreground mt-8">No stories published in this sub-industry yet.</p>}
      </div>
    </SiteLayout>
  );
}
