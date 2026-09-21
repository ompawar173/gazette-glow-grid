import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getSitePage } from "@/lib/pages.functions";
import { SITE_NAME, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/awards")({
  loader: () => getSitePage({ data: { slug: "awards" } }),
  head: ({ loaderData }) => {
    const p = loaderData?.page;
    return pageMeta({
      title: p?.seo_title || `${p?.title ?? "Awards"} | ${SITE_NAME}`,
      description:
        p?.seo_description ||
        `The ${SITE_NAME} Leadership Awards recognize excellence, innovation, and strategic impact in enterprise technology.`,
      path: "/awards",
      image: p?.hero_image_url ?? null,
    });
  },
  component: Awards,
});

const AWARDS = [
  { name: "CIO of the Year", desc: "Honors the Chief Information Officer whose vision and execution transformed their enterprise." },
  { name: "AI Innovation Award", desc: "For the enterprise AI deployment delivering demonstrable business value and governance excellence." },
  { name: "Cybersecurity Leader", desc: "For the CISO and security team demonstrating exceptional resilience, risk management, and defense." },
  { name: "Cloud Transformation", desc: "For the most ambitious and successful enterprise infrastructure and cloud modernization program." },
  { name: "Rising Star", desc: "For the executive technology leader setting new benchmarks in digital leadership." },
];

function Awards() {
  const { page } = Route.useLoaderData();

  return (
    <SiteLayout>
      <div className="max-w-[1000px] mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">Awards</li>
          </ol>
        </nav>

        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">{page?.title ?? "The CIO Media World Leadership Awards"}</h1>
        {page ? (
          <div className="article-body mt-6" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <>
            <p className="text-muted-foreground mt-2 text-lg">Recognizing the executive leaders and technical teams defining enterprise excellence.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {AWARDS.map((a) => (
                <div key={a.name} className="border border-border p-6 bg-card">
                  <div className="tag-chip">Category</div>
                  <h3 className="text-xl font-bold text-navy mt-1">{a.name}</h3>
                  <p className="text-muted-foreground text-sm mt-2">{a.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
