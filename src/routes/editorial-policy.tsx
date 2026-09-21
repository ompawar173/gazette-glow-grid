import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EDITORIAL_EMAIL, SITE_NAME, pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/editorial-policy")({
  head: () =>
    pageMeta({
      title: `Editorial Standards & Policy | ${SITE_NAME}`,
      description:
        `Read ${SITE_NAME}'s editorial standards, reporting independence, source attribution, correction guidelines, and author responsibilities.`,
      path: "/editorial-policy",
    }),
  component: EditorialPolicyPage,
});

function EditorialPolicyPage() {
  return (
    <SiteLayout>
      <div className="max-w-[900px] mx-auto px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link to="/" className="hover:text-brand">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-navy">Editorial Policy</li>
          </ol>
        </nav>

        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold text-navy">Editorial Policy &amp; Standards</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Our commitment to objective, independent enterprise technology journalism for CIOs, CEOs, and business leaders.
        </p>

        <div className="article-body mt-8 space-y-6 text-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-navy mb-2">1. Editorial Independence</h2>
            <p>
              CIO Media World maintains absolute independence in its reporting and editorial decisions. Our journalism is guided solely by news value, technological significance, and utility to enterprise decision-makers. Editorial coverage, interviews, and analytical reports are never dictated by advertisers, sponsors, or commercial partners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-navy mb-2">2. Accuracy &amp; Fact-Checking</h2>
            <p>
              We prioritize rigorous accuracy across all published articles, executive profiles, and technical analyses. Our journalists verify data points, quote attributions, product claims, and enterprise metrics against primary documentation and authoritative expert sources prior to publication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-navy mb-2">3. Sources &amp; Attribution</h2>
            <p>
              Transparency in sourcing is essential to maintaining reader trust. CIO Media World clearly identifies primary sources, executive commentary, research benchmarks, and official corporate statements. On rare occasions where confidential sources are cited to protect executive privacy or sensitive enterprise disclosures, the source's credibility and context are rigorously vetted by newsroom editors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-navy mb-2">4. Corrections &amp; Updates Policy</h2>
            <p>
              When factual errors occur, CIO Media World is committed to correcting them promptly and transparently. Substantive corrections to published articles are documented with an editorial note detailing the update, timestamp, and nature of the correction. If you identify a factual error, please contact our editorial desk at{" "}
              <a href={`mailto:${EDITORIAL_EMAIL}`} className="text-brand font-semibold hover:underline">
                {EDITORIAL_EMAIL}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-navy mb-2">5. Author Responsibility &amp; Ethics</h2>
            <p>
              Our contributors and staff journalists adhere to professional standards of ethical reporting. Authors disclose any potential conflicts of interest, relevant professional background, or institutional affiliations. We prohibit plagiarism, undisclosed commercial compensation, and unauthorized artificial intelligence generative filler.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-navy mb-2">6. Commercial Coverage &amp; Sponsored Content</h2>
            <p>
              Any sponsored articles, partner insights, or paid special features are clearly demarcated with explicit labeling to distinguish them from independent newsroom coverage. Commercial partners have no control over CIO Media World's newsroom reporting.
            </p>
          </section>

          <div className="mt-10 p-6 bg-secondary/40 border border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy">Questions or Editorial Inquiries?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Reach out to our senior editors directly via our <Link to="/contact" className="text-brand font-semibold hover:underline">Contact Page</Link> or email <a href={`mailto:${EDITORIAL_EMAIL}`} className="text-brand font-semibold hover:underline">{EDITORIAL_EMAIL}</a>.
            </p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
