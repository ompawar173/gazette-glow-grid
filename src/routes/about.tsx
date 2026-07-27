import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — CIO Times" },
      { name: "description", content: "CIO Times is the trusted publication for enterprise technology leaders — CIOs, CTOs, CDOs, and CEOs." },
      { property: "og:title", content: "About Us — CIO Times" },
      { property: "og:description", content: "The trusted publication for enterprise technology leaders." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <div className="max-w-[900px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold">About CIO Times</h1>
        <div className="article-body mt-6">
          <p>CIO Times is a leading B2B technology publication read by more than 350,000 enterprise leaders across the Americas, EMEA, and APAC. Our mission is to deliver rigorous, independent reporting on the strategies, technologies, and people shaping the future of business.</p>
          <h2>Who We Serve</h2>
          <p>Our audience is composed primarily of chief information officers, chief technology officers, chief data officers, and the executive teams that partner with them — the leaders responsible for turning technology investment into business advantage.</p>
          <h2>Our Editorial Standards</h2>
          <p>Every piece we publish is reported by an experienced journalist, fact-checked against primary sources, and edited to the highest professional standards. We do not accept payment for editorial coverage.</p>
          <h2>Reach the Newsroom</h2>
          <p>Tips, pitches, and press inquiries: <a href="mailto:editorial@ciotimes.com">editorial@ciotimes.com</a></p>
        </div>
      </div>
    </SiteLayout>
  );
}
