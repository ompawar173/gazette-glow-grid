import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { StorageImage } from "@/components/site/StorageImage";
import { getSitePage } from "@/lib/pages.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  loader: () => getSitePage({ data: { slug: "about" } }),
  head: ({ loaderData }) => {
    const p = loaderData?.page;
    return pageMeta({
      title: p?.seo_title || `${p?.title ?? "About Us"} — CIO Times`,
      description:
        p?.seo_description ||
        "CIO Times is the trusted publication for enterprise technology leaders — CIOs, CTOs, CDOs, and CEOs.",
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
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold">{page?.title ?? "About CIO Times"}</h1>
        {page?.hero_image_url && (
          <StorageImage src={page.hero_image_url} alt={page.title} className="lead-image my-6" />
        )}
        {page ? (
          <div className="article-body mt-6" dangerouslySetInnerHTML={{ __html: page.content }} />
        ) : (
          <div className="article-body mt-6">
            <p>CIO Times is a leading B2B technology publication read by more than 350,000 enterprise leaders across the Americas, EMEA, and APAC. Our mission is to deliver rigorous, independent reporting on the strategies, technologies, and people shaping the future of business.</p>
            <h2>Who We Serve</h2>
            <p>Our audience is composed primarily of chief information officers, chief technology officers, chief data officers, and the executive teams that partner with them — the leaders responsible for turning technology investment into business advantage.</p>
            <h2>Our Editorial Standards</h2>
            <p>Every piece we publish is reported by an experienced journalist, fact-checked against primary sources, and edited to the highest professional standards. We do not accept payment for editorial coverage.</p>
            <h2>Reach the Newsroom</h2>
            <p>Tips, pitches, and press inquiries: <a href="mailto:editorial@ciotimes.com">editorial@ciotimes.com</a></p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
