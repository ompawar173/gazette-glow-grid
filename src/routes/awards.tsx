import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/awards")({
  head: () => ({
    meta: [
      { title: "Awards — CIO Times" },
      { name: "description", content: "The CIO Times Awards recognize excellence in enterprise technology leadership." },
      { property: "og:title", content: "Awards — CIO Times" },
      { property: "og:description", content: "Recognizing excellence in enterprise technology leadership." },
    ],
  }),
  component: Awards,
});

const AWARDS = [
  { name: "CIO of the Year", desc: "Honors the CIO whose vision and execution most transformed their organization." },
  { name: "AI Innovation Award", desc: "For the enterprise AI deployment with the most demonstrable business impact." },
  { name: "Cybersecurity Leader", desc: "For the security team that best defended, detected, and responded during the year." },
  { name: "Cloud Transformation", desc: "For the most ambitious and successful cloud modernization program." },
  { name: "Rising Star", desc: "For the sub-40 technology leader most likely to reshape their industry." },
];

function Awards() {
  return (
    <SiteLayout>
      <div className="max-w-[1000px] mx-auto px-4 py-10">
        <div className="divider-thick mb-3" />
        <h1 className="text-4xl font-bold">The CIO Times Awards</h1>
        <p className="text-muted-foreground mt-2">Recognizing the leaders and teams defining enterprise technology.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {AWARDS.map((a) => (
            <div key={a.name} className="border border-border p-6">
              <div className="tag-chip">2026 Category</div>
              <h3 className="text-xl font-bold mt-1">{a.name}</h3>
              <p className="text-muted-foreground text-sm mt-2">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
