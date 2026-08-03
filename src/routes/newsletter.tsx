import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";
import { getSitePage } from "@/lib/pages.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/newsletter")({
  loader: () => getSitePage({ data: { slug: "newsletter" } }),
  head: ({ loaderData }) => {
    const p = loaderData?.page;
    return pageMeta({
      title: p?.seo_title || `${p?.title ?? "The Executive Brief"} — CIO Times Newsletter`,
      description:
        p?.seo_description || "Weekly intelligence for CIOs and technology leaders.",
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
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold">{page?.title ?? "The Executive Brief"}</h1>
        {page ? (
          <div className="article-body mt-4" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <p className="text-muted-foreground mt-2 text-lg">
            Every Tuesday, our editors distill the week's most important developments in enterprise technology into a 5-minute read. Read by 120,000+ CIOs and senior technology leaders.
          </p>
        )}
        <div className="mt-8">
          <NewsletterSignup />
        </div>
      </div>
    </SiteLayout>
  );
}
