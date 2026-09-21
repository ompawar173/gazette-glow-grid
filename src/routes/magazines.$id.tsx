import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { resolveStorageUrl } from "@/lib/storage";
import { BacklinkList } from "@/components/site/BacklinkList";
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
  const { magazine: m } = Route.useLoaderData();
  const [pdf, setPdf] = useState("");

  useEffect(() => {
    let alive = true;
    resolveStorageUrl(m?.pdf_file_url).then((u) => alive && setPdf(u));
    return () => { alive = false; };
  }, [m?.pdf_file_url]);

  if (!m) {
    return (
      <SiteLayout>
        <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-navy">Issue not available</h1>
          <p className="text-muted-foreground mt-2">This issue may be unpublished or no longer exists.</p>
          <Link to="/magazines" className="inline-block mt-6 bg-brand text-brand-foreground px-6 py-3 text-sm font-bold uppercase tracking-widest">
            Browse all issues
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="max-w-[1000px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <StorageImage
          src={m.cover_image_url}
          alt={`${m.title} — ${m.issue_month ?? ""} ${m.issue_year ?? ""} issue cover`}
          width={600}
          height={800}
          priority
          className="w-full aspect-[3/4] object-cover border border-border"
        />
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link to="/" className="hover:text-brand">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link to="/magazines" className="hover:text-brand">Magazine</Link></li>
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="text-navy truncate max-w-[220px]">{m.title}</li>
            </ol>
          </nav>
          <div className="tag-chip">{m.issue_month} {m.issue_year} Issue</div>
          <h1 className="text-4xl font-bold mt-1 text-navy">{m.title}</h1>
          <p className="text-muted-foreground mt-4">
            Read the full digital edition of this issue. Perfect for offline reading.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            {pdf ? (
              <a href={pdf} target="_blank" rel="noopener noreferrer" className="bg-brand text-brand-foreground px-6 py-3 font-bold uppercase tracking-wide text-sm">
                Read Digital Version
              </a>
            ) : (
              <span className="text-muted-foreground text-sm">PDF coming soon.</span>
            )}
            <Link to="/magazines" className="border-2 border-navy text-navy px-6 py-3 font-bold uppercase tracking-wide text-sm">All Issues</Link>
          </div>
          {pdf && (
            <div className="mt-8 border border-border">
              <iframe src={pdf} className="w-full h-[800px]" title={`${m.title} digital edition`} loading="lazy" />
            </div>
          )}
          <BacklinkList targetType="magazine" targetId={m.id} title="Related Links & Sources" />
        </div>
      </div>
    </SiteLayout>
  );
}
