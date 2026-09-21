import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { getSitePage } from "@/lib/pages.functions";
import { SITE_NAME, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/newsletter")({
  loader: () => getSitePage({ data: { slug: "newsletter" } }),
  head: ({ loaderData }) => {
    const p = loaderData?.page;
    return pageMeta({
      title: p?.seo_title || `The Executive Brief | ${SITE_NAME} Newsletter`,
      description:
        p?.seo_description ||
        "Weekly enterprise technology intelligence for CIOs, CEOs, and technology leaders. Delivered every Tuesday morning.",
      path: "/newsletter",
      image: p?.hero_image_url ?? null,
    });
  },
  component: NewsletterPage,
});

function NewsletterPage() {
  const { page } = Route.useLoaderData();

  return (
    <SiteLayout>
      <div className="max-w-[760px] mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">Executive Brief</li>
          </ol>
        </nav>

        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">{page?.title ?? "The Executive Brief"}</h1>
        {page ? (
          <div className="article-body mt-4" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <div className="mt-4 space-y-4 text-foreground">
            <p className="text-lg font-medium text-navy leading-relaxed">
              Weekly enterprise technology intelligence for CIOs, CEOs, CTOs, and executive technology decision-makers. Delivered directly to your inbox every Tuesday morning.
            </p>

            <div className="bg-secondary/40 border border-border p-6 rounded-none space-y-4 my-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand">What Subscribers Receive</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span><strong>Enterprise Tech Headlines:</strong> Concise analysis of AI, cloud architecture, cybersecurity, and data strategy developments.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span><strong>Executive Strategy &amp; ROI:</strong> Real-world case studies on technology investment, IT governance, and digital transformation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand font-bold">✓</span>
                  <span><strong>Digital Magazine Exclusives:</strong> Early access to new digital magazine issues, special executive interviews, and industry reports.</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              Privacy Notice: We respect your inbox privacy. You can unsubscribe at any time with a single click. We never sell or share subscriber data.
            </p>
          </div>
        )}
        <div className="mt-8">
          <NewsletterSignup />
        </div>
      </div>
    </SiteLayout>
  );
}
