import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { getSitePage } from "@/lib/pages.functions";
import { EDITORIAL_EMAIL, SITE_NAME, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  loader: () => getSitePage({ data: { slug: "about" } }),
  head: ({ loaderData }) => {
    const p = loaderData?.page;
    return pageMeta({
      title: p?.seo_title || `${p?.title ?? "About Us"} | ${SITE_NAME}`,
      description:
        p?.seo_description ||
        `${SITE_NAME} is the trusted publication for enterprise technology leaders — CIOs, CTOs, CDOs, and CEOs shaping the digital economy.`,
      path: "/about",
      image: p?.hero_image_url ?? null,
    });
  },
  component: About,
});

function About() {
  const { page } = Route.useLoaderData();

  return (
    <SiteLayout>
      <div className="max-w-[900px] mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">About Us</li>
          </ol>
        </nav>

        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">{page?.title ?? "About CIO Media World"}</h1>
        {page?.hero_image_url && (
          <StorageImage src={page.hero_image_url} alt={page.title} className="lead-image my-6" />
        )}
        {page ? (
          <div className="article-body mt-6" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <div className="article-body mt-6 space-y-4 text-foreground leading-relaxed">
            <p>
              CIO Media World delivers rigorous, independent journalism on enterprise technology, operational leadership, digital transformation, and emerging innovation for executive decision-makers worldwide.
            </p>
            <h2 className="text-2xl font-bold text-navy pt-2">Who We Serve</h2>
            <p>
              Our audience includes Chief Information Officers, Chief Executive Officers, Chief Technology Officers, Chief Data Officers, CISOs, and enterprise business leaders responsible for turning technology investments into measurable strategic advantage.
            </p>
            <h2 className="text-2xl font-bold text-navy pt-2">Editorial Core Focus</h2>
            <p>
              We focus on five primary operational pillars essential to modern enterprise resilience:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><Link to="/industry/$slug" params={{ slug: "ai-analytics" }} className="text-brand font-semibold hover:underline">AI &amp; Analytics</Link> — Enterprise AI governance, generative AI ROI, and data strategy.</li>
              <li><Link to="/industry/$slug" params={{ slug: "ceo-insights" }} className="text-brand font-semibold hover:underline">CEO Insights</Link> — Technology-led growth, digital transformation, and executive leadership.</li>
              <li><Link to="/industry/$slug" params={{ slug: "cio-insights" }} className="text-brand font-semibold hover:underline">CIO Insights</Link> — Modernization, IT strategy, enterprise architecture, and operating models.</li>
              <li><Link to="/industry/$slug" params={{ slug: "cloud-infrastructure" }} className="text-brand font-semibold hover:underline">Cloud &amp; Infrastructure</Link> — Hybrid cloud, FinOps, observability, and platform engineering.</li>
              <li><Link to="/industry/$slug" params={{ slug: "cybersecurity" }} className="text-brand font-semibold hover:underline">Cybersecurity</Link> — Security governance, Zero Trust, threat intelligence, and risk preparedness.</li>
            </ul>
            <h2 className="text-2xl font-bold text-navy pt-2">Editorial Independence &amp; Standards</h2>
            <p>
              Every report, interview, and feature published by CIO Media World undergoes meticulous editorial review. We maintain strict editorial independence to ensure objective, trusted insights. Learn more on our <Link to="/editorial-policy" className="text-brand font-semibold hover:underline">Editorial Policy</Link> page.
            </p>
            <h2 className="text-2xl font-bold text-navy pt-2">Connect With Our Newsroom</h2>
            <p>
              For story pitches, press releases, or inquiries, reach out to our editorial desk at <a href={`mailto:${EDITORIAL_EMAIL}`} className="text-brand font-semibold hover:underline">{EDITORIAL_EMAIL}</a> or visit our <Link to="/contact" className="text-brand font-semibold hover:underline">Contact Page</Link>. You can also subscribe to our weekly intelligence briefing on <Link to="/newsletter" className="text-brand font-semibold hover:underline">The Executive Brief</Link>.
            </p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
