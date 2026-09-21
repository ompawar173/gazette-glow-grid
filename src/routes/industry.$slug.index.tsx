import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ArticleCard, type ArticleLite } from "@/components/site/ArticleCard";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
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

const CATEGORY_INTRODUCTIONS: Record<string, string> = {
  "ai-analytics":
    "Enterprise technology leaders are navigating the rapid shift from generative AI experimentation to production-grade deployment and measurable business value. CIO Media World's AI & Analytics desk delivers strategic reporting on enterprise AI strategy, generative models, predictive analytics, and scalable data infrastructure. We examine how chief information officers, chief data officers, and enterprise architects build robust AI governance frameworks, ensure data privacy, manage model risks, and modernize data pipelines. From measuring real ROI on LLM deployments and cloud data warehouse optimization to evaluating agentic workflows and data quality architectures, our reporting equips executive decision-makers with actionable intelligence to unlock competitive advantage through data-driven innovation.",
  "ceo-insights":
    "Chief Executive Officers face an unprecedented convergence of technological acceleration, market volatility, and digital business transformation. CIO Media World's CEO Insights hub focuses on the strategic intersection of technology leadership, corporate strategy, executive governance, and long-term value creation. Our editorial team investigates how progressive CEOs collaborate with CIOs and CTOs to drive technology-led growth, foster organizational agility, navigate global supply chain disruptions, and build cyber-resilient enterprises. Through executive interviews, strategic case studies, and board-level analysis, we provide chief executives with the operational perspectives necessary to turn technology investments into sustainable enterprise resilience.",
  "cio-insights":
    "The modern Chief Information Officer has evolved from a guardian of IT infrastructure into a key driver of enterprise growth, operational efficiency, and strategic execution. CIO Media World's CIO Insights coverage explores the critical decisions facing IT executives—from balancing legacy modernization with cloud-native innovation to leading multi-million-dollar technology investments and refining operating models. We unpack executive agenda priorities including talent acquisition, vendor governance, enterprise architecture, agile workforce transformation, and strategic budgeting. Discover how top CIOs build high-performing engineering cultures and partner across the C-suite to accelerate digital transformation.",
  "cloud-infrastructure":
    "Enterprise cloud strategy has transitioned from migration speed to cost optimization, workload performance, hybrid cloud governance, and operational resilience. CIO Media World's Cloud & Infrastructure desk reports on multi-cloud orchestration, edge computing, serverless architectures, data storage platforms, and enterprise observability. We analyze how IT leaders reduce cloud waste, implement FinOps frameworks, maintain continuous reliability, and modernize legacy infrastructure for mission-critical applications. Through expert commentary and technical deep dives, we give infrastructure directors and enterprise architects the benchmarks required to build scalable, secure, and resilient infrastructure.",
  cybersecurity:
    "In an era of sophisticated threat vectors and stringent regulatory demands, cybersecurity leadership is foundational to enterprise trust and operational continuity. CIO Media World's Cybersecurity hub delivers reporting on CISO leadership, threat intelligence, identity and access management (IAM), Zero Trust architecture, and ransomware preparedness. We examine how chief information security officers align security strategy with business objectives, manage third-party supply chain risk, automate incident response, and cultivate a security-first corporate culture. Our analysis provides enterprise decision-makers with actionable insights to safeguard data assets and strengthen organizational resilience.",
};

export const Route = createFileRoute("/industry/$slug/")({
  loader: ({ params }) => getIndustryPage({ data: { slug: params.slug } }),
  head: ({ params, loaderData }) => {
    const parent = loaderData?.parent;
    const path = `/industry/${params.slug}`;
    if (!parent) {
      return { meta: [{ title: `Industry — ${SITE_NAME}` }, { name: "robots", content: "noindex, follow" }] };
    }
    const subs = loaderData.subs.map((s) => s.name);
    const customIntro = CATEGORY_INTRODUCTIONS[params.slug];
    const description = customIntro
      ? truncate(customIntro, 160)
      : truncate(
          `${parent.name} news, analysis and executive interviews from ${SITE_NAME}${subs.length ? `, covering ${subs.slice(0, 4).join(", ")}` : ""}.`,
        );
    const base = pageMeta({
      title: `${parent.name} News & Insights | ${SITE_NAME}`,
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
  const artList = articles as unknown as ArticleLite[];

  const introText = CATEGORY_INTRODUCTIONS[slug];
  const featuredArticle = artList[0];
  const remainingArticles = artList.slice(1);

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
        <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">Industry Intelligence</p>
        <h1 className="text-4xl font-bold text-navy">{parent?.name ?? "Industry"}</h1>

        {introText && (
          <div className="mt-4 p-5 bg-secondary/40 border-l-4 border-brand text-sm leading-relaxed text-foreground max-w-4xl">
            <p>{introText}</p>
          </div>
        )}

        {subs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Related Topic Hubs</h2>
            <nav aria-label="Sub-industries" className="flex flex-wrap gap-2">
              {(subs as { name: string; slug: string }[]).map((s) => (
                <Link key={s.slug} to="/industry/$slug/$sub" params={{ slug, sub: s.slug }}
                  className="border-2 border-navy text-navy px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-navy hover:text-navy-foreground transition-colors">
                  {s.name}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {featuredArticle && (
          <section aria-label="Featured Story" className="mt-10">
            <div className="divider-thick mb-4" />
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-brand mb-3">Featured Analysis</h2>
            <ArticleCard a={featuredArticle} size="lg" priority />
          </section>
        )}

        <section aria-label="Latest Articles" className="mt-12">
          <div className="divider-thick mb-4" />
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy mb-6">Latest Stories in {parent?.name ?? "Industry"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
            {remainingArticles.map((a) => <ArticleCard key={a.id} a={a} />)}
          </div>
          {artList.length === 0 && <p className="text-muted-foreground mt-8">No stories published in this industry yet.</p>}
        </section>

        <div className="mt-16">
          <NewsletterSignup />
        </div>
      </div>
    </SiteLayout>
  );
}
